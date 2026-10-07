-- Migration: 20261007070000_orders.sql
-- Description: Module 4.1 Orders, Order Items, Sequences, Indexes, Functions (create_order, cancel_order) and RLS

-- 1. Order Number Sequence starting at 1001
create sequence if not exists public.order_number_seq start with 1001;

-- 2. orders table
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  access_token text not null unique,
  status text not null default 'pending_payment' check (
    status in ('pending_payment', 'payment_submitted', 'paid', 'packed', 'shipped', 'delivered', 'cancelled')
  ),
  customer_name text not null,
  phone text not null,
  email text,
  address_line_1 text not null,
  address_line_2 text,
  city text not null,
  state text not null,
  pin_code text not null,
  customer_note text,
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  delivery_charge numeric(10, 2) not null check (delivery_charge >= 0),
  total numeric(10, 2) not null check (total >= 0),
  payment_reference text,
  courier_name text,
  tracking_number text,
  admin_note text,
  stock_restored boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz,
  shipped_at timestamptz,
  delivered_at timestamptz,
  cancelled_at timestamptz,
  cancel_reason text
);

create trigger set_orders_updated_at
  before update on public.orders
  for each row execute function public.handle_updated_at();

-- Indexes for orders
create index idx_orders_order_number on public.orders(order_number);
create index idx_orders_access_token on public.orders(access_token);
create index idx_orders_status on public.orders(status);
create index idx_orders_created_at on public.orders(created_at desc);
create index idx_orders_phone on public.orders(phone);

-- 3. order_items table
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity >= 1 and quantity <= 10),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create index idx_order_items_order_id on public.order_items(order_id);
create index idx_order_items_product_id on public.order_items(product_id);

-- 4. Row Level Security for orders and order_items
-- Strictly admin-only; NO public or anonymous policies
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "Admins can select all orders"
  on public.orders
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert orders"
  on public.orders
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update orders"
  on public.orders
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete orders"
  on public.orders
  for delete
  to authenticated
  using (public.is_admin());

create policy "Admins can select all order items"
  on public.order_items
  for select
  to authenticated
  using (public.is_admin());

create policy "Admins can insert order items"
  on public.order_items
  for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update order items"
  on public.order_items
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete order items"
  on public.order_items
  for delete
  to authenticated
  using (public.is_admin());

-- 5. Database function create_order
create or replace function public.create_order(
  p_items jsonb,
  p_customer_name text,
  p_phone text,
  p_email text,
  p_address_line_1 text,
  p_address_line_2 text,
  p_city text,
  p_state text,
  p_pin_code text,
  p_customer_note text,
  p_flat_delivery_charge numeric,
  p_free_delivery_threshold numeric,
  p_order_number_prefix text
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_item_count int;
  v_item jsonb;
  v_prod_id uuid;
  v_qty int;
  v_product record;
  v_price numeric(10, 2);
  v_line_total numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_delivery_charge numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;
  v_seq bigint;
  v_prefix text;
  v_order_number text;
  v_access_token text;
  v_order_id uuid;
  v_prod_ids uuid[];
  v_locked_count int;
begin
  -- Validate item list length: 1 to 20 lines
  v_item_count := jsonb_array_length(p_items);
  if v_item_count < 1 or v_item_count > 20 then
    raise exception 'Cart must contain between 1 and 20 items';
  end if;

  -- Validate quantities per line (1 to 10) and extract product IDs
  select array_agg((item->>'product_id')::uuid)
  into v_prod_ids
  from jsonb_array_elements(p_items) item;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item->>'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 10 then
      raise exception 'Quantity per item must be between 1 and 10';
    end if;
  end loop;

  -- Lock products rows in consistent order to prevent deadlocks
  perform 1
  from public.products
  where id = any(v_prod_ids)
  order by id
  for update;

  -- Verify all requested products exist
  select count(distinct id)
  into v_locked_count
  from public.products
  where id = any(v_prod_ids);

  if v_locked_count != array_length(v_prod_ids, 1) then
    raise exception 'One or more products could not be found';
  end if;

  -- Verify each item against database stock, status, publication, and compute pricing
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_prod_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;

    select * into v_product
    from public.products
    where id = v_prod_id;

    if not v_product.is_published then
      raise exception 'Product "%" is no longer available', v_product.name;
    end if;

    if v_product.stock_status = 'out_of_stock' then
      raise exception 'Product "%" is out of stock', v_product.name;
    end if;

    if v_product.stock_quantity is not null and v_product.stock_quantity < v_qty then
      raise exception 'Product "%" only has % item(s) left in stock', v_product.name, v_product.stock_quantity;
    end if;

    -- Price each line using sale price when set, otherwise normal price
    v_price := coalesce(v_product.sale_price, v_product.price);
    v_line_total := round(v_price * v_qty, 2);
    v_subtotal := v_subtotal + v_line_total;
  end loop;

  -- Compute delivery charge
  if p_free_delivery_threshold is not null and p_free_delivery_threshold > 0 and v_subtotal >= p_free_delivery_threshold then
    v_delivery_charge := 0;
  else
    v_delivery_charge := coalesce(p_flat_delivery_charge, 0);
  end if;

  v_total := v_subtotal + v_delivery_charge;

  -- Generate order number and URL-safe access token
  v_prefix := upper(trim(coalesce(p_order_number_prefix, 'ORD')));
  if length(v_prefix) < 2 or length(v_prefix) > 6 or v_prefix !~ '^[A-Z0-9]+$' then
    v_prefix := 'ORD';
  end if;

  v_seq := nextval('public.order_number_seq');
  v_order_number := v_prefix || v_seq::text;
  v_access_token := encode(gen_random_bytes(32), 'hex');

  -- Insert order
  insert into public.orders (
    order_number,
    access_token,
    status,
    customer_name,
    phone,
    email,
    address_line_1,
    address_line_2,
    city,
    state,
    pin_code,
    customer_note,
    subtotal,
    delivery_charge,
    total,
    stock_restored
  ) values (
    v_order_number,
    v_access_token,
    'pending_payment',
    trim(p_customer_name),
    trim(p_phone),
    nullif(trim(p_email), ''),
    trim(p_address_line_1),
    nullif(trim(p_address_line_2), ''),
    trim(p_city),
    trim(p_state),
    trim(p_pin_code),
    nullif(trim(p_customer_note), ''),
    v_subtotal,
    v_delivery_charge,
    v_total,
    false
  )
  returning id into v_order_id;

  -- Insert order items and deduct stock
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_prod_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::int;

    select * into v_product
    from public.products
    where id = v_prod_id;

    v_price := coalesce(v_product.sale_price, v_product.price);
    v_line_total := round(v_price * v_qty, 2);

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      sku,
      unit_price,
      quantity,
      line_total
    ) values (
      v_order_id,
      v_product.id,
      v_product.name,
      v_product.sku,
      v_price,
      v_qty,
      v_line_total
    );

    -- Reduce tracked stock quantities and update out_of_stock status if tracked quantity hits 0
    if v_product.stock_quantity is not null then
      update public.products
      set stock_quantity = stock_quantity - v_qty,
          stock_status = case
            when (stock_quantity - v_qty) <= 0 and stock_status != 'made_to_order' then 'out_of_stock'
            else stock_status
          end
      where id = v_product.id;
    end if;
  end loop;

  return jsonb_build_object(
    'order_number', v_order_number,
    'access_token', v_access_token,
    'order_id', v_order_id,
    'subtotal', v_subtotal,
    'delivery_charge', v_delivery_charge,
    'total', v_total
  );
end;
$$;

-- 6. Database function cancel_order
create or replace function public.cancel_order(
  p_order_id uuid,
  p_cancel_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_order record;
  v_item record;
begin
  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if v_order.status = 'cancelled' then
    return jsonb_build_object('success', true, 'already_cancelled', true);
  end if;

  if v_order.status = 'delivered' then
    raise exception 'Cannot cancel an order that has already been delivered';
  end if;

  -- Set status to cancelled, record time and reason
  update public.orders
  set status = 'cancelled',
      cancelled_at = coalesce(cancelled_at, now()),
      cancel_reason = coalesce(nullif(trim(p_cancel_reason), ''), cancel_reason),
      updated_at = now()
  where id = p_order_id;

  -- Restore tracked stock quantities exactly once
  if not v_order.stock_restored then
    for v_item in
      select product_id, quantity
      from public.order_items
      where order_id = p_order_id and product_id is not null
    loop
      update public.products
      set stock_quantity = stock_quantity + v_item.quantity,
          stock_status = case
            when stock_status = 'out_of_stock' and (stock_quantity + v_item.quantity) > 0 then 'in_stock'
            else stock_status
          end
      where id = v_item.product_id
        and stock_quantity is not null;
    end loop;

    update public.orders
    set stock_restored = true
    where id = p_order_id;
  end if;

  return jsonb_build_object('success', true, 'order_id', p_order_id);
end;
$$;

-- 7. Permissions: Revoke execute from public and anon, allow only service_role
revoke all on function public.create_order(jsonb, text, text, text, text, text, text, text, text, text, numeric, numeric, text) from public, anon;
grant execute on function public.create_order(jsonb, text, text, text, text, text, text, text, text, text, numeric, numeric, text) to service_role;

revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to service_role;
