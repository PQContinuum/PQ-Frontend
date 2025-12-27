# Continuum AI - Analisis de Costos y Recursos por Plan

**Documento para revision con equipo de administracion**
**Fecha:** Diciembre 2025
**Version:** 1.0

---

## Resumen Ejecutivo

Este documento detalla los limites de recursos, costos estimados de APIs y margenes de ganancia por cada plan de suscripcion de Continuum AI.

---

## 1. Precios de los Planes (MXN)

| Plan | Precio Mensual | Precio Anual | Ahorro Anual |
|------|----------------|--------------|--------------|
| **Gratis** | $0 MXN | $0 MXN | - |
| **Basico** | $349 MXN | $3,840 MXN | 8% |
| **Profesional** | $1,499 MXN | $16,490 MXN | 8% |
| **Enterprise** | $4,199 MXN | $46,190 MXN | 8% |

**Tipo de cambio estimado:** 1 USD = 17.50 MXN (ajustar segun mercado)

| Plan | Precio USD Aprox. |
|------|-------------------|
| Gratis | $0 USD |
| Basico | ~$20 USD |
| Profesional | ~$86 USD |
| Enterprise | ~$240 USD |

---

## 2. Generacion de Imagenes (gpt-image-1)

### 2.1 Costos de OpenAI por Imagen

| Calidad | Costo por Imagen | Resolucion |
|---------|-----------------|------------|
| **Low** (Rapida) | ~$0.02 USD | 1024x1024 |
| **Medium** (Balanceada) | ~$0.07 USD | 1024x1024 |
| **High** (Alta calidad) | ~$0.19 USD | 1024x1024 - 1536x1024 |

*Nota: Resoluciones mayores a 1024x1024 tienen un multiplicador de 1.3x*

### 2.2 Limites por Plan

| Plan | Por Dia | Por Mes | Calidades Permitidas | Resolucion Max |
|------|---------|---------|---------------------|----------------|
| **Gratis** | 3 | 15 | Low | 1024x1024 |
| **Basico** | 10 | 100 | Low, Medium | 1024x1024 |
| **Profesional** | 25 | 400 | Low, Medium, High | 1536x1024 |
| **Enterprise** | 100 | 2,000 | Low, Medium, High | 1536x1024 |

### 2.3 Costo Maximo Mensual por Plan (USD)

| Plan | Costo Max API | Ingreso Plan USD | Margen |
|------|---------------|------------------|--------|
| **Gratis** | $0.30 | $0 | -$0.30 |
| **Basico** | $7.00 | ~$20 | ~$13 (65%) |
| **Profesional** | $28.00 | ~$86 | ~$58 (67%) |
| **Enterprise** | $140.00 | ~$240 | ~$100 (42%) |

### 2.4 Escenario de Uso Promedio (50% del limite)

| Plan | Imagenes/Mes | Costo Estimado USD |
|------|--------------|-------------------|
| **Gratis** | 7-8 | $0.15 |
| **Basico** | 50 | $3.50 |
| **Profesional** | 200 | $14.00 |
| **Enterprise** | 1,000 | $70.00 |

---

## 3. Generacion de Videos (Kling V2.6 Pro via Fal.ai)

### 3.1 Costos de Fal.ai por Video

| Duracion | Sin Audio | Con Audio |
|----------|-----------|-----------|
| **5 segundos** | $0.35 USD | $0.70 USD |
| **10 segundos** | $0.70 USD | $1.40 USD |

*Costo base: $0.07/segundo sin audio, $0.14/segundo con audio*

### 3.2 Limites por Plan

| Plan | Por Dia | Por Mes | Duraciones | Modos | Audio |
|------|---------|---------|------------|-------|-------|
| **Gratis** | 1 | 3 | 5s | Text-to-Video | No |
| **Basico** | 3 | 20 | 5s | Text-to-Video | Si |
| **Profesional** | 8 | 60 | 5s, 10s | Text + Image-to-Video | Si |
| **Enterprise** | 20 | 200 | 5s, 10s | Text + Image-to-Video | Si |

### 3.3 Costo Maximo Mensual por Plan (USD)

| Plan | Costo Max API | Ingreso Plan USD | Margen Solo Video |
|------|---------------|------------------|-------------------|
| **Gratis** | $1.05 | $0 | -$1.05 |
| **Basico** | $14.00 | ~$20 | ~$6 (30%) |
| **Profesional** | $63.00 | ~$86 | ~$23 (27%) |
| **Enterprise** | $210.00 | ~$240 | ~$30 (13%) |

### 3.4 Escenario de Uso Promedio (50% del limite)

| Plan | Videos/Mes | Costo Estimado USD |
|------|------------|-------------------|
| **Gratis** | 1-2 | $0.52 |
| **Basico** | 10 | $7.00 |
| **Profesional** | 30 | $31.50 |
| **Enterprise** | 100 | $105.00 |

---

## 4. Text-to-Speech (TTS) - OpenAI

### 4.1 Costos de OpenAI TTS

| Modelo | Costo por Reproduccion |
|--------|----------------------|
| **tts-1** | ~$0.01 USD |
| **tts-1-hd** | ~$0.015 USD |

### 4.2 Limites por Plan

| Plan | Por Dia | Por Mes |
|------|---------|---------|
| **Gratis** | 5 | 150 |
| **Basico** | 20 | 600 |
| **Profesional** | 50 | 1,500 |
| **Enterprise** | 200 | 6,000 |

### 4.3 Costo Maximo Mensual por Plan (USD)

| Plan | Costo Max API | % del Ingreso |
|------|---------------|---------------|
| **Gratis** | $1.50 | N/A |
| **Basico** | $6.00 | 30% |
| **Profesional** | $15.00 | 17% |
| **Enterprise** | $60.00 | 25% |

---

## 5. Chat/Mensajes (GPT-4o)

### 5.1 Costos de OpenAI Chat API

| Tipo | Costo por 1M Tokens |
|------|---------------------|
| **Input** | ~$2.50 USD |
| **Output** | ~$10.00 USD |

**Mensaje tipico:** ~500 tokens input + ~500 tokens output
**Costo por mensaje:** ~$0.00625 USD ($0.00125 + $0.005)

### 5.2 Limites de Mensajes (segun landing page)

| Plan | Mensajes/Dia | Historial |
|------|--------------|-----------|
| **Gratis** | 20 | 7 dias |
| **Basico** | 100 | 30 dias |
| **Profesional** | Ilimitados* | Completo |
| **Enterprise** | Ilimitados* | Completo |

*"Ilimitados" = Fair use, estimado 500-1000 msgs/dia max

### 5.3 Costo Estimado Mensual por Plan (USD)

| Plan | Msgs Max/Mes | Costo API | % del Ingreso |
|------|--------------|-----------|---------------|
| **Gratis** | 600 | ~$3.75 | N/A |
| **Basico** | 3,000 | ~$18.75 | 94% |
| **Profesional** | 15,000* | ~$93.75 | 109% |
| **Enterprise** | 30,000* | ~$187.50 | 78% |

*Estimacion de uso intensivo

---

## 6. Memoria Compartida (Contexto)

### 6.1 Limites por Plan

| Plan | Max Items | Max Tokens | Extraccion | Retencion |
|------|-----------|------------|------------|-----------|
| **Gratis** | 10 | 150 | Manual | 30 dias |
| **Basico** | 30 | 300 | Cada 7 msgs | 60 dias |
| **Profesional** | 100 | 500 | Cada 5 msgs | 90 dias |
| **Enterprise** | 500 | 1,000 | Cada 3 msgs | 365 dias |

### 6.2 Funciones Premium

| Funcion | Gratis | Basico | Profesional | Enterprise |
|---------|--------|--------|-------------|------------|
| Extraccion Automatica | No | Si | Si | Si |
| Busqueda Semantica | No | No | Si | Si |
| Compresion Automatica | No | No | Si | Si |

---

## 7. Resumen de Costos Totales (Peor Escenario - 100% Uso)

| Plan | Imagenes | Videos | TTS | Chat | **Total API** | **Ingreso** | **Margen** |
|------|----------|--------|-----|------|---------------|-------------|------------|
| **Gratis** | $0.30 | $1.05 | $1.50 | $3.75 | **$6.60** | $0 | **-$6.60** |
| **Basico** | $7.00 | $14.00 | $6.00 | $18.75 | **$45.75** | ~$20 | **-$25.75** |
| **Profesional** | $28.00 | $63.00 | $15.00 | $93.75 | **$199.75** | ~$86 | **-$113.75** |
| **Enterprise** | $140.00 | $210.00 | $60.00 | $187.50 | **$597.50** | ~$240 | **-$357.50** |

---

## 8. Resumen de Costos (Escenario Realista - 30% Uso)

| Plan | Total API 30% | Ingreso | Margen | % Margen |
|------|---------------|---------|--------|----------|
| **Gratis** | ~$2.00 | $0 | **-$2.00** | N/A |
| **Basico** | ~$13.73 | ~$20 | **+$6.27** | 31% |
| **Profesional** | ~$59.93 | ~$86 | **+$26.07** | 30% |
| **Enterprise** | ~$179.25 | ~$240 | **+$60.75** | 25% |

---

## 9. Recomendaciones para Administracion

### 9.1 Ajustes Sugeridos para Mejorar Margen

1. **Plan Basico:**
   - Reducir videos de 20 a 15/mes
   - Reducir imagenes de 100 a 75/mes
   - Margen estimado mejora a ~40%

2. **Plan Profesional:**
   - Reducir videos de 60 a 40/mes
   - Reducir imagenes de 400 a 300/mes
   - Agregar limite de mensajes (ej: 500/dia)
   - Margen estimado mejora a ~45%

3. **Plan Enterprise:**
   - Reducir videos de 200 a 150/mes
   - Evaluar subir precio a $5,499 MXN/mes
   - Margen estimado mejora a ~40%

### 9.2 Usuarios Gratis - Control de Costos

- Costo promedio por usuario gratis: ~$2-3 USD/mes
- Recomendacion: Limitar funciones mas caras (videos) o eliminarlas del plan gratis
- Considerar: Videos solo para planes de pago

### 9.3 Metricas a Monitorear

1. **Uso promedio real** por usuario y por plan
2. **Conversion** de gratis a pago
3. **Costo real** vs estimado mensualmente
4. **Usuarios que alcanzan limites** (oportunidad de upgrade)

---

## 10. Archivos de Configuracion

Los limites se configuran en:

```
lib/memory/plan-limits.ts
```

Para ajustar limites, modificar las constantes:
- `TTS_LIMITS` - Limites de Text-to-Speech
- `IMAGE_GEN_LIMITS` - Limites de generacion de imagenes
- `VIDEO_GEN_LIMITS` - Limites de generacion de videos
- `PLAN_LIMITS` - Limites de memoria compartida

---

## 11. Graficas de Referencia

### Distribucion de Costos por Servicio (Plan Basico - Uso 100%)

```
Chat (Mensajes)    [==================] 41% ($18.75)
Videos             [==============    ] 31% ($14.00)
Imagenes           [=======           ] 15% ($7.00)
TTS                [======            ] 13% ($6.00)
```

### Distribucion de Costos por Servicio (Plan Profesional - Uso 100%)

```
Chat (Mensajes)    [==================] 47% ($93.75)
Videos             [==============    ] 32% ($63.00)
Imagenes           [======            ] 14% ($28.00)
TTS                [====              ] 7%  ($15.00)
```

---

## Notas Importantes

1. Los costos de API pueden variar segun cambios de precios de OpenAI y Fal.ai
2. El tipo de cambio USD/MXN afecta directamente los margenes
3. Se recomienda revisar este documento trimestralmente
4. Implementar alertas de uso para detectar usuarios con consumo excesivo

---

*Documento generado automaticamente para revision administrativa*
