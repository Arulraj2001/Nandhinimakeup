export type OrderStatus =
  | "pending_payment"
  | "payment_submitted"
  | "paid"
  | "packed"
  | "shipped"
  | "delivered"
  | "cancelled";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  sku: string | null;
  unit_price: number;
  quantity: number;
  line_total: number;
}

export interface Order {
  id: string;
  order_number: string;
  access_token: string;
  status: OrderStatus;
  customer_name: string;
  phone: string;
  email: string | null;
  address_line_1: string;
  address_line_2: string | null;
  city: string;
  state: string;
  pin_code: string;
  customer_note: string | null;
  subtotal: number;
  delivery_charge: number;
  total: number;
  payment_reference: string | null;
  courier_name: string | null;
  tracking_number: string | null;
  admin_note: string | null;
  stock_restored: boolean;
  created_at: string;
  updated_at: string;
  paid_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}

export interface OrderCartItemInput {
  product_id: string;
  quantity: number;
}

export interface CreateOrderParams {
  items: OrderCartItemInput[];
  customer_name: string;
  phone: string;
  email?: string | null;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  pin_code: string;
  customer_note?: string | null;
  flat_delivery_charge: number;
  free_delivery_threshold: number;
  order_number_prefix: string;
}

export interface CreateOrderDbResult {
  order_number: string;
  access_token: string;
  order_id: string;
  subtotal: number;
  delivery_charge: number;
  total: number;
}
