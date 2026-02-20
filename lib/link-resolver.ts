import type { LinkType } from '@/types/link-resolver';

function normalizeUrl(input: string): URL | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed);
  } catch {
    // ignore
  }

  try {
    return new URL(`https://${trimmed}`);
  } catch {
    return null;
  }
}

function hostMatches(hostname: string, domain: string): boolean {
  const normalizedHost = hostname.toLowerCase();
  const normalizedDomain = domain.toLowerCase();
  return normalizedHost === normalizedDomain || normalizedHost.endsWith(`.${normalizedDomain}`);
}

function getHostname(input: string): string | null {
  const parsed = normalizeUrl(input);
  return parsed ? parsed.hostname.toLowerCase() : null;
}

const FACEBOOK_HOSTS = [
  'facebook.com',
  'fb.com',
  'fb.watch',
  'fb.me',
  'fb.gg',
];

export function getLinkTypeFromUrl(url: string): LinkType {
  const hostname = getHostname(url);
  if (!hostname) return 'web';
  if (hostMatches(hostname, 'x.com') || hostMatches(hostname, 'twitter.com')) return 'x';
  if (FACEBOOK_HOSTS.some((host) => hostMatches(hostname, host))) return 'facebook';
  if (hostMatches(hostname, 'instagram.com')) return 'instagram';
  if (hostMatches(hostname, 'tiktok.com')) return 'tiktok';
  return 'web';
}

export function extractFirstUrl(text: string): string | null {
  if (!text) return null;
  const urlRegex =
    /\b(https?:\/\/[^\s<>()]+|www\.[^\s<>()]+|(?:x\.com|twitter\.com|facebook\.com|fb\.com|fb\.watch|fb\.me|fb\.gg|instagram\.com|tiktok\.com)(?:\/[^\s<>()]+)?)/i;
  const match = text.match(urlRegex);
  if (!match) return null;

  let candidate = match[0];
  candidate = candidate.replace(/[),.;!?"']+$/g, '');

  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  const parsed = normalizeUrl(candidate);
  return parsed ? parsed.toString() : null;
}
