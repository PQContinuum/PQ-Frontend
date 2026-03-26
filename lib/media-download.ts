import { cloudflareApi } from '@/lib/api-client';

function extractStreamUid(url: string): string | null {
  const videodeliveryMatch = url.match(/videodelivery\.net\/([^/]+)\//i);
  if (videodeliveryMatch?.[1]) return videodeliveryMatch[1];

  const streamMatch = url.match(/cloudflarestream\.com\/([^/]+)\//i);
  if (streamMatch?.[1]) return streamMatch[1];

  return null;
}

function isHlsUrl(url: string): boolean {
  return url.includes('.m3u8');
}

function isCloudflareUrl(url: string): boolean {
  return url.includes('cloudflarestream.com') || url.includes('videodelivery.net');
}

/**
 * Extract the base URL (origin) from a Cloudflare stream URL.
 * e.g. "https://customer-xxx.cloudflarestream.com/uid/manifest/video.m3u8"
 *    → "https://customer-xxx.cloudflarestream.com"
 */
function extractCloudflareBase(url: string): string | null {
  const match = url.match(/(https?:\/\/[^/]+cloudflarestream\.com)/i)
    || url.match(/(https?:\/\/[^/]+videodelivery\.net)/i);
  return match?.[1] || null;
}

/**
 * Build the direct Cloudflare download URL from the playback URL.
 * This avoids needing an API call (which requires auth).
 */
function buildDirectDownloadUrl(playbackUrl: string): string | null {
  const uid = extractStreamUid(playbackUrl);
  const base = extractCloudflareBase(playbackUrl);
  if (!uid || !base) return null;
  return `${base}/${uid}/downloads/default.mp4`;
}

async function downloadFile(url: string, filename: string): Promise<void> {
  // Cloudflare URLs return 302 redirects that fail with fetch() due to CORS.
  // Use window.location.href which works on mobile and handles redirects natively.
  if (isCloudflareUrl(url)) {
    window.location.href = url;
    return;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  const blob = await response.blob();
  const objectUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(objectUrl);
}

export async function downloadVideoMp4(playbackUrl: string, filename: string): Promise<void> {
  if (!playbackUrl) return;

  // Non-HLS: download directly
  if (!isHlsUrl(playbackUrl)) {
    await downloadFile(playbackUrl, filename);
    return;
  }

  // Try to build the download URL directly from the playback URL
  // This works without auth and avoids async API calls that break mobile downloads
  const directUrl = buildDirectDownloadUrl(playbackUrl);
  if (directUrl) {
    window.location.href = directUrl;
    return;
  }

  // Fallback: use the API to get the download URL (requires auth)
  const uid = extractStreamUid(playbackUrl);
  if (!uid) {
    throw new Error('Unable to extract video UID');
  }

  const download = await cloudflareApi.createVideoDownload(uid, true);
  if (!download.url) {
    throw new Error('MP4 download URL not available');
  }

  await downloadFile(download.url, filename);
}
