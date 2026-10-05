export type Profile = {
  id: string;
  role: "user" | "admin";
  email: string | null;
  owner_name: string | null;
  business_name: string;
  phone: string | null;
  whatsapp: string | null;
  address: string | null;
  logo_url: string | null;
  instagram: string | null;
  currency: string;
  days_per_month: number;
  hours_per_day: number;
  default_profit_pct: number;
  default_wear_pct: number;
  iva_pct: number;
  card_fee_pct: number;
  quote_validity_days: number;
  quote_terms: string | null;
  bank_info: string | null;
  store_slug: string | null;
  store_enabled: boolean;
  store_title: string | null;
  store_description: string | null;
  store_banner_url: string | null;
  store_min_notice_days: number;
  store_delivery: boolean;
  store_pickup: boolean;
  store_shipping_fee: number;
};

export type FixedCost = { id: string; name: string; monthly_amount: number };

export type IngredientKind = "ingrediente" | "empaque";
export type Ingredient = {
  id: string;
  kind: IngredientKind;
  name: string;
  unit: string;
  package_qty: number;
  package_price: number;
  unit_cost: number;
  supplier: string | null;
  stock: number;
  min_stock: number;
  updated_at: string;
};

export type DessertItem = {
  id?: string;
  dessert_id?: string;
  ingredient_id: string;
  section: string | null;
  quantity: number;
  position: number;
};

export type Dessert = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  yield_units: number;
  unit_label: string;
  labor_hours: number;
  profit_pct: number;
  wear_pct: number;
  shipping: number;
  apply_iva: boolean;
  apply_card_fee: boolean;
  sale_price: number | null;
  store_visible: boolean;
  active: boolean;
  created_at: string;
  dessert_items?: DessertItem[];
};

export type Client = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  birthday: string | null;
  notes: string | null;
  source: string;
  created_at: string;
};

export type QuoteStatus = "borrador" | "enviada" | "aceptada" | "rechazada" | "vencida";
export type LineItem = {
  id?: string;
  dessert_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total?: number;
  position?: number;
};

export type Quote = {
  id: string;
  folio: number;
  client_id: string | null;
  status: QuoteStatus;
  title: string | null;
  event_date: string | null;
  valid_until: string | null;
  notes: string | null;
  terms: string | null;
  discount: number;
  shipping: number;
  apply_iva: boolean;
  iva_pct: number;
  subtotal: number;
  iva: number;
  total: number;
  public_token: string;
  share_enabled?: boolean;
  sent_at: string | null;
  accepted_at: string | null;
  created_at: string;
  clients?: Pick<Client, "id" | "name" | "phone" | "email" | "address"> | null;
  quote_items?: LineItem[];
};

export type OrderStatus = "pendiente" | "confirmado" | "en_preparacion" | "listo" | "entregado" | "cancelado";
export type PaymentStatus = "pendiente" | "anticipo" | "pagado";

export type Order = {
  id: string;
  folio: number;
  client_id: string | null;
  quote_id: string | null;
  source: "manual" | "cotizacion" | "tienda";
  status: OrderStatus;
  delivery_date: string | null;
  delivery_time: string | null;
  delivery_type: "recoger" | "envio";
  delivery_address: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  notes: string | null;
  subtotal: number;
  discount: number;
  shipping: number;
  iva: number;
  total: number;
  deposit: number;
  payment_status: PaymentStatus;
  payment_method: string | null;
  public_token?: string;
  created_at: string;
  clients?: Pick<Client, "id" | "name" | "phone" | "email" | "address"> | null;
  order_items?: LineItem[];
};
