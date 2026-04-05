# frappe-js-sdk

TypeScript/JavaScript library for a [Frappe Framework](https://frappeframework.com) backend.

<br />
<p align="center">
  <a href="https://github.com/The-Commit-Company/frappe-js-sdk"><img src="https://img.shields.io/maintenance/yes/2026?style=flat-square" /></a>
  <a href="https://github.com/The-Commit-Company/frappe-js-sdk"><img src="https://img.shields.io/github/license/The-Commit-Company/frappe-js-sdk?style=flat-square" /></a>
  <a href="https://www.npmjs.com/package/frappe-js-sdk"><img src="https://img.shields.io/npm/v/frappe-js-sdk?style=flat-square" /></a>
    <a href="https://www.npmjs.com/package/frappe-js-sdk"><img src="https://img.shields.io/npm/dw/frappe-js-sdk?style=flat-square" /></a>
</p>

## Features

The library currently supports the following features:

- 🔐 Authentication - login with username and password (cookie based) + token based authentication
- 🗄 Database - Get document, get list of documents, get count, create, update and delete documents
- 📄 File upload
- 🤙🏻 API calls

We plan to add the following features in the future:

- Support for common functions like `exists` in the database.

## Maintainers

| Maintainer     | GitHub                                          | Social                                                       |
| -------------- | ----------------------------------------------- | ------------------------------------------------------------ |
| Nikhil Kothari | [nikkothari22](https://github.com/nikkothari22) | [@nik_kothari22](https://twitter.com/nik_kothari22)          |
| Janhvi Patil   | [janhvipatil](https://github.com/janhvipatil)   | [@janhvipatil_](https://twitter.com/janhvipatil_)           |
| Sumit Jain     | [sumitjain236](https://github.com/sumitjain236) | [LinkedIn](https://www.linkedin.com/in/sumit-jain-66bb5719a) |

## Installation

```bash
npm install frappe-js-sdk
```

or

```bash
yarn add frappe-js-sdk
```

## Initialising the library

To get started, initialise the library:

```js
import { FrappeApp } from 'frappe-js-sdk';
//Add your Frappe backend's URL
const frappe = new FrappeApp('https://test.frappe.cloud');
```

In case you want to use the library with token based authentication (OAuth bearer tokens or API key/secret pairs), you can initialise the library like this:

```js
import { FrappeApp } from "frappe-js-sdk";

const frappe = new FrappeApp("https://test.frappe.cloud", {
    useToken: true,
    // Pass a custom function that returns the token as a string - this could be fetched from LocalStorage or auth providers like Firebase, Auth0 etc.
    token: getTokenFromLocalStorage(),
    // This can be "Bearer" or "token"
    type: "Bearer"
})
```

## Authentication

#### Initialise the auth library

```js
const auth = frappe.auth()
```

#### Login a user:

This makes an API call to the `/api/method/login` endpoint.

```js
auth
  .loginWithUsernamePassword({ username: 'admin', password: 'my-password' })
  .then((response) => console.log('Logged in'))
  .catch((error) => console.error(error));
```

#### Get currently logged in user:

This makes an API call to the `/api/method/frappe.auth.get_logged_user` endpoint.

```js
auth
  .getLoggedInUser()
  .then((user) => console.log(`User ${user} is logged in.`))
  .catch((error) => console.error(error));
```

#### Logout:

This makes an API call to the `/api/method/logout` endpoint.

```js
auth
  .logout()
  .then(() => console.log('Logged out.'))
  .catch((error) => console.error(error));
```

#### Forget Password

This makes an API sends a password reset link to the specified email address.

```js
auth
  .forgetPassword('example@example.com')
  .then(() => console.log('Password Reset Email Sent!'))
  .catch(() => console.error("We couldn't find your account."));
```

## Database

#### Initialise the database library

```js
const db = frappe.db();
```

#### Fetch document using document name

```js
db.getDoc('DocType', 'My DocType Name')
  .then((doc) => console.log(doc))
  .catch((error) => console.error(error));
```

#### Fetch list of documents

```js
db.getDocList('DocType')
  .then((docs) => console.log(docs))
  .catch((error) => console.error(error));
```

Optionally, a second argument can be provided to filter, sort, limit and paginate results.

```js
db.getDocList('DocType', {
  /** Fields to be fetched */
  fields: ['name', 'creation'],
  /** Filters to be applied - SQL AND operation */
  filters: [['creation', '>', '2021-10-09']],
  /** Filters to be applied - SQL OR operation */
  orFilters: [],
  /** Fetch from nth document in filtered and sorted list. Used for pagination  */
  limit_start: 5,
  /** Number of documents to be fetched. Default is 20  */
  limit: 10,
  /** Sort results by field and order  */
  orderBy: {
    field: 'creation',
    order: 'desc',
  },
  /** Group the results by particular field */
  groupBy: 'name',
  /** Fetch documents as a dictionary */
  asDict: false,
})
  .then((docs) => console.log(docs))
  .catch((error) => console.error(error));
```

Type declarations are available for the second argument in the source code.

#### Fetch number of documents with filters

```js
const filters = [['creation', '>', '2021-10-09']];
const debug = false; /** Default is false - Optional **/

db.getCount('DocType', filters, debug)
  .then((count) => console.log(count))
  .catch((error) => console.error(error));
```

#### Create a document

To create a new document, pass the name of the DocType and the fields to `createDoc`.

```js
db.createDoc('My Custom DocType', {
  name: 'Test',
  test_field: 'This is a test field',
})
  .then((doc) => console.log(doc))
  .catch((error) => console.error(error));
```

#### Update a document

To update an existing document, pass the name of the DocType, name of the document and the fields to be updated to `updateDoc`.

```js
db.updateDoc('My Custom DocType', 'Test', {
  test_field: 'This is an updated test field.',
})
  .then((doc) => console.log(doc))
  .catch((error) => console.error(error));
```

#### Delete a document

To create a new document, pass the name of the DocType and the name of the document to be deleted to `deleteDoc`.

```js
db.deleteDoc('My Custom DocType', 'Test')
  .then((response) => console.log(response.message)) // Message will be "ok"
  .catch((error) => console.error(error));
```

#### Rename a document

To rename a document, pass the name of the DocType, old name, new name, and an optional merge flag to `renameDoc`.

```js
db.renameDoc('My Custom DocType', 'Old Name', 'New Name')
  .then((response) => console.log(response.message)) // The message will reflect the updated document name.
  .catch((error) => console.error(error));
```

#### Get field values of a document

To retrieve document values, pass the name of the DocType, field names (string or array), filters, and additional parameters to `getValue`.

```js
/** Get single field value **/
db.getValue('My Custom DocType', 'Field_Name', [['Filter1', '=', 'Value1'],['Filter2', '=', 'Value2']])
  .then((doc) => console.log(doc))
  .catch((error) => console.error(error));

/** Get multiple field values **/
db.getValue('My Custom DocType', ['Field_Name1', 'Field_Name2'], [['Filter1', '=', 'Value1'],['Filter2', '=', 'Value2']])
  .then((doc) => console.log(doc))
  .catch((error) => console.error(error));
```

#### Set field values of a document

To set field values, pass the name of the DocType, document name, field name (or an object of field-value pairs), and an optional value to `setValue`.

```js
/** Set value of a single field **/
db.setValue('My Custom DocType', 'Test', 'Field_Name', 'Value')
  .then((doc) => console.log(doc))
  .catch((error) => console.error(error));

/** Set values of multiple fields **/
db.setValue('My Custom DocType', 'Test', {'Field_Name1':"Value1",'Field_Name2':"Value2"})
  .then((doc) => console.log(doc))
  .catch((error) => console.error(error));
```

#### Get field value from a single doctype

To retrieve a field value from a Single-type doctype, pass the name of the DocType and field name to `getSingleValue`.

```js
db.getSingleValue('My Custom Single DocType', 'Field_Name')
  .then((response) => console.log(response.message)) // Message will reflect the value of the field.
  .catch((error) => console.error(error));
```

#### Submit a document

To submit a document, pass the document object to `submit`.

```js
db.submit(doc)
  .then((doc) => console.log(doc))
  .catch((error) => console.error(error));
```

#### Cancel a document
To cancel a submitted document, pass the name of the DocType and document name to `cancel`.

```js
db.cancel('My Custom DocType', 'Test')
  .then((doc) => console.log(doc))
  .catch((error) => console.error(error));
```

## Usage with Typescript

The library supports Typescript out of the box.
For example, to enforce type on the `updateDoc` method:

```ts
interface TestDoc {
  test_field: string;
}
db.updateDoc<TestDoc>('My Custom DocType', 'Test', {
  test_field: 'This is an updated test field.',
});
```

The library also has an inbuilt type `FrappeDoc` which adds the following fields to your type declarations when you use it with the database methods:

```ts
export type FrappeDoc<T> = T & {
  /** User who created the document */
  owner: string;
  /** Date and time when the document was created - ISO format */
  creation: string;
  /** Date and time when the document was last modified - ISO format */
  modified: string;
  /** User who last modified the document */
  modified_by: string;
  idx: number;
  /** 0 - Saved, 1 - Submitted, 2 - Cancelled */
  docstatus: 0 | 1 | 2;
  parent?: any;
  parentfield?: any;
  parenttype?: any;
  /** The primary key of the DocType table */
  name: string;
};
```

All document responses are returned as an intersection of `FrappeDoc` and the specified type.

## API Calls

#### Initialise the call library

```ts
const call = frappe.call();
```

Make sure all endpoints are whitelisted (`@frappe.whitelist()`) in your backend

#### GET request

Make a GET request to your endpoint with parameters.

```js
const searchParams = {
  doctype: 'Currency',
  txt: 'IN',
};
call
  .get('frappe.desk.search_link', searchParams)
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

#### POST request

Make a POST request to your endpoint with parameters.

```js
const updatedFields = {
  doctype: 'User',
  name: 'Administrator',
  fieldname: 'interest',
  value: 'Frappe Framework, ERPNext',
};
call
  .post('frappe.client.set_value', updatedFields)
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

#### PUT request

Make a PUT request to your endpoint with parameters.

```js
const updatedFields = {
  doctype: 'User',
  name: 'Administrator',
  fieldname: 'interest',
  value: 'Frappe Framework, ERPNext',
};
call
  .put('frappe.client.set_value', updatedFields)
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

#### DELETE request

Make a DELETE request to your endpoint with parameters.

```js
const documentToBeDeleted = {
  doctype: 'Tag',
  name: 'Random Tag',
};
call
  .put('frappe.client.delete', documentToBeDeleted)
  .then((result) => console.log(result))
  .catch((error) => console.error(error));
```

## File Uploads

#### Initialise the file library

```ts
const file = frappe.file();
```

#### Upload a file with on progress callback

```js
const myFile; //Your File object

const fileArgs = {
  /** If the file access is private then set to TRUE (optional) */
  "isPrivate": true,
  /** Folder the file exists in (optional) */
  "folder": "Home",
  /** File URL (optional) */
  "file_url": "",
  /** Doctype associated with the file (optional) */
  "doctype": "User",
  /** Docname associated with the file (mandatory if doctype is present) */
  "docname": "Administrator",
  /** Field in the document **/
  "fieldname": "image"
}

file.uploadFile(
            myFile,
            fileArgs,
            /** Progress Indicator callback function **/
            (completedBytes, totalBytes) => console.log(Math.round((completedBytes / totalBytes) * 100), " completed")
        )
        .then(() => console.log("File Upload complete"))
        .catch(e => console.error(e))
```

## License

See [LICENSE](./LICENSE).
