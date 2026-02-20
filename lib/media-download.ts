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

async function downloadFile(url: string, filename: string): Promise<void> {
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

  if (!isHlsUrl(playbackUrl)) {
    await downloadFile(playbackUrl, filename);
    return;
  }

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
