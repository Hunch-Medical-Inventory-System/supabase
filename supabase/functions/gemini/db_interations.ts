import { createClient } from "npm:@supabase/supabase-js";

// init supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnnonKey = Deno.env.get("SUPABASE_ANNON_KEY");
if (!supabaseUrl || !supabaseAnnonKey) {
  throw new Error("Missing Supabase credentials");
}
const supabaseClient = createClient(supabaseUrl, supabaseAnnonKey);

/**
 * Reads rows from a table given a seperator and seperator value.
 * @param table The table to read from.
 * @param seperator The column to filter by.
 * @param seperatorValue The value to filter by.
 * @param columns The columns to select. Defaults to all columns.
 * @returns An array of objects, each representing a row in the table.
 * @throws An error if the request fails.
 */
const readRowsFromTable = async <T extends keyof DeletableTableMapping>(
  table: T,
  seperator?: string,
  seperatorValue?: Array<any>,
  columns?: Array<string | keyof DeletableTableMapping[T]>
): Promise<Partial<DeletableTableMapping[T]>[]> => {
  try {
    let query = supabaseClient
      .from(table)
      .select(columns?.join(",") || "*")
      .eq("is_deleted", false);

    if (seperator && seperatorValue) {
      query = query.eq(seperator, seperatorValue.join(","));
    }

    const response = await query;
    if (response.error || !response.data) {
      throw new Error(response.error?.message ?? "Unknown error");
    }
    return response.data as unknown as Partial<DeletableTableMapping[T]>[];
  } catch (error: any) {
    console.error(`Error fetching row from ${table}:`, error.message);
    return [];
  }
};

export { readRowsFromTable };