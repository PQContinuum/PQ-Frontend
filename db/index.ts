import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Verificar que exista la URL de la base de datos
if (!process.env.SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable is required");
}

// Crear conexión a PostgreSQL
const connectionString = process.env.SUPABASE_URL;

// Cliente PostgreSQL
const client = postgres(connectionString, {
  prepare: false,
  max: 10, // Pool de conexiones
});

// Instancia de Drizzle
export const db = drizzle(client, { schema });

// Exportar el esquema para uso en queries
export { schema };
