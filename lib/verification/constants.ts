import type { OccupationType } from "@/lib/api-client";

// ============================================================================
// COUNTRIES (ISO 3166-1 alpha-2)
// ============================================================================

export interface Country {
  code: string;
  name: string;
  phoneCode: string;
}

// Spanish-speaking countries first, then sorted alphabetically
export const COUNTRIES: Country[] = [
  // Latin America (Spanish-speaking)
  { code: "MX", name: "Mexico", phoneCode: "+52" },
  { code: "AR", name: "Argentina", phoneCode: "+54" },
  { code: "CO", name: "Colombia", phoneCode: "+57" },
  { code: "CL", name: "Chile", phoneCode: "+56" },
  { code: "PE", name: "Peru", phoneCode: "+51" },
  { code: "VE", name: "Venezuela", phoneCode: "+58" },
  { code: "EC", name: "Ecuador", phoneCode: "+593" },
  { code: "GT", name: "Guatemala", phoneCode: "+502" },
  { code: "CU", name: "Cuba", phoneCode: "+53" },
  { code: "BO", name: "Bolivia", phoneCode: "+591" },
  { code: "DO", name: "Republica Dominicana", phoneCode: "+1" },
  { code: "HN", name: "Honduras", phoneCode: "+504" },
  { code: "PY", name: "Paraguay", phoneCode: "+595" },
  { code: "SV", name: "El Salvador", phoneCode: "+503" },
  { code: "NI", name: "Nicaragua", phoneCode: "+505" },
  { code: "CR", name: "Costa Rica", phoneCode: "+506" },
  { code: "PA", name: "Panama", phoneCode: "+507" },
  { code: "UY", name: "Uruguay", phoneCode: "+598" },
  { code: "PR", name: "Puerto Rico", phoneCode: "+1" },
  // Spain
  { code: "ES", name: "Espana", phoneCode: "+34" },
  // USA (large Spanish-speaking population)
  { code: "US", name: "Estados Unidos", phoneCode: "+1" },
  // Separator - Other countries
  { code: "BR", name: "Brasil", phoneCode: "+55" },
  { code: "CA", name: "Canada", phoneCode: "+1" },
  { code: "FR", name: "Francia", phoneCode: "+33" },
  { code: "DE", name: "Alemania", phoneCode: "+49" },
  { code: "IT", name: "Italia", phoneCode: "+39" },
  { code: "PT", name: "Portugal", phoneCode: "+351" },
  { code: "GB", name: "Reino Unido", phoneCode: "+44" },
  { code: "JP", name: "Japon", phoneCode: "+81" },
  { code: "KR", name: "Corea del Sur", phoneCode: "+82" },
  { code: "CN", name: "China", phoneCode: "+86" },
  { code: "IN", name: "India", phoneCode: "+91" },
  { code: "AU", name: "Australia", phoneCode: "+61" },
  { code: "NZ", name: "Nueva Zelanda", phoneCode: "+64" },
  { code: "ZA", name: "Sudafrica", phoneCode: "+27" },
  { code: "EG", name: "Egipto", phoneCode: "+20" },
  { code: "AE", name: "Emiratos Arabes Unidos", phoneCode: "+971" },
  { code: "IL", name: "Israel", phoneCode: "+972" },
  { code: "TR", name: "Turquia", phoneCode: "+90" },
  { code: "RU", name: "Rusia", phoneCode: "+7" },
  { code: "PL", name: "Polonia", phoneCode: "+48" },
  { code: "NL", name: "Paises Bajos", phoneCode: "+31" },
  { code: "BE", name: "Belgica", phoneCode: "+32" },
  { code: "SE", name: "Suecia", phoneCode: "+46" },
  { code: "NO", name: "Noruega", phoneCode: "+47" },
  { code: "DK", name: "Dinamarca", phoneCode: "+45" },
  { code: "FI", name: "Finlandia", phoneCode: "+358" },
  { code: "CH", name: "Suiza", phoneCode: "+41" },
  { code: "AT", name: "Austria", phoneCode: "+43" },
  { code: "IE", name: "Irlanda", phoneCode: "+353" },
  { code: "SG", name: "Singapur", phoneCode: "+65" },
  { code: "MY", name: "Malasia", phoneCode: "+60" },
  { code: "TH", name: "Tailandia", phoneCode: "+66" },
  { code: "PH", name: "Filipinas", phoneCode: "+63" },
  { code: "ID", name: "Indonesia", phoneCode: "+62" },
  { code: "VN", name: "Vietnam", phoneCode: "+84" },
];

export function getCountryByCode(code: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}

// ============================================================================
// OCCUPATIONS
// ============================================================================

export interface Occupation {
  value: OccupationType;
  label: string;
  description: string;
}

export const OCCUPATIONS: Occupation[] = [
  {
    value: "professional",
    label: "Profesional",
    description: "Trabajo en una empresa o de forma independiente",
  },
  {
    value: "student",
    label: "Estudiante",
    description: "Estudiante de cualquier nivel educativo",
  },
  {
    value: "scientist",
    label: "Cientifico",
    description: "Investigador o cientifico en cualquier campo",
  },
  {
    value: "academic",
    label: "Academico",
    description: "Profesor o academico universitario",
  },
  {
    value: "entrepreneur",
    label: "Empresario",
    description: "Dueno de negocio establecido",
  },
  {
    value: "startup",
    label: "Startup",
    description: "Fundador o parte de una startup",
  },
  {
    value: "government",
    label: "Gobierno",
    description: "Servidor publico o funcionario gubernamental",
  },
  {
    value: "content_creator",
    label: "Creador de Contenido",
    description: "Influencer, YouTuber, streamer, etc.",
  },
  {
    value: "other",
    label: "Otro",
    description: "Otra ocupacion no listada",
  },
];

// ============================================================================
// VERIFICATION STEPS
// ============================================================================

export const VERIFICATION_STEPS = [
  { id: "name", title: "Nombre", description: "Como te llamas?" },
  { id: "country", title: "Pais", description: "Donde te encuentras?" },
  { id: "email", title: "Email", description: "Verifica tu correo electronico" },
  { id: "phone", title: "Telefono", description: "Verifica tu numero de telefono" },
  { id: "occupation", title: "Ocupacion", description: "A que te dedicas?" },
] as const;

export type VerificationStepId = (typeof VERIFICATION_STEPS)[number]["id"];
