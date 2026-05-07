const DEFAULT_BACKEND_URL = "http://localhost:8000";

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function stripApiV2Suffix(value: string): string {
  return value.replace(/\/api\/v2$/i, "");
}

export function getBackendBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL || DEFAULT_BACKEND_URL;
  return stripApiV2Suffix(trimTrailingSlash(configured));
}

export function getApiV2BaseUrl(): string {
  return `${getBackendBaseUrl()}/api/v2`;
}
