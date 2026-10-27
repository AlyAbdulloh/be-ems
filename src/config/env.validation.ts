const REQUIRED_ENV_VARS = ["EMS_DATABASE_URL", "JWT_SECRET"] as const;

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const missing = REQUIRED_ENV_VARS.filter((key) => !config[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }

  return config;
}
