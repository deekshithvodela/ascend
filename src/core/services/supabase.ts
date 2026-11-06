/**
 * Supabase Client Configuration & Official Service for Ascend
 */
import { createClient, SupabaseClient, Session, User } from '@supabase/supabase-js';

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

export const supabase: SupabaseClient = createClient(
  SUPABASE_CONFIG.url,
  SUPABASE_CONFIG.anonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'ascend_supabase_auth_token',
    },
  }
);

export class SupabaseService {
  /**
   * Authenticates user via Supabase Auth email and password.
   */
  public static async signIn(email: string, password: string): Promise<{ session: Session | null; user: User | null }> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      throw error;
    }
    return { session: data.session, user: data.user };
  }

  /**
   * Signs out current user session.
   */
  public static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  /**
   * Retrieves active session if present.
   */
  public static async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  /**
   * Subscribes to auth state changes (login, logout, token refresh).
   */
  public static onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  }

  /**
   * Subscribes to Realtime Postgres Changes for an active competition event.
   */
  public static subscribeToEvent(
    eventId: string,
    onUpdate: (payload: { table: string; eventType: string; newRecord: any }) => void
  ) {
    const channel = supabase
      .channel(`event-realtime-${eventId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'attempts', filter: `event_id=eq.${eventId}` },
        (payload) => onUpdate({ table: 'attempts', eventType: payload.eventType, newRecord: payload.new })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eventId}` },
        (payload) => onUpdate({ table: 'events', eventType: payload.eventType, newRecord: payload.new })
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'athletes', filter: `event_id=eq.${eventId}` },
        (payload) => onUpdate({ table: 'athletes', eventType: payload.eventType, newRecord: payload.new })
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}

export class SupabaseAdapter {
  private static url = SUPABASE_CONFIG.url;
  private static key = SUPABASE_CONFIG.anonKey;

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
