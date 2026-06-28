"use client";

import { createBrowserClient } from "@supabase/ssr";
import { assertSupabaseEnv } from "@/lib/env";
import type { Database } from "@/types/database";

export function createClient() {
  const env = assertSupabaseEnv();
  return createBrowserClient<Database>(env.supabaseUrl, env.supabaseAnonKey);
}
