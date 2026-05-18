// env.ts — Read and validate the four AZURE_OPENAI_* environment variables.
// No fallback values; missing/empty => MissingEnvVarError.
// See project-design.md §3.1.

import type { EnvConfig } from "./types.js";

export class MissingEnvVarError extends Error {
  public readonly variableName: string;

  constructor(variableName: string) {
    super(`Required environment variable ${variableName} is missing or empty`);
    this.name = "MissingEnvVarError";
    this.variableName = variableName;
  }
}

const REQUIRED_VARS = [
  "AZURE_OPENAI_ENDPOINT",
  "AZURE_OPENAI_DEPLOYMENT",
  "AZURE_OPENAI_API_VERSION",
  "AZURE_OPENAI_API_KEY",
] as const;

/**
 * Reads the four AZURE_OPENAI_* env vars from the supplied process-env-like
 * object (defaults to process.env). Throws MissingEnvVarError on the FIRST
 * missing/empty value (checked in declaration order).
 *
 * No fallbacks. No defaults. No `.env` lookup.
 */
export function readEnv(env: NodeJS.ProcessEnv = process.env): EnvConfig {
  for (const name of REQUIRED_VARS) {
    const value = env[name];
    if (value === undefined || value === null || value === "") {
      throw new MissingEnvVarError(name);
    }
  }

  // After the loop, each variable is guaranteed non-empty. Type-assert via
  // explicit reads.
  const endpoint = env.AZURE_OPENAI_ENDPOINT as string;
  const deployment = env.AZURE_OPENAI_DEPLOYMENT as string;
  const apiVersion = env.AZURE_OPENAI_API_VERSION as string;
  const apiKey = env.AZURE_OPENAI_API_KEY as string;

  return { endpoint, deployment, apiVersion, apiKey };
}
