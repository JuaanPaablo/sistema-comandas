import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Employee {
  id: string;
  name: string;
  position: 'mesero' | 'cocinero';
  created_at: string;
  updated_at: string;
}

export const EmployeeService = {
  // Crear empleado en la base de datos
  async createEmployee(name: string): Promise<{ data: Employee | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .insert([
          {
            name: name.trim(),
            position: 'mesero'
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

  // Verificar si el empleado ya existe
  async findEmployeeByName(name: string): Promise<{ data: Employee | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('name', name.trim())
        .eq('position', 'mesero')
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error buscando empleado:', error);
      return { data: null, error };
    }
  },

  // Obtener empleado por ID
  async getEmployeeById(id: string): Promise<{ data: Employee | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      return { data, error };
    } catch (error) {
      console.error('Error obteniendo empleado:', error);
      return { data: null, error };
    }
  }
};
