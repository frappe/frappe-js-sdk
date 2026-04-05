import { FetchClient } from '../utils/fetch';

import { Error } from '../frappe_app/types';
import { FieldName, Filter, FrappeDoc, GetDocListArgs, GetLastDocArgs } from './types';

export class FrappeDB {
  /** URL of the Frappe App instance */
  private readonly appURL: string;

  /** Fetch client instance */
  readonly fetch: FetchClient;

  /** Whether to use the token based auth */
  readonly useToken: boolean;

  /** Token to be used for authentication */
  readonly token?: () => string;

  /** Type of token to be used for authentication */
  readonly tokenType?: 'Bearer' | 'token';

  constructor(
    appURL: string,
    fetch: FetchClient,
    useToken?: boolean,
    token?: () => string,
    tokenType?: 'Bearer' | 'token',
  ) {
    this.appURL = appURL;
    this.fetch = fetch;
    this.useToken = useToken ?? false;
    this.token = token;
    this.tokenType = tokenType;
  }

  /**
   * Get a document from the database
   * @param {string} doctype Name of the doctype
   * @param {string} docname Name of the document
   * @returns Promise which resolves to the document object
   */
  async getDoc<T = any>(doctype: string, docname: string = ''): Promise<FrappeDoc<T>> {
    return this.fetch
      .get<{ data: FrappeDoc<T> }>(`/api/resource/${doctype}/${encodeURIComponent(docname)}`)
      .then((res) => res.data)
      .catch((error: Error) => {
        throw {
          ...error,
          message: 'There was an error while fetching the document.',
        } as Error;
      });
  }

  /**
   * Gets a list of documents from the database for a particular doctype. Add filters, sorting order and pagination to get a filtered and sorted list of documents.
   * @param {string} doctype Name of the doctype
   * @param {@type GetDocListArgs} [args] Arguments for the query
   * @returns Promise which resolves to an array of documents
   */
  async getDocList<T = any, K = FrappeDoc<T>>(doctype: string, args?: GetDocListArgs<K>) {
    let params: Record<string, any> = {};

    if (args) {
      const { fields, filters, orFilters, orderBy, limit, limit_start, groupBy, asDict = true } = args;
      const orderByString = orderBy ? `${String(orderBy?.field)} ${orderBy?.order ?? 'asc'}` : '';
      params = {
        fields: fields ? JSON.stringify(fields) : undefined,
        filters: filters ? JSON.stringify(filters) : undefined,
        or_filters: orFilters ? JSON.stringify(orFilters) : undefined,
        order_by: orderByString,
        group_by: groupBy,
        limit,
        limit_start,
        as_dict: asDict,
      };
    }

    return this.fetch
      .get<{ data: T[] }>(`/api/resource/${doctype}`, { params })
      .then((res) => res.data)
      .catch((error: Error) => {
        throw {
          ...error,
          message: 'There was an error while fetching the documents.',
        } as Error;
      });
  }

  /** Creates a new document in the database
   * @param {string} doctype Name of the doctype
   * @param {Object} value Contents of the document
   * @returns Promise which resolves with the complete document object
   */
  async createDoc<T = any>(doctype: string, value: T): Promise<FrappeDoc<T>> {
    return this.fetch
      .post<{ data: FrappeDoc<T> }>(`/api/resource/${doctype}`, { ...value })
      .then((res) => res.data)
      .catch((error: Error) => {
        throw {
          ...error,
          message: error.message ?? 'There was an error while creating the document.',
        };
      });
  }

  /** Updates a document in the database
   * @param {string} doctype Name of the doctype
   * @param {string} docname Name of the document
   * @param {Object} value Contents of the document to update (only the fields that are to be updated)
   * @returns Promise which resolves with the complete document object
   */
  async updateDoc<T = any>(doctype: string, docname: string | null, value: Partial<T>): Promise<FrappeDoc<T>> {
    return this.fetch
      .put<{ data: FrappeDoc<T> }>(`/api/resource/${doctype}/${docname ? encodeURIComponent(docname) : docname}`, { ...value })
      .then((res) => res.data)
      .catch((error: Error) => {
        throw {
          ...error,
          message: error.message ?? 'There was an error while updating the document.',
        };
      });
  }

  /**
   * Deletes a document in the database
   * @param {string} doctype Name of the doctype
   * @param {string} docname Name of the document
   * @returns Promise which resolves an object with a message "ok"
   */
  async deleteDoc(doctype: string, docname?: string | null): Promise<{ message: string }> {
    return this.fetch
      .delete<{ message: string }>(`/api/resource/${doctype}/${docname ? encodeURIComponent(docname) : docname}`)
      .then((res) => res)
      .catch((error: Error) => {
        throw {
          ...error,
          message: 'There was an error while deleting the document.',
        } as Error;
      });
  }

  /**
   * Gets count of documents from the database for a particular doctype with the given filters
   * @param {string} doctype Name of the doctype
   * @param {@type Filter[]} [filters] Filters to be applied in the count query
   * @param {boolean} [debug] Whether to print debug messages or not
   * @returns Promise which resolves a number
   */
  async getCount<T = any>(
    doctype: string,
    filters?: Filter<T>[],
    debug: boolean = false,
  ): Promise<number> {
    const params: Record<string, any> = {
      doctype,
      filters: [],
    };

    if (debug) {
      params.debug = debug;
    }
    if (filters) {
      params.filters = filters ? JSON.stringify(filters) : undefined;
    }

    return this.fetch
      .get<{ message: number }>('/api/method/frappe.client.get_count', { params })
      .then((res) => res.message)
      .catch((error: Error) => {
        throw {
          ...error,
          message: 'There was an error while getting the count.',
        } as Error;
      });
  }

  /**
   * Get a document from the database
   * @param {string} doctype Name of the doctype
   * @param {@type GetLastDocArgs} [args] Arguments for the query
   * @returns Promise which resolves to the document object
   */
  async getLastDoc<T = any>(doctype: string, args?: GetLastDocArgs<FrappeDoc<T>>): Promise<FrappeDoc<T>> {
    let queryArgs: GetLastDocArgs<FrappeDoc<T>> = {
      orderBy: {
        field: 'creation',
        order: 'desc',
      },
    };
    if (args) {
      queryArgs = {
        ...queryArgs,
        ...args,
      };
    }

    const getDocLists = await this.getDocList<{ name: string }, FrappeDoc<T>>(doctype, {
      ...queryArgs,
      limit: 1,
      fields: ['name'],
    });
    if (getDocLists.length > 0) {
      return this.getDoc<T>(doctype, getDocLists[0].name);
    }

    return {} as FrappeDoc<T>;
  }

  /**
   * Renames a document from the database
   * @param {string} doctype Name of the doctype
   * @param {string} oldname Current name of the document
   * @param {string} newname The new name that will replace the `oldname`
   * @param {boolean} merge  Merges the old document into the new one if a document with `newname` already exists.
   * @returns Promise which resolves with the updated document name
   */
  async renameDoc<T = any>(
    doctype: string,
    oldname: string | null,
    newname: string | null,
    merge: boolean = false,
  ): Promise<FrappeDoc<T>> {
    return this.fetch
      .post<FrappeDoc<T>>('/api/method/frappe.client.rename_doc', {
        doctype,
        old_name: oldname,
        new_name: newname,
        merge,
      })
      .then((res) => res)
      .catch((error: Error) => {
        throw {
          ...error,
          message: error.message ?? 'There was an error while renaming the document.',
        };
      });
  }

  /**
   * Retrieves a document's value from the database for a specific doctype using the provided field names and filters.
   * @param {string} doctype Name of the doctype
   * @param {FieldName} [fieldname] - Fields to be returned (default `name`)
   * @param {Filter[]} [filters] Filters to be applied in the get query
   * @param {boolean} asDict Return as dict(object) or list (array)
   * @param {boolean} [debug] Whether to print debug messages or not
   * @param {string} parent Parent doctype name to fetch child table record
   * @returns Promise which resolves an object with specified fieldnames
   */
  async getValue<T = any>(
    doctype: string,
    fieldname?: FieldName,
    filters?: Filter<T>[],
    asDict: boolean = true,
    debug: boolean = false,
    parent: string | null = null,
  ): Promise<T> {
    const params: Record<string, any> = {
      doctype,
      fieldname: '[]',
      filters: [],
      as_dict: asDict,
      debug,
      parent: null,
    };

    if (fieldname) {
      params.fieldname = typeof fieldname === 'object' ? JSON.stringify(fieldname) : fieldname;
    }

    if (filters) {
      params.filters = filters ? JSON.stringify(filters) : undefined;
    }

    if (parent) {
      params.parent = parent;
    }

    return this.fetch
      .get<T>('/api/method/frappe.client.get_value', { params })
      .then((res) => res)
      .catch((error: Error) => {
        throw {
          ...error,
          message: 'There was an error while getting the value.',
        } as Error;
      });
  }

  /**
   * Sets the field values in the database for the specified doctype.
   * @param {string} doctype Name of the doctype
   * @param {string} name Name of the document
   * @param {string | object} fieldname Fieldname(s) whose value(s) need to be set.
   * @param {any} value Value to be set in fieldname when updating a single field or if `fieldname` is a string.
   * @returns Promise which resolves an updated docoument
   */
  async setValue<T = any>(
    doctype: string,
    name: string,
    fieldname: string | object,
    value?: any,
  ): Promise<FrappeDoc<T>> {
    if (fieldname !== null && typeof fieldname === 'object' && !Array.isArray(fieldname)) {
      value = undefined;
    }

    return this.fetch
      .post<FrappeDoc<T>>('/api/method/frappe.client.set_value', {
        doctype,
        name,
        fieldname,
        value,
      })
      .then((res) => res)
      .catch((error: Error) => {
        throw {
          ...error,
          message: 'There was an error while setting the value.',
        } as Error;
      });
  }

  /**
   * Retrieves the field value from the database for a specific single doctype.
   * @param {string} doctype Name of the doctype
   * @param {string} field Name of the field
   * @returns Promise that resolves to the field's value.
   */
  async getSingleValue<T = any>(doctype: string, field: string): Promise<T> {
    const params: Record<string, any> = {
      doctype,
      field,
    };

    return this.fetch
      .get<T>('/api/method/frappe.client.get_single_value', { params })
      .then((res) => res)
      .catch((error: Error) => {
        throw {
          ...error,
          message: 'There was an error while getting the value of single doctype.',
        } as Error;
      });
  }

  /**
   * Submit a document.
   * @param {object} doc Document to be submitted
   * @returns Promise that resolves to a submitted document.
   */
  async submit<T = any>(doc: object): Promise<T> {
    return this.fetch
      .post<{ message: T }>('/api/method/frappe.client.submit', { doc })
      .then((res) => res.message)
      .catch((error: Error) => {
        throw {
          ...error,
          message: 'There was an error while submitting the document.',
        } as Error;
      });
  }

  /**
   * Cancel a document.
   * @param {string} doctype Name of the doctype
   * @param {string} name Name of the document to be cancelled
   * @returns Promise that resolves to a canceled document.
   */
  async cancel<T = any>(doctype: string, name: string): Promise<FrappeDoc<T>> {
    return this.fetch
      .post<FrappeDoc<T>>('/api/method/frappe.client.cancel', { doctype, name })
      .then((res) => res)
      .catch((error: Error) => {
        throw {
          ...error,
          message: 'There was an error while cancelling the document.',
        } as Error;
      });
  }
}
