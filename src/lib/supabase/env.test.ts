import { describe, expect, it } from "vitest";
import {
  assertSupabaseConfiguredForProduction,
  getSupabaseEnvStatus,
  isSupabaseConfigured,
} from "./env";

describe("Supabase env guardrails", () => {
  it("allows explicit demo mode outside production when public Supabase env vars are missing", () => {
    const env = { NODE_ENV: "development" };

    expect(getSupabaseEnvStatus(env)).toEqual({
      configured: false,
      isProduction: false,
      missingPublicEnvVars: [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      ],
    });
    expect(isSupabaseConfigured(env)).toBe(false);
  });

  it("fails loudly in production when required public Supabase env vars are missing", () => {
    const env = { NODE_ENV: "production" };

    expect(() => assertSupabaseConfiguredForProduction(env)).toThrow(
      "Production Supabase configuration is missing: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY",
    );
    expect(() => isSupabaseConfigured(env)).toThrow(
      "Production Supabase configuration is missing",
    );
  });

  it("reports configured production when both required public Supabase env vars are present", () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NODE_ENV: "production",
    };

    expect(getSupabaseEnvStatus(env)).toEqual({
      configured: true,
      isProduction: true,
      missingPublicEnvVars: [],
    });
    expect(isSupabaseConfigured(env)).toBe(true);
  });
});
