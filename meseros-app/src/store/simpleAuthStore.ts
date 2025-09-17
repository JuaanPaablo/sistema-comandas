import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EmployeeService, Employee } from '../services/employeeService';

interface SimpleEmployee {
  id: string;
  name: string;
  position: 'mesero' | 'cocinero';
  created_at: string;
}

interface SimpleAuthState {
  employee: SimpleEmployee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useSimpleAuthStore = create<SimpleAuthState>((set, get) => ({
  employee: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (name: string) => {
    set({ isLoading: true });
    
    try {
      // Buscar si el empleado ya existe en la base de datos
      const { data: existingEmployee, error: searchError } = await EmployeeService.findEmployeeByName(name);
      
      let employee: SimpleEmployee;
      
      if (existingEmployee && !searchError) {
        // Empleado ya existe, usar sus datos
        employee = {
          id: existingEmployee.id,
          name: existingEmployee.name,
          position: existingEmployee.position,
          created_at: existingEmployee.created_at
        };
        console.log('✅ Empleado existente encontrado:', employee);
      } else {
        // Crear nuevo empleado en la base de datos
        const { data: newEmployee, error: createError } = await EmployeeService.createEmployee(name);
        
        if (createError || !newEmployee) {
          console.error('Error creando empleado:', createError);
          set({ isLoading: false });
          return false;
        }
        
        employee = {
          id: newEmployee.id,
          name: newEmployee.name,
          position: newEmployee.position,
          created_at: newEmployee.created_at
        };
        console.log('✅ Nuevo empleado creado:', employee);
      }

      // Guardar en AsyncStorage
      await AsyncStorage.setItem('employee', JSON.stringify(employee));
      await AsyncStorage.setItem('isAuthenticated', 'true');

      set({
        employee,
        isAuthenticated: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      console.error('Error en login:', error);
      set({ isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await AsyncStorage.removeItem('employee');
      await AsyncStorage.removeItem('isAuthenticated');
      
      set({
        employee: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error en logout:', error);
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      const [employeeData, isAuthenticated] = await Promise.all([
        AsyncStorage.getItem('employee'),
        AsyncStorage.getItem('isAuthenticated')
      ]);

      if (employeeData && isAuthenticated === 'true') {
        const employee = JSON.parse(employeeData);
        set({
          employee,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          employee: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error verificando autenticación:', error);
      set({
        employee: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }
}));
