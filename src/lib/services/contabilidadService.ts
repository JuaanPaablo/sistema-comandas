import { supabase } from './supabase';

// =====================================================
// SERVICIOS PARA MÓDULO DE CONTABILIDAD
// =====================================================

export class CashSessionService {
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('cash_sessions')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            position
          )
        `)
        .order('opened_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching cash sessions:', error);
      return { data: null, error };
    }
  }

  static async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('cash_sessions')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            position
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching cash session:', error);
      return { data: null, error };
    }
  }

  static async create(sessionData: any) {
    try {
      const { data, error } = await supabase
        .from('cash_sessions')
        .insert([sessionData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating cash session:', error);
      return { data: null, error };
    }
  }

  static async update(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('cash_sessions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating cash session:', error);
      return { data: null, error };
    }
  }

  static async closeSession(id: string, closingData: any) {
    try {
      const { data, error } = await supabase
        .from('cash_sessions')
        .update({
          ...closingData,
          status: 'closed',
          closed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error closing cash session:', error);
      return { data: null, error };
    }
  }

  static async getOpenSession() {
    try {
      const { data, error } = await supabase
        .from('cash_sessions')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            position
          )
        `)
        .eq('status', 'open')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching open cash session:', error);
      return { data: null, error };
    }
  }
}

export class IncomeService {
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            position
          ),
          cash_sessions:cash_session_id (
            id,
            opened_at
          ),
          comandas:comanda_id (
            id,
            table_number,
            total_amount
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching incomes:', error);
      return { data: null, error };
    }
  }

  static async create(incomeData: any) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .insert([incomeData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating income:', error);
      return { data: null, error };
    }
  }

  static async update(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating income:', error);
      return { data: null, error };
    }
  }

  static async delete(id: string) {
    try {
      const { error } = await supabase
        .from('incomes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting income:', error);
      return { data: null, error };
    }
  }

  static async getByPeriod(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching incomes by period:', error);
      return { data: null, error };
    }
  }
}

export class ExpenseService {
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            position
          ),
          cash_sessions:cash_session_id (
            id,
            opened_at
          ),
          suppliers:supplier_id (
            id,
            name,
            contact_person
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return { data: null, error };
    }
  }

  static async create(expenseData: any) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([expenseData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating expense:', error);
      return { data: null, error };
    }
  }

  static async update(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating expense:', error);
      return { data: null, error };
    }
  }

  static async delete(id: string) {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting expense:', error);
      return { data: null, error };
    }
  }

  static async getByPeriod(startDate: string, endDate: string) {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching expenses by period:', error);
      return { data: null, error };
    }
  }
}

export class InvoiceService {
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            position
          ),
          comandas:comanda_id (
            id,
            table_number,
            total_amount
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching invoices:', error);
      return { data: null, error };
    }
  }

  static async create(invoiceData: any) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .insert([invoiceData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating invoice:', error);
      return { data: null, error };
    }
  }

  static async update(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating invoice:', error);
      return { data: null, error };
    }
  }

  static async delete(id: string) {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting invoice:', error);
      return { data: null, error };
    }
  }

  static async getByStatus(status: string) {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching invoices by status:', error);
      return { data: null, error };
    }
  }
}

export class TicketService {
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            position
          ),
          cash_sessions:cash_session_id (
            id,
            opened_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching tickets:', error);
      return { data: null, error };
    }
  }

  static async create(ticketData: any) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating ticket:', error);
      return { data: null, error };
    }
  }

  static async update(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating ticket:', error);
      return { data: null, error };
    }
  }

  static async delete(id: string) {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting ticket:', error);
      return { data: null, error };
    }
  }

  static async markAsPrinted(id: string) {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .update({
          status: 'printed',
          printed_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error marking ticket as printed:', error);
      return { data: null, error };
    }
  }
}

export class EmployeeAccountingService {
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('employee_accounting')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            position
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching employee accounting:', error);
      return { data: null, error };
    }
  }

  static async create(employeeData: any) {
    try {
      const { data, error } = await supabase
        .from('employee_accounting')
        .insert([employeeData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating employee accounting:', error);
      return { data: null, error };
    }
  }

  static async update(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('employee_accounting')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating employee accounting:', error);
      return { data: null, error };
    }
  }

  static async delete(id: string) {
    try {
      const { error } = await supabase
        .from('employee_accounting')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting employee accounting:', error);
      return { data: null, error };
    }
  }

  static async getByEmployeeId(employeeId: string) {
    try {
      const { data, error } = await supabase
        .from('employee_accounting')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            position
          )
        `)
        .eq('employee_id', employeeId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching employee accounting:', error);
      return { data: null, error };
    }
  }
}

export class SupplierService {
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return { data: null, error };
    }
  }

  static async create(supplierData: any) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([supplierData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating supplier:', error);
      return { data: null, error };
    }
  }

  static async update(id: string, updates: any) {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating supplier:', error);
      return { data: null, error };
    }
  }

  static async delete(id: string) {
    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return { data: null, error };
    }
  }

  static async getActive() {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('status', 'active')
        .order('name', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching active suppliers:', error);
      return { data: null, error };
    }
  }
}

export class AccountingConfigService {
  static async get() {
    try {
      const { data, error } = await supabase
        .from('accounting_config')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching accounting config:', error);
      return { data: null, error };
    }
  }

  static async update(updates: any) {
    try {
      const { data, error } = await supabase
        .from('accounting_config')
        .update(updates)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating accounting config:', error);
      return { data: null, error };
    }
  }

  static async create(configData: any) {
    try {
      const { data, error } = await supabase
        .from('accounting_config')
        .insert([configData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating accounting config:', error);
      return { data: null, error };
    }
  }
}

export class FinancialReportService {
  static async generateReport(period: string, periodType: string) {
    try {
      // Generar métricas financieras
      const startDate = this.getPeriodStartDate(period, periodType);
      const endDate = this.getPeriodEndDate(period, periodType);

      // Obtener ingresos del período
      const { data: incomes, error: incomesError } = await supabase
        .from('incomes')
        .select('amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (incomesError) throw incomesError;

      // Obtener egresos del período
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (expensesError) throw expensesError;

      // Calcular métricas
      const totalIncome = incomes?.reduce((sum, income) => sum + parseFloat(income.amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, expense) => sum + parseFloat(expense.amount), 0) || 0;
      const netProfit = totalIncome - totalExpenses;
      const profitMargin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

      // Obtener clientes activos (basado en comandas)
      const { data: activeCustomers, error: customersError } = await supabase
        .from('comandas')
        .select('employee_id')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (customersError) throw customersError;

      const uniqueCustomers = new Set(activeCustomers?.map(c => c.employee_id)).size;

      // Obtener proveedores activos
      const { data: activeSuppliers, error: suppliersError } = await supabase
        .from('suppliers')
        .select('id')
        .eq('status', 'active');

      if (suppliersError) throw suppliersError;

      const activeSuppliersCount = activeSuppliers?.length || 0;

      // Crear reporte
      const reportData = {
        period,
        period_type: periodType,
        total_income: totalIncome,
        total_expenses: totalExpenses,
        net_profit: netProfit,
        profit_margin: profitMargin,
        active_customers: uniqueCustomers,
        active_suppliers: activeSuppliersCount,
        total_sales: totalIncome,
        total_purchases: totalExpenses,
        generated_at: new Date().toISOString()
      };

      // Guardar reporte
      const { data, error } = await supabase
        .from('financial_reports')
        .insert([reportData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error generating financial report:', error);
      return { data: null, error };
    }
  }

  static async getReports() {
    try {
      const { data, error } = await supabase
        .from('financial_reports')
        .select('*')
        .order('generated_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching financial reports:', error);
      return { data: null, error };
    }
  }

  private static getPeriodStartDate(period: string, periodType: string): string {
    const now = new Date();
    
    switch (periodType) {
      case 'semana':
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        return startOfWeek.toISOString();
      
      case 'mes':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      case 'trimestre':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3, 1).toISOString();
      
      case 'año':
        return new Date(now.getFullYear(), 0, 1).toISOString();
      
      default:
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    }
  }

  private static getPeriodEndDate(period: string, periodType: string): string {
    const now = new Date();
    
    switch (periodType) {
      case 'semana':
        const endOfWeek = new Date(now);
        endOfWeek.setDate(now.getDate() - now.getDay() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return endOfWeek.toISOString();
      
      case 'mes':
        return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
      
      case 'trimestre':
        const quarter = Math.floor(now.getMonth() / 3);
        return new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999).toISOString();
      
      case 'año':
        return new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).toISOString();
      
      default:
        return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
    }
  }
}

// =====================================================
// SERVICIOS DE VISTAS Y REPORTES
// =====================================================

export class ReportService {
  static async getDailyCashSummary() {
    try {
      const { data, error } = await supabase
        .from('daily_cash_summary')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching daily cash summary:', error);
      return { data: null, error };
    }
  }

  static async getIncomeByType() {
    try {
      const { data, error } = await supabase
        .from('income_by_type')
        .select('*');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching income by type:', error);
      return { data: null, error };
    }
  }

  static async getExpenseByType() {
    try {
      const { data, error } = await supabase
        .from('expense_by_type')
        .select('*');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching expense by type:', error);
      return { data: null, error };
    }
  }

  static async getEmployeeCommissionSummary() {
    try {
      const { data, error } = await supabase
        .from('employee_commission_summary')
        .select('*');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching employee commission summary:', error);
      return { data: null, error };
    }
  }

  static async getSupplierPurchaseSummary() {
    try {
      const { data, error } = await supabase
        .from('supplier_purchase_summary')
        .select('*');

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching supplier purchase summary:', error);
      return { data: null, error };
    }
  }
}

