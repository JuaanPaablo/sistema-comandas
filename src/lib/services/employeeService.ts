import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface SimpleEmployee {
  id: string;
  name: string;
  position: 'mesero' | 'cocinero';
  created_at: string;
  updated_at: string;
}

export const EmployeeService = {
  // Obtener todos los empleados
  async getEmployees(): Promise<{ data: SimpleEmployee[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo empleados:', error);
      return { data: null, error };
    }
  },

  // Crear empleado
  async createEmployee(name: string, position: 'mesero' | 'cocinero'): Promise<{ data: SimpleEmployee | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([
          {
            name: name.trim(),
            position
          }
        ])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error creando empleado:', error);
      return { data: null, error };
    }
  },

  // Actualizar empleado
  async updateEmployee(id: string, name: string, position: 'mesero' | 'cocinero'): Promise<{ data: SimpleEmployee | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .update({
          name: name.trim(),
          position,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error actualizando empleado:', error);
      return { data: null, error };
    }
  },

  // Eliminar empleado
  async deleteEmployee(id: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      return { error };
    } catch (error) {
      console.error('Error eliminando empleado:', error);
      return { error };
    }
  }
};
