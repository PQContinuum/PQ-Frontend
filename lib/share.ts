export type SharePayload = {
  title: string;
  content: string;
};

const encodeUtf8 = (value: string) => {
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    return window.btoa(
      encodeURIComponent(value).replace(/%([0-9A-F]{2})/g, (_, p1) =>
        String.fromCharCode(Number.parseInt(p1, 16))
      )
    );
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'utf-8').toString('base64');
  }

  return '';
};

const decodeUtf8 = (value: string) => {
  if (typeof window !== 'undefined' && typeof window.atob === 'function') {
    return decodeURIComponent(
      Array.from(window.atob(value))
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
  }

  if (typeof Buffer !== 'undefined') {
    return Buffer.from(value, 'base64').toString('utf-8');
  }

  return '';
};

const toBase64Url = (value: string) =>
  value.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

const fromBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return `${normalized}${padding}`;
};

export const encodeSharePayload = (payload: SharePayload) => {
  try {
    const json = JSON.stringify(payload);
    const base64 = encodeUtf8(json);
    return base64 ? toBase64Url(base64) : '';
  } catch {
    return '';
  }
};

export const decodeSharePayload = (payload: string): SharePayload | null => {
  try {
    const base64 = fromBase64Url(payload);
    const json = decodeUtf8(base64);
    const parsed = JSON.parse(json) as SharePayload;
    if (!parsed || typeof parsed.title !== 'string' || typeof parsed.content !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};
