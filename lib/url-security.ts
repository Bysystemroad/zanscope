import { isIP } from "node:net";
import { lookup } from "node:dns/promises";

const BLOCKED_HOSTNAMES = new Set(["localhost", "localhost.localdomain"]);
const MAX_URL_LENGTH = 2048;

function isPrivateIpv4(address: string) {
  const parts = address.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b] = parts;

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIpv6(address: string) {
  const normalized = address.toLowerCase();
  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  if (mappedIpv4) return isPrivateIpv4(mappedIpv4);

  return (
    normalized === "::1" ||
    normalized === "::" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe80")
  );
}

function isBlockedAddress(address: string) {
  const version = isIP(address);
  if (version === 4) return isPrivateIpv4(address);
  if (version === 6) return isPrivateIpv6(address);
  return true;
}

export async function assertSafePublicHttpUrl(input: string) {
  if (!input || input.length > MAX_URL_LENGTH) return null;

  let url: URL;
  try {
    url = new URL(input.startsWith("http://") || input.startsWith("https://") ? input : `https://${input}`);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;

  const hostname = url.hostname.toLowerCase();
  if (!hostname || BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith(".local")) return null;
  if (hostname === "169.254.169.254" || hostname === "metadata.google.internal") return null;

  const literalIpVersion = isIP(hostname);
  if (literalIpVersion && isBlockedAddress(hostname)) return null;

  if (!literalIpVersion) {
    try {
      const records = await lookup(hostname, { all: true, verbatim: true });
      if (records.length === 0 || records.some((record) => isBlockedAddress(record.address))) return null;
    } catch {
      return null;
    }
  }

  return url;
}
