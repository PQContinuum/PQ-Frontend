/**
 * Location Validation for Backend
 * Validates GPS coordinates to prevent abuse and ensure data quality
 *
 * Checks:
 * - Valid geographic ranges
 * - Precision/accuracy thresholds
 * - Timestamp freshness
 * - Suspicious patterns (fake GPS detection)
 */

export interface LocationValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp?: number;
}

/**
 * Validate that coordinates are within valid geographic ranges
 */
function validateCoordinateRanges(lat: number, lng: number): LocationValidationResult {
  // Latitude must be between -90 and 90
  if (lat < -90 || lat > 90) {
    return {
      valid: false,
      error: `Latitud inválida: ${lat}. Debe estar entre -90 y 90.`,
    };
  }

  // Longitude must be between -180 and 180
  if (lng < -180 || lng > 180) {
    return {
      valid: false,
      error: `Longitud inválida: ${lng}. Debe estar entre -180 y 180.`,
    };
  }

  // Check for null island (0, 0) - common GPS error
  if (lat === 0 && lng === 0) {
    return {
      valid: false,
      error: 'Coordenadas inválidas: (0, 0) - "Null Island". Verifica tu GPS.',
    };
  }

  return { valid: true };
}

/**
 * Validate accuracy/precision threshold
 */
function validateAccuracy(
  accuracy: number | undefined,
  maxAccuracy: number = 500
): LocationValidationResult {
  if (accuracy === undefined || accuracy === null) {
    return {
      valid: true,
      warnings: ['No se proporcionó información de precisión'],
    };
  }

  // Accuracy must be positive
  if (accuracy <= 0) {
    return {
      valid: false,
      error: `Precisión inválida: ${accuracy}. Debe ser mayor a 0.`,
    };
  }

  // Check if accuracy is suspiciously good (possible fake GPS)
  if (accuracy < 1) {
    return {
      valid: false,
      error: `Precisión sospechosamente alta: ${accuracy}m. Posible GPS simulado.`,
    };
  }

  // Check if accuracy is too poor
  if (accuracy > maxAccuracy) {
    return {
      valid: false,
      error: `Precisión muy baja: ${Math.round(accuracy)}m. Se requiere máximo ${maxAccuracy}m. ` +
        `Intenta moverte a un área con mejor señal GPS.`,
    };
  }

  // Warning for poor accuracy
  if (accuracy > 100) {
    return {
      valid: true,
      warnings: [
        `Precisión baja: ${Math.round(accuracy)}m. Los resultados pueden ser menos precisos.`,
      ],
    };
  }

  return { valid: true };
}

/**
 * Validate timestamp freshness
 */
function validateTimestamp(
  timestamp: number | undefined,
  maxAgeSeconds: number = 60
): LocationValidationResult {
  if (timestamp === undefined || timestamp === null) {
    return {
      valid: true,
      warnings: ['No se proporcionó timestamp'],
    };
  }

  const now = Date.now();
  const age = (now - timestamp) / 1000; // seconds

  // Check if timestamp is in the future (clock skew or fake)
  if (timestamp > now + 5000) {
    // Allow 5 seconds of clock skew
    return {
      valid: false,
      error: 'Timestamp inválido: está en el futuro. Verifica el reloj de tu dispositivo.',
    };
  }

  // Check if location is too old
  if (age > maxAgeSeconds) {
    return {
      valid: false,
      error: `Ubicación muy antigua: ${Math.round(age)}s. Debe ser menor a ${maxAgeSeconds}s. ` +
        `Por favor, obtén una ubicación fresca.`,
    };
  }

  // Warning for slightly old location
  if (age > 30) {
    return {
      valid: true,
      warnings: [
        `Ubicación tiene ${Math.round(age)}s de antigüedad. Considera actualizar.`,
      ],
    };
  }

  return { valid: true };
}

/**
 * Detect common patterns of fake GPS apps
 */
function detectFakeGPS(location: LocationData): LocationValidationResult {
  const warnings: string[] = [];

  // Check for suspiciously precise coordinates (fake GPS often uses exact values)
  const latDecimals = location.lat.toString().split('.')[1]?.length || 0;
  const lngDecimals = location.lng.toString().split('.')[1]?.length || 0;

  // Real GPS typically has 6-7 decimals, fake GPS might have exact values
  if (latDecimals < 5 || lngDecimals < 5) {
    warnings.push(
      'Coordenadas con precisión inusual. Verifica que tu GPS esté funcionando correctamente.'
    );
  }

  // Check for coordinates that are too perfect (e.g., 19.432100, -99.133200)
  const latString = location.lat.toFixed(7);
  const lngString = location.lng.toFixed(7);

  // Count trailing zeros (fake GPS often has many)
  const latTrailingZeros = (latString.match(/0+$/)?.[0]?.length || 0);
  const lngTrailingZeros = (lngString.match(/0+$/)?.[0]?.length || 0);

  if (latTrailingZeros >= 3 || lngTrailingZeros >= 3) {
    warnings.push(
      'Coordenadas con patrón sospechoso. Esto puede indicar GPS simulado.'
    );
  }

  // Perfect accuracy values are suspicious
  if (
    location.accuracy &&
    (location.accuracy === 5 ||
      location.accuracy === 10 ||
      location.accuracy === 20)
  ) {
    warnings.push(
      'Precisión con valor exacto inusual. Posible GPS simulado.'
    );
  }

  if (warnings.length > 0) {
    return {
      valid: false,
      error: 'Se detectó un posible GPS simulado o alterado. Por favor, usa tu ubicación real.',
      warnings,
    };
  }

  return { valid: true };
}

/**
 * Check if coordinates are in a valid country (basic check)
 * This is a simple implementation - could be expanded with a proper database
 */
function validateGeographicLocation(
  lat: number,
  lng: number
): LocationValidationResult {
  // Check if in ocean (very rough check - could be improved)
  // Most land is concentrated in certain areas

  // Check if in middle of ocean (very rough approximation)
  const isLikelyOcean =
    (lat > -60 && lat < -30 && lng > -120 && lng < -60) || // South Pacific
    (lat > -10 && lat < 30 && lng > -40 && lng < 20) || // South Atlantic
    (lat > 30 && lat < 60 && lng > 160 && lng < -120); // North Pacific

  if (isLikelyOcean) {
    return {
      valid: true,
      warnings: [
        'Las coordenadas parecen estar en el océano. Verifica tu ubicación.',
      ],
    };
  }

  return { valid: true };
}

/**
 * Comprehensive location validation
 * Use this on the backend to validate all incoming location data
 */
export function validateLocation(
  location: LocationData,
  options: {
    maxAccuracy?: number;
    maxAgeSeconds?: number;
    strictMode?: boolean;
  } = {}
): LocationValidationResult {
  const {
    maxAccuracy = 200, // Max 200m accuracy by default
    maxAgeSeconds = 60, // Max 60s old by default
    strictMode = true, // Enable fake GPS detection by default
  } = options;

  // Check coordinate ranges
  const rangeResult = validateCoordinateRanges(location.lat, location.lng);
  if (!rangeResult.valid) {
    return rangeResult;
  }

  // Check accuracy
  const accuracyResult = validateAccuracy(location.accuracy, maxAccuracy);
  if (!accuracyResult.valid) {
    return accuracyResult;
  }

  // Check timestamp
  const timestampResult = validateTimestamp(location.timestamp, maxAgeSeconds);
  if (!timestampResult.valid) {
    return timestampResult;
  }

  // Check for fake GPS in strict mode
  if (strictMode) {
    const fakeGPSResult = detectFakeGPS(location);
    if (!fakeGPSResult.valid) {
      return fakeGPSResult;
    }
  }

  // Check geographic location
  const geoResult = validateGeographicLocation(location.lat, location.lng);

  // Combine all warnings
  const allWarnings = [
    ...(rangeResult.warnings || []),
    ...(accuracyResult.warnings || []),
    ...(timestampResult.warnings || []),
    ...(geoResult.warnings || []),
  ];

  return {
    valid: true,
    warnings: allWarnings.length > 0 ? allWarnings : undefined,
  };
}

/**
 * Quick validation for API endpoints
 */
export function validateLocationOrThrow(
  location: LocationData | null | undefined,
  options?: Parameters<typeof validateLocation>[1]
): asserts location is LocationData {
  if (!location) {
    throw new Error('Location data is required');
  }

  if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
    throw new Error('Invalid location data: lat and lng must be numbers');
  }

  const result = validateLocation(location, options);

  if (!result.valid) {
    throw new Error(result.error || 'Invalid location');
  }

  // Log warnings if any
  if (result.warnings && result.warnings.length > 0) {
    console.warn('[Location Validation]', result.warnings.join('; '));
  }
}
