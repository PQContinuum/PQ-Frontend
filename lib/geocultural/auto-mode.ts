// Shared helpers to detect when the assistant should switch to GeoCultural mode

function normalizeSpanishText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z\s¿?¡!]/g, ' ');
}

const GEO_LOCATION_PATTERNS = [
  /donde\s+me\s+encuentro/,
  /donde\s+estoy/,
  /en\s+que\s+lugar\s+estoy/,
  /que\s+lugar\s+es\s+este/,
  /mi\s+ubicacion\s+actual/,
  /cual\s+es\s+mi\s+ubicacion/,
  /dime\s+mi\s+ubicacion/,
  /puedes\s+decirme\s+donde\s+estoy/,
  /en\s+que\s+sitio\s+estoy/,
  /donde\s+me\s+ubico/,
];

const GENERIC_GEO_KEYWORDS = ['ubicacion', 'donde estoy', 'donde me encuentro'];

export function shouldAutoEnableGeoCultural(message: string): boolean {
  if (!message) return false;

  const normalized = normalizeSpanishText(message);

  if (GEO_LOCATION_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }

  return GENERIC_GEO_KEYWORDS.some((keyword) => normalized.includes(keyword));
}
