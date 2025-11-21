/**
 * Script para aplicar migración de user_context manualmente
 * Ejecutar con: npx tsx scripts/apply-migration.ts
 */

import postgres from 'postgres';
import * as fs from 'fs';
import * as path from 'path';

async function applyMigration() {
  const connectionString = process.env.SUPABASE_URL;

  if (!connectionString) {
    console.error('❌ Error: SUPABASE_URL environment variable is required');
    process.exit(1);
  }

  console.log('🔄 Conectando a la base de datos...');
  const sql = postgres(connectionString, { max: 1 });

  try {
    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, '../db/migrations/0003_nifty_joystick.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Aplicando migración...\n');
    console.log(migrationSQL);
    console.log('\n');

    // Dividir por statement-breakpoint y ejecutar cada statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await sql.unsafe(statement);
      console.log('✅ Statement ejecutado');
    }

    // Crear índices adicionales
    console.log('\n📊 Creando índices...');

    await sql`
      CREATE INDEX IF NOT EXISTS user_context_user_id_idx
      ON user_context (user_id)
    `;
    console.log('✅ Índice user_id creado');

    await sql`
      CREATE INDEX IF NOT EXISTS user_context_category_idx
      ON user_context (category)
    `;
    console.log('✅ Índice category creado');

    await sql`
      CREATE INDEX IF NOT EXISTS user_context_last_mentioned_idx
      ON user_context (last_mentioned)
    `;
    console.log('✅ Índice last_mentioned creado');

    // Habilitar RLS
    console.log('\n🔒 Configurando seguridad (RLS)...');

    await sql`ALTER TABLE user_context ENABLE ROW LEVEL SECURITY`;
    console.log('✅ RLS habilitado');

    // Políticas de seguridad
    await sql`
      CREATE POLICY "Users can view own context" ON user_context
        FOR SELECT
        USING (auth.uid() = user_id)
    `;
    console.log('✅ Política SELECT creada');

    await sql`
      CREATE POLICY "Users can insert own context" ON user_context
        FOR INSERT
        WITH CHECK (auth.uid() = user_id)
    `;
    console.log('✅ Política INSERT creada');

    await sql`
      CREATE POLICY "Users can update own context" ON user_context
        FOR UPDATE
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id)
    `;
    console.log('✅ Política UPDATE creada');

    await sql`
      CREATE POLICY "Users can delete own context" ON user_context
        FOR DELETE
        USING (auth.uid() = user_id)
    `;
    console.log('✅ Política DELETE creada');

    // Verificar que todo se creó correctamente
    console.log('\n🔍 Verificando tabla...');
    const result = await sql`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_name = 'user_context'
    `;

    if (result.length > 0) {
      console.log('✅ Tabla user_context creada exitosamente');
    } else {
      console.error('❌ Error: Tabla no encontrada');
    }

    console.log('\n🎉 ¡Migración aplicada exitosamente!');
    console.log('\n📝 Próximos pasos:');
    console.log('1. Reinicia tu servidor de desarrollo: npm run dev');
    console.log('2. Prueba el sistema de memoria compartida');
    console.log('3. Ajusta límites en: lib/memory/plan-limits.ts');

  } catch (error) {
    console.error('\n❌ Error aplicando migración:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

applyMigration();
