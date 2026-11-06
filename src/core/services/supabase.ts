/**
 * Supabase Client Configuration & Adapter for Ascend
 */

const getEnv = (key: string, fallback: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return fallback;
};

export const SUPABASE_CONFIG = {
  url: getEnv('VITE_SUPABASE_URL', 'https://texqrojyxrfwxzirgsmx.supabase.co'),
  anonKey: getEnv('VITE_SUPABASE_ANON_KEY', 'sb_publishable_IkRT2_qQ84-VFXMzPlSptQ_Kd7jLACL'),
  basePath: getEnv('VITE_BASE_PATH', '/ascend/'),
};

export class SupabaseAdapter {
  private static url = SUPABASE_CONFIG.url;
  private static key = SUPABASE_CONFIG.anonKey;

  /**
   * Helper to execute queries against Supabase PostgREST endpoints.
   */
  public static async query<T = any>(
    table: string,
    params: Record<string, string> = {},
    options: RequestInit = {}
  ): Promise<T[]> {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = `${this.url}/rest/v1/${table}${queryParams ? `?${queryParams}` : ''}`;

    const headers: Record<string, string> = {
      apikey: this.key,
      Authorization: `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const res = await fetch(endpoint, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase error [${res.status}]: ${err}`);
    }

    return res.json();
  }

  /**
   * Calls a Supabase RPC stored procedure (e.g. submit_referee_vote).
   */
  public static async rpc<T = any>(functionName: string, payload: Record<string, any>): Promise<T> {
    const endpoint = `${this.url}/rest/v1/rpc/${functionName}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        apikey: this.key,
        Authorization: `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase RPC error [${res.status}]: ${err}`);
    }

    return res.json();
  }
}
