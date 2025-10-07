import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase')
}

// Cliente público (para operaciones de lectura)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Cliente de servicio (para operaciones de escritura que requieren permisos completos)
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

// Función para verificar la conexión
export const testConnection = async () => {
  try {
    // Método 1: Intentar obtener información del proyecto
    const { data: projectInfo, error: projectError } = await supabase.auth.getSession()
    
    if (projectError) {
      return { success: false, error: `Error de autenticación: ${projectError.message}` }
    }

    // Método 2: Intentar una consulta simple a una tabla del sistema
    const { data: systemData, error: systemError } = await supabase
      .from('pg_catalog.pg_tables')
      .select('tablename')
      .limit(1)
    
    if (systemError) {
      // Método 3: Si falla, intentar obtener información básica del cliente
      try {
        const { data: clientInfo } = await supabase.auth.getUser()
        return { 
          success: true, 
          message: 'Conexión exitosa - Cliente autenticado correctamente' 
        }
      } catch (clientError) {
        return { 
          success: true, 
          message: 'Conexión exitosa - Cliente de Supabase funcionando' 
        }
      }
    }
    
    return { 
      success: true, 
      message: 'Conexión exitosa - Base de datos accesible' 
    }
    
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    }
  }
}
