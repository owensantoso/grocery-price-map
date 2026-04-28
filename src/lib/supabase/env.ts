const REQUIRED_PUBLIC_SUPABASE_ENV_VARS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type SupabaseEnv = Partial<
  Record<(typeof REQUIRED_PUBLIC_SUPABASE_ENV_VARS)[number] | "NODE_ENV", string>
>;

export function getSupabaseEnvStatus(env: SupabaseEnv = process.env) {
  const missingPublicEnvVars = REQUIRED_PUBLIC_SUPABASE_ENV_VARS.filter(
    (name) => !env[name],
  );

  return {
    configured: missingPublicEnvVars.length === 0,
    isProduction: env.NODE_ENV === "production",
    missingPublicEnvVars,
  };
}

export function assertSupabaseConfiguredForProduction(
  env: SupabaseEnv = process.env,
) {
  const status = getSupabaseEnvStatus(env);

  if (status.isProduction && !status.configured) {
    throw new Error(
      `Production Supabase configuration is missing: ${status.missingPublicEnvVars.join(", ")}`,
    );
  }
}

export function isSupabaseConfigured(env: SupabaseEnv = process.env) {
  assertSupabaseConfiguredForProduction(env);

  return getSupabaseEnvStatus(env).configured;
}
