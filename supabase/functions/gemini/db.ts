import { createClient, PostgrestSingleResponse } from "https://esm.sh/@supabase/supabase-js";
import type { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js";
import type {
  DataFetchOptions,
  DeletableTableMapping,
  EntityState,
} from "./types/tables.ts";

// Now you can access environment variables using Deno.env.get()
const superbaseURL = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

if (!superbaseURL || !supabaseAnonKey) {
    console.error("Supabase URL or Anon Key not found.");
}

const client: SupabaseClient = createClient(
  superbaseURL,
  supabaseAnonKey
);

/**
 * Handles the response from a Supabase query.
 *
 * @template T - The type of the data expected in the response.
 * @param {PostgrestSingleResponse<T[]>} response - The response object from Supabase.
 * @returns {Promise<{ data: T[]; count: number }>} A promise that resolves to an object containing the data and count.
 * @throws {Error} If there is an error in the response, it logs the error and throws an exception.
 */
const handleResponse = async <T>(
  response: PostgrestSingleResponse<T[]>
): Promise<{ data: T[]; count: number }> => {
  if (response.error) {
    console.error("Supabase Error:", response.error.message);
    throw new Error(response.error.message);
  }
  return {
    data: response.data || [],
    count: response.count || 0,
  };
};

/**
 * Reads rows from a specified table in the database.
 *
 * @template T - The key of the Deletable Table Mapping.
 * @param {T} table - The name of the table to read from.
 * @param {string} seperator - The column name to filter by.
 * @param {Array<any>} seperatorValue - The value to filter the column by.
 * @param {Array<string | keyof DeletableTableMapping[T]>} [columns=["*"]] - The columns to select from the table. Defaults to all columns.
 * @returns {Promise<Partial<DeletableTableMapping[T]>[]>} A promise that resolves to an array of partial rows from the table.
 * @throws Will throw an error if the database query fails.
 */
const readRowsFromTable = async <T extends keyof DeletableTableMapping>(
  table: T,
  seperator: string,
  seperatorValue: Array<any>,
  columns: Array<string | keyof DeletableTableMapping[T]> = ["*"] as const
): Promise<Partial<DeletableTableMapping[T]>[]> => {
  try {
    const response = await  client
      .from(table)
      .select(columns.join(","))
      .eq(seperator, seperatorValue.join(","));
    if (response.error || !response.data) {
      throw new Error(response.error?.message ?? "Unknown error");
    }
    return response.data as unknown as Partial<DeletableTableMapping[T]>[];
  } catch (error: any) {
    console.error(`Error fetching row from ${table}:`, error.message);
    return [];
  }
};

/**
 * Fetches deleted data from a specified table with pagination and filtering options.
 *
 * @template T - The type of the table name.
 * @param {T} table - The name of the table to fetch data from.
 * @param {DataFetchOptions} options - The options for data fetching, including pagination.
 * @param {Array<string | keyof DeletableTableMapping[T]>} [columns=["*"]] - The columns to select.
 * @param {(query: any) => any} filters - A function to apply filters to the query.
 * @returns {Promise<{ data: any[]; count: number }>} A promise that resolves to an object containing the fetched data and the total count.
 * @throws Will throw an error if the data fetching fails.
 */
const fetchTableData = async <T extends keyof DeletableTableMapping>(
  table: T,
  options: DataFetchOptions,
  columns: Array<string | keyof DeletableTableMapping[T]> = ["*"] as const,
  filters: (query: any) => any = () => {}
): Promise<{ data: any[]; count: number }> => {
  const startRange = options.itemsPerPage * (options.page - 1);
  const endRange = options.itemsPerPage * options.page - 1;

  try {
    const query =  client
      .from<T, any>(table)
      .select(columns.join(","), { count: "exact" })
      .eq("is_deleted", false);
    filters(query);
    const response = await query
      .order("id", { ascending: true })
      .range(startRange, endRange);
    return  handleResponse(response);
  } catch (error: any) {
    console.error(`Error fetching data from ${table}:`, error.message);
    throw error;
  }
};

/**
 * Reads data from a specified table and returns the data in an EntityState format.
 *
 * @template T - The key of the DeletableTableMapping which represents the table name.
 * @param {T} table - The name of the table to read data from.
 * @param {DataFetchOptions} options - The options to use when fetching data from the table.
 * @param {Array<string | keyof DeletableTableMapping[T]>} [columns=["*"]] - The columns to select.
 * @returns {Promise<EntityState<DeletableTableMapping[T]>>} - A promise that resolves to an EntityState object containing the fetched data.
 *
 * The returned EntityState object has the following structure:
 * - loading: A boolean indicating if the data is still being loaded.
 * - error: An error message if an error occurred, otherwise null.
 * - current: An object containing the fetched data and its count.
 *
 * If an error occurs during data fetching, the error message is set in the `error` property of the returned EntityState object.
 * The `loading` property is set to false once the data fetching is complete, regardless of success or failure.
 */
const readDataFromTable = async <T extends keyof DeletableTableMapping>(
  table: T,
  options: DataFetchOptions,
  columns: Array<string | keyof DeletableTableMapping[T]> = ["*"] as const
): Promise<EntityState<DeletableTableMapping[T]>> => {
  const data: EntityState<DeletableTableMapping[T]> = {
    loading: true,
    error: null,
    active: { data: [], count: 0 },
  };

  try {
    data.active = await  fetchTableData(table, options, columns);
  } catch (error: any) {
    data.error = error.message || "An error occurred";
  } finally {
    data.loading = false;
    return data;
  }
};

export {
  readRowsFromTable,
  readDataFromTable,
};