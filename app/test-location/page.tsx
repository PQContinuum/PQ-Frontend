'use client';

import { PreciseLocationButton } from '@/app/chat/components/PreciseLocationButton';

export default function TestLocationPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Test: Precise Location Service
            </h1>
            <p className="text-gray-600 text-sm">
              Este es un test del sistema de geolocalización de máxima precisión.
            </p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Test Section */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Prueba la geolocalización
            </h2>
            <p className="text-sm text-gray-600">
              Haz clic en el botón para obtener tu ubicación precisa con dirección completa.
            </p>

            <PreciseLocationButton />
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              ℹ️ ¿Qué hace este test?
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• Solicita permiso de ubicación al navegador</li>
              <li>• Obtiene coordenadas GPS con alta precisión (maximumAge: 0, enableHighAccuracy: true)</li>
              <li>• Geocodifica usando Google Geocoding API</li>
              <li>• Extrae: calle, número, colonia, ciudad, estado, código postal</li>
              <li>• Evalúa calidad (excellent/good/fair/poor)</li>
              <li>• Genera advertencias si hay problemas de precisión o datos faltantes</li>
            </ul>
          </div>

          {/* Technical Details */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              📊 Detalles técnicos
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500 mb-1">GPS Settings</p>
                <ul className="text-gray-700 space-y-0.5">
                  <li>• enableHighAccuracy: true</li>
                  <li>• maximumAge: 0</li>
                  <li>• timeout: 15000ms</li>
                </ul>
              </div>
              <div>
                <p className="text-gray-500 mb-1">Quality Thresholds</p>
                <ul className="text-gray-700 space-y-0.5">
                  <li>• Excellent: ≤ 20m</li>
                  <li>• Good: ≤ 50m</li>
                  <li>• Fair: ≤ 100m</li>
                  <li>• Poor: &gt; 100m</li>
                </ul>
              </div>
            </div>
          </div>

          {/* API Endpoints Used */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-900 mb-2">
              🔗 APIs utilizadas
            </h3>
            <ul className="text-xs text-green-800 space-y-1 font-mono">
              <li>• navigator.geolocation.getCurrentPosition()</li>
              <li>• https://maps.googleapis.com/maps/api/geocode/json</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
