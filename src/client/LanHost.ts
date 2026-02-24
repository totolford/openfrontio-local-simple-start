import { GAME_ID_REGEX } from "../core/Schemas";

export const LAN_HOST_ORIGIN_KEY = "openfront_host_origin";
const RUNTIME_PUBLIC_ORIGIN_PATH = "/runtime/public-origin.txt";
const RUNTIME_ORIGIN_MAX_AGE_MS = 12 * 60 * 60 * 1000;
const RUNTIME_ORIGIN_NULL_RETRY_MS = 2000;
let cachedRuntimeOrigin: string | null | undefined;
let cachedRuntimeOriginFetchedAt = 0;
let cachedPublicIpOrigin: string | null | undefined;

export function normalizeHostOrigin(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const hasExplicitProtocol =
    value.startsWith("http://") || value.startsWith("https://");

  const withProtocol =
    hasExplicitProtocol ? value : `http://${value}`;

  try {
    const url = new URL(withProtocol);
    const protocol = url.protocol === "https:" ? "https:" : "http:";
    const hostname = url.hostname;
    if (!hostname) return null;
    const host =
      hostname.includes(":") && !hostname.startsWith("[")
        ? `[${hostname}]`
        : hostname;
    const isLocalTunnelHost = hostname.toLowerCase().endsWith(".loca.lt");
    const port = url.port;

    if (protocol === "https:") {
      if (port === "" || port === "443") {
        return `${protocol}//${host}`;
      }
      // localtunnel exposes HTTPS on the default port; forcing :9000 breaks access
      if (isLocalTunnelHost && port === "9000") {
        return `${protocol}//${host}`;
      }
      return `${protocol}//${host}:${port}`;
    }

    if (port) {
      return port === "80"
        ? `${protocol}//${host}`
        : `${protocol}//${host}:${port}`;
    }

    if (hasExplicitProtocol) {
      return `${protocol}//${host}`;
    }

    return `${protocol}//${host}:9000`;
  } catch {
    return null;
  }
}

export function defaultHostInput(): string {
  const host = window.location.hostname || "localhost";
  const port = window.location.port || "9000";
  return `${host}:${port}`;
}

function isLoopbackHost(hostname: string): boolean {
  const value = hostname.trim().toLowerCase();
  return (
    value === "localhost" ||
    value === "127.0.0.1" ||
    value === "::1" ||
    value === "[::1]"
  );
}

async function getDetectedPublicOrigin(): Promise<string | null> {
  if (cachedPublicIpOrigin !== undefined) {
    return cachedPublicIpOrigin;
  }

  try {
    const response = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
    });
    if (!response.ok) {
      cachedPublicIpOrigin = null;
      return cachedPublicIpOrigin;
    }
    const payload = (await response.json()) as { ip?: string };
    const ip = typeof payload.ip === "string" ? payload.ip.trim() : "";
    if (!ip) {
      cachedPublicIpOrigin = null;
      return cachedPublicIpOrigin;
    }
    const port = window.location.port || "9000";
    cachedPublicIpOrigin = normalizeHostOrigin(`http://${ip}:${port}`);
    return cachedPublicIpOrigin;
  } catch {
    cachedPublicIpOrigin = null;
    return cachedPublicIpOrigin;
  }
}

export function getSavedHostOrigin(): string | null {
  const saved = localStorage.getItem(LAN_HOST_ORIGIN_KEY);
  if (!saved) return null;
  return normalizeHostOrigin(saved);
}

export function setSavedHostOrigin(raw: string): string | null {
  const origin = normalizeHostOrigin(raw);
  if (!origin) return null;
  localStorage.setItem(LAN_HOST_ORIGIN_KEY, origin);
  return origin;
}

export async function getRuntimePublicOrigin(): Promise<string | null> {
  const now = Date.now();
  if (
    cachedRuntimeOrigin !== undefined &&
    (cachedRuntimeOrigin !== null ||
      now - cachedRuntimeOriginFetchedAt < RUNTIME_ORIGIN_NULL_RETRY_MS)
  ) {
    return cachedRuntimeOrigin;
  }

  try {
    const response = await fetch(
      `${RUNTIME_PUBLIC_ORIGIN_PATH}?t=${Date.now()}`,
      {
        cache: "no-store",
      },
    );
    if (!response.ok) {
      cachedRuntimeOrigin = null;
      cachedRuntimeOriginFetchedAt = Date.now();
      return cachedRuntimeOrigin;
    }
    const raw = (await response.text()).trim();
    if (!raw) {
      cachedRuntimeOrigin = null;
      cachedRuntimeOriginFetchedAt = Date.now();
      return cachedRuntimeOrigin;
    }

    let parsedOrigin: string | null = null;
    try {
      const payload = JSON.parse(raw) as { origin?: string; updatedAt?: number };
      const age = Date.now() - (payload.updatedAt ?? 0);
      if (
        typeof payload.origin === "string" &&
        Number.isFinite(payload.updatedAt) &&
        age >= 0 &&
        age <= RUNTIME_ORIGIN_MAX_AGE_MS
      ) {
        parsedOrigin = normalizeHostOrigin(payload.origin);
      }
    } catch {
      // Backward compatibility with previous plain-text format.
      parsedOrigin = normalizeHostOrigin(raw);
    }

    cachedRuntimeOrigin = parsedOrigin;
    cachedRuntimeOriginFetchedAt = Date.now();
    return cachedRuntimeOrigin;
  } catch {
    cachedRuntimeOrigin = null;
    cachedRuntimeOriginFetchedAt = Date.now();
    return cachedRuntimeOrigin;
  }
}

export async function getPreferredHostOrigin(): Promise<string | null> {
  return getSavedHostOrigin() ?? (await getRuntimePublicOrigin());
}

export async function getBestHostInput(): Promise<string> {
  const preferred = await getPreferredHostOrigin();
  if (preferred) return preferred;
  const runtimeLocation = normalizeHostOrigin(window.location.origin);
  if (runtimeLocation) {
    try {
      const runtimeUrl = new URL(runtimeLocation);
      if (!isLoopbackHost(runtimeUrl.hostname)) {
        return runtimeLocation;
      }
    } catch {
      // ignore and fallback below
    }
  }

  const publicOrigin = await getDetectedPublicOrigin();
  if (publicOrigin) return publicOrigin;

  return defaultHostInput();
}

export async function getBestHostInputForHosting(): Promise<string> {
  const runtimeOrigin = await getRuntimePublicOrigin();
  if (runtimeOrigin) return runtimeOrigin;

  const runtimeLocation = normalizeHostOrigin(window.location.origin);
  if (runtimeLocation) {
    try {
      const runtimeUrl = new URL(runtimeLocation);
      if (!isLoopbackHost(runtimeUrl.hostname)) {
        return runtimeLocation;
      }
    } catch {
      // ignore and fallback below
    }
  }

  const publicOrigin = await getDetectedPublicOrigin();
  if (publicOrigin) return publicOrigin;

  return defaultHostInput();
}

export function extractGameId(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const direct = trimmed;
  if (GAME_ID_REGEX.test(direct)) {
    return direct;
  }

  if (!trimmed.startsWith("http")) {
    return null;
  }

  try {
    const url = new URL(trimmed);
    const match = url.pathname.match(/\/game\/([^/?#]+)/);
    const candidate = match?.[1];
    if (!candidate) return null;
    return GAME_ID_REGEX.test(candidate) ? candidate : null;
  } catch {
    return null;
  }
}
