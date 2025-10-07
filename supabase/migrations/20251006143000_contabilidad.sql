-- Contabilidad: creación segura con IF NOT EXISTS, funciones con OR REPLACE, vistas con OR REPLACE

create extension if not exists pgcrypto;

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null,
  opening_amount numeric not null default 0,
  closing_amount numeric default 0,
  total_sales numeric default 0,
  total_cash numeric default 0,
  total_card numeric default 0,
  total_transfer numeric default 0,
  total_mobile numeric default 0,
  status varchar not null default 'open' check (status in ('open','closed')),
  opened_at timestamptz default now(),
  closed_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint cash_sessions_employee_id_fkey foreign key (employee_id) references public.employees(id)
);

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  type varchar not null check (type in ('venta','cobro','devolucion','otros')),
  amount numeric not null,
  payment_method varchar not null check (payment_method in ('efectivo','tarjeta','transferencia','movil')),
  description text,
  reference varchar,
  comanda_id uuid,
  cash_session_id uuid,
  employee_id uuid not null,
  customer_name varchar,
  customer_document varchar,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint incomes_comanda_id_fkey foreign key (comanda_id) references public.comandas(id),
  constraint incomes_cash_session_id_fkey foreign key (cash_session_id) references public.cash_sessions(id),
  constraint incomes_employee_id_fkey foreign key (employee_id) references public.employees(id)
);

create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  contact_person varchar,
  email varchar,
  phone varchar,
  address text,
  payment_terms varchar default '30 días',
  status varchar not null default 'active' check (status in ('active','inactive')),
  total_purchases numeric default 0,
  pending_amount numeric default 0,
  last_purchase_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  type varchar not null check (type in ('compra','gasto_operativo','salario','servicios','otros')),
  amount numeric not null,
  payment_method varchar not null check (payment_method in ('efectivo','tarjeta','transferencia','cheque')),
  description text not null,
  reference varchar,
  supplier_id uuid,
  cash_session_id uuid,
  employee_id uuid not null,
  category varchar,
  invoice_number varchar,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint expenses_supplier_id_fkey foreign key (supplier_id) references public.suppliers(id),
  constraint expenses_cash_session_id_fkey foreign key (cash_session_id) references public.cash_sessions(id),
  constraint expenses_employee_id_fkey foreign key (employee_id) references public.employees(id)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  type varchar not null check (type in ('factura','nota_credito','nota_debito')),
  number varchar not null,
  amount numeric not null,
  subtotal_0 numeric default 0,
  subtotal_12 numeric default 0,
  iva_12 numeric default 0,
  total numeric not null,
  status varchar not null default 'pending' check (status in ('pending','paid','cancelled')),
  customer_name varchar,
  customer_document varchar,
  customer_address text,
  customer_phone varchar,
  customer_email varchar,
  comanda_id uuid,
  employee_id uuid not null,
  serie varchar,
  autorizacion_sri varchar,
  fecha_autorizacion timestamptz,
  xml_generado text,
  xml_firmado text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint invoices_comanda_id_fkey foreign key (comanda_id) references public.comandas(id),
  constraint invoices_employee_id_fkey foreign key (employee_id) references public.employees(id)
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  type varchar not null check (type in ('venta','cobro','devolucion','corte_caja')),
  number varchar not null,
  amount numeric not null,
  customer_name varchar,
  employee_id uuid not null,
  cash_session_id uuid,
  printed_at timestamptz,
  status varchar not null default 'pending' check (status in ('pending','printed','cancelled')),
  items jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint tickets_employee_id_fkey foreign key (employee_id) references public.employees(id),
  constraint tickets_cash_session_id_fkey foreign key (cash_session_id) references public.cash_sessions(id)
);

create table if not exists public.employee_accounting (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null unique,
  salary numeric not null default 0,
  commission_rate numeric not null default 0,
  payment_method varchar not null default 'efectivo' check (payment_method in ('efectivo','transferencia','cheque')),
  total_commission numeric default 0,
  last_payment_date date,
  status varchar not null default 'active' check (status in ('active','inactive')),
  start_date date not null default current_date,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint employee_accounting_employee_id_fkey foreign key (employee_id) references public.employees(id)
);

create table if not exists public.accounting_config (
  id uuid primary key default gen_random_uuid(),
  company_name varchar not null,
  company_ruc varchar not null,
  company_address text,
  company_phone varchar,
  company_email varchar,
  fiscal_regime varchar default 'Régimen General',
  fiscal_period varchar default 'Enero - Diciembre',
  iva_rate numeric default 12.0,
  retention_rate numeric default 1.0,
  base_currency varchar default 'USD',
  date_format varchar default 'DD/MM/YYYY',
  number_format varchar default '1,234.56',
  decimals int default 2,
  invoice_series varchar default '001-001',
  credit_note_series varchar default '001-002',
  debit_note_series varchar default '001-003',
  sri_authorization varchar,
  report_format varchar default 'PDF',
  include_logo boolean default true,
  show_details boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.financial_reports (
  id uuid primary key default gen_random_uuid(),
  period varchar not null,
  period_type varchar not null check (period_type in ('semana','mes','trimestre','año')),
  total_income numeric default 0,
  total_expenses numeric default 0,
  net_profit numeric default 0,
  profit_margin numeric default 0,
  active_customers int default 0,
  active_suppliers int default 0,
  total_sales numeric default 0,
  total_purchases numeric default 0,
  generated_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_cash_sessions_employee_id on public.cash_sessions(employee_id);
create index if not exists idx_cash_sessions_status on public.cash_sessions(status);
create index if not exists idx_cash_sessions_opened_at on public.cash_sessions(opened_at);

create index if not exists idx_incomes_type on public.incomes(type);
create index if not exists idx_incomes_payment_method on public.incomes(payment_method);
create index if not exists idx_incomes_cash_session_id on public.incomes(cash_session_id);
create index if not exists idx_incomes_created_at on public.incomes(created_at);

create index if not exists idx_expenses_type on public.expenses(type);
create index if not exists idx_expenses_supplier_id on public.expenses(supplier_id);
create index if not exists idx_expenses_cash_session_id on public.expenses(cash_session_id);
create index if not exists idx_expenses_created_at on public.expenses(created_at);

create index if not exists idx_invoices_type on public.invoices(type);
create index if not exists idx_invoices_status on public.invoices(status);
create index if not exists idx_invoices_number on public.invoices(number);
create index if not exists idx_invoices_created_at on public.invoices(created_at);

create index if not exists idx_tickets_type on public.tickets(type);
create index if not exists idx_tickets_status on public.tickets(status);
create index if not exists idx_tickets_number on public.tickets(number);
create index if not exists idx_tickets_cash_session_id on public.tickets(cash_session_id);

create index if not exists idx_employee_accounting_employee_id on public.employee_accounting(employee_id);
create index if not exists idx_employee_accounting_status on public.employee_accounting(status);

create index if not exists idx_suppliers_status on public.suppliers(status);
create index if not exists idx_suppliers_name on public.suppliers(name);

create index if not exists idx_financial_reports_period on public.financial_reports(period);
create index if not exists idx_financial_reports_period_type on public.financial_reports(period_type);
create index if not exists idx_financial_reports_generated_at on public.financial_reports(generated_at);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger if not exists update_cash_sessions_updated_at before update on public.cash_sessions for each row execute function update_updated_at_column();
create trigger if not exists update_incomes_updated_at before update on public.incomes for each row execute function update_updated_at_column();
create trigger if not exists update_expenses_updated_at before update on public.expenses for each row execute function update_updated_at_column();
create trigger if not exists update_invoices_updated_at before update on public.invoices for each row execute function update_updated_at_column();
create trigger if not exists update_tickets_updated_at before update on public.tickets for each row execute function update_updated_at_column();
create trigger if not exists update_employee_accounting_updated_at before update on public.employee_accounting for each row execute function update_updated_at_column();
create trigger if not exists update_suppliers_updated_at before update on public.suppliers for each row execute function update_updated_at_column();
create trigger if not exists update_accounting_config_updated_at before update on public.accounting_config for each row execute function update_updated_at_column();

create or replace function update_cash_session_totals()
returns trigger as $$
begin
  if tg_table_name = 'incomes' then
    update public.cash_sessions 
      set total_sales = total_sales + new.amount,
          total_cash = case when new.payment_method = 'efectivo' then total_cash + new.amount else total_cash end,
          total_card = case when new.payment_method = 'tarjeta' then total_card + new.amount else total_card end,
          total_transfer = case when new.payment_method = 'transferencia' then total_transfer + new.amount else total_transfer end,
          total_mobile = case when new.payment_method = 'movil' then total_mobile + new.amount else total_mobile end
    where id = new.cash_session_id;
  elsif tg_table_name = 'expenses' then
    update public.cash_sessions
      set total_sales = total_sales - new.amount
    where id = new.cash_session_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger if not exists update_cash_session_on_income after insert on public.incomes for each row execute function update_cash_session_totals();
create trigger if not exists update_cash_session_on_expense after insert on public.expenses for each row execute function update_cash_session_totals();

create or replace function update_supplier_totals()
returns trigger as $$
begin
  update public.suppliers
    set total_purchases = total_purchases + new.amount,
        last_purchase_date = current_date
  where id = new.supplier_id;
  return new;
end;
$$ language plpgsql;

create trigger if not exists update_supplier_totals_on_expense after insert on public.expenses for each row execute function update_supplier_totals();

create or replace function update_employee_commission()
returns trigger as $$
declare
  commission_rate numeric;
  commission_amount numeric;
begin
  select ea.commission_rate into commission_rate from public.employee_accounting ea where ea.employee_id = new.employee_id;
  if commission_rate is not null then
    commission_amount := new.amount * (commission_rate / 100);
    update public.employee_accounting set total_commission = total_commission + commission_amount where employee_id = new.employee_id;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger if not exists update_employee_commission_on_income after insert on public.incomes for each row execute function update_employee_commission();

create or replace view public.daily_cash_summary as
select 
  date(opened_at) as date,
  count(*) as sessions_count,
  sum(opening_amount) as total_opening,
  sum(closing_amount) as total_closing,
  sum(total_sales) as total_sales,
  sum(total_cash) as total_cash,
  sum(total_card) as total_card,
  sum(total_transfer) as total_transfer,
  sum(total_mobile) as total_mobile
from public.cash_sessions
where status = 'closed'
group by date(opened_at)
order by date desc;

create or replace view public.income_by_type as
select type, count(*) as count, sum(amount) as total_amount, avg(amount) as avg_amount
from public.incomes
group by type
order by total_amount desc;

create or replace view public.expense_by_type as
select type, count(*) as count, sum(amount) as total_amount, avg(amount) as avg_amount
from public.expenses
group by type
order by total_amount desc;

create or replace view public.employee_commission_summary as
select e.name as employee_name, e.position, ea.salary, ea.commission_rate, ea.total_commission, ea.payment_method, ea.last_payment_date, ea.status
from public.employees e
join public.employee_accounting ea on e.id = ea.employee_id
order by ea.total_commission desc;

create or replace view public.supplier_purchase_summary as
select s.name as supplier_name, s.contact_person, s.payment_terms, s.total_purchases, s.pending_amount, s.last_purchase_date, s.status, count(e.id) as purchase_count
from public.suppliers s
left join public.expenses e on s.id = e.supplier_id
group by s.id, s.name, s.contact_person, s.payment_terms, s.total_purchases, s.pending_amount, s.last_purchase_date, s.status
order by s.total_purchases desc;

insert into public.accounting_config (id, company_name, company_ruc, company_address, company_phone, company_email, fiscal_regime, fiscal_period, iva_rate, retention_rate, base_currency, date_format, number_format, decimals, invoice_series, credit_note_series, debit_note_series, sri_authorization, report_format, include_logo, show_details)
select gen_random_uuid(), 'Restaurante El Buen Sabor','1234567890001','Av. Principal 123, Quito, Ecuador','+593 2 234 5678','info@elbuensabor.com','Régimen General','Enero - Diciembre',12.0,1.0,'USD','DD/MM/YYYY','1,234.56',2,'001-001','001-002','001-003','1234567890','PDF',true,true
where not exists (select 1 from public.accounting_config);
