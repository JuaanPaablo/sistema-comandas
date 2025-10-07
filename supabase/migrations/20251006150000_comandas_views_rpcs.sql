-- Vista comanda_complete y RPCs mark_comanda_ready / mark_comanda_served / assign_order_to_kitchen_screens (no-op segura)

create or replace view public.comanda_complete as
select c.id,
       c.order_id,
       c.table_number,
       c.employee_id,
       c.employee_name,
       c.status,
       c.total_amount,
       c.items_count,
       c.notes,
       c.priority,
       c.estimated_time,
       c.actual_time,
       c.total_preparation_time,
       c.created_at,
       c.updated_at,
       c.served_at,
       jsonb_agg(ci.* order by ci.created_at) filter (where ci.id is not null) as items
from public.comandas c
left join public.comanda_items ci on ci.comanda_id = c.id
group by c.id;

-- RPC: marcar comanda como lista
create or replace function public.mark_comanda_ready(comanda_uuid uuid)
returns boolean
language plpgsql
as $$
begin
  update public.comandas
    set status = 'ready',
        updated_at = now()
  where id = comanda_uuid;
  return true;
end;
$$;

-- RPC: marcar comanda como servida
create or replace function public.mark_comanda_served(comanda_uuid uuid)
returns boolean
language plpgsql
as $$
begin
  update public.comandas
    set status = 'served',
        served_at = now(),
        updated_at = now()
  where id = comanda_uuid;
  return true;
end;
$$;

-- RPC: asignar orden a pantallas de cocina (placeholder para no fallar si no existe lógica)
create or replace function public.assign_order_to_kitchen_screens(order_id_param uuid)
returns boolean
language plpgsql
as $$
begin
  -- Placeholder: en una versión completa, insertar en tabla de asignaciones por estación
  return true;
end;
$$;
