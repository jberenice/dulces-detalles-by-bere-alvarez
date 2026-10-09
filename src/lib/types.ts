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
  facebook: string | null;
  reminder_email: boolean;
  reminder_days_before: number;
  reminder_hour: number;
  timezone: string;
  timezone_confirmed: boolean;
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
  store_theme: unknown;
  inventory_enabled: boolean;
  is_demo?: boolean;
  demo_expires_at?: string | null;
  message_templates: Record<string, string> | null;
  store_about: string | null;
  store_hours: string | null;
  store_announcement: string | null;
  followup_days?: number;
  margin_tolerance_pct?: number;
  /** Margen bruto mínimo que quieres en cajas y paquetes (%; migración 0021) */
  min_margin_pct?: number;
  store_daily_capacity?: number | null;
  store_blocked_dates?: string[];
  store_zones?: DeliveryZone[];
  onboarding?: Record<string, boolean> | null;
  balance_reminder_email?: boolean;
  print_designs?: Record<string, unknown> | null;
  custom_cake?: CustomCakeSettings | null;
  loyalty?: LoyaltySettings | null;
};

/** Pasteles personalizados desde la tienda */
export type CustomCakeSettings = {
  enabled?: boolean;
  min_notice_days?: number;
  flavors?: string[];
  fillings?: string[];
  toppings?: string[];
  shapes?: string[];
  occasions?: string[];
  intro?: string;
  min_people?: number;
};
/** Tarjeta de sellos */
export type LoyaltySettings = { enabled?: boolean; stamps?: number; reward?: string; min_total?: number };

export type Season = {
  id: string;
  name: string;
  emoji: string | null;
  start_date: string;
  end_date: string;
  yearly: boolean;
  banner: string | null;
  active: boolean;
  created_at: string;
};

export type Coupon = {
  id: string;
  code: string;
  description: string | null;
  kind: "porcentaje" | "monto";
  value: number;
  min_subtotal: number;
  starts_on: string | null;
  ends_on: string | null;
  season_id: string | null;
  max_uses: number | null;
  uses: number;
  active: boolean;
  created_at: string;
};

export type Review = {
  id: string;
  order_id: string | null;
  client_id: string | null;
  token: string;
  customer_name: string | null;
  rating: number | null;
  comment: string | null;
  photo_path: string | null;
  submitted_at: string | null;
  approved: boolean;
  moderated_at: string | null;
  created_at: string;
};

export type CustomRequest = {
  people?: number;
  flavor?: string;
  filling?: string;
  topping?: string;
  shape?: string;
  design?: string;
  message?: string;
  occasion?: string;
  budget?: number;
  time?: string;
  delivery_type?: "recoger" | "envio";
  zone?: string;
  address?: string;
  name?: string;
  phone?: string;
  email?: string;
};

export type DeliveryZone = { name: string; fee: number };
export type VariantOption = { name: string; price: number };
export type VariantGroup = { name: string; required: boolean; options: VariantOption[] };

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
  store_featured?: boolean;
  store_position?: number;
  variants?: VariantGroup[];
  gallery?: string[];
  min_notice_days?: number | null;
  season_id?: string | null;
  flavor_group_id?: string | null;
  allergens?: string[];
  may_contain?: string[];
  ingredients_label?: string | null;
  shelf_life_days?: number | null;
  storage_note?: string | null;
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
/** Lo que trae UNA caja o paquete */
export type PackageComponent = { dessert_id: string; name: string; qty: number; /** Suplemento por pieza de este sabor (migración 0021) */ surcharge?: number };

export type PackageItem = { dessert_id: string; qty?: number };
/** Categoría de cupcakes (ej. Clásicos, Mexicanos sin alcohol) */
export type FlavorGroup = { id: string; name: string; position: number };
/** cupcakes: caja surtida por categorías · pastel: pastel mini + cupcakes · postres: contenido fijo */
export type PackageKind = "cupcakes" | "pastel" | "postres";
export type Package = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  /** fijo: tú defines qué trae · surtido: la clienta elige sabores hasta llenar las piezas */
  mode: "fijo" | "surtido";
  kind?: PackageKind;
  /** Categorías de cupcakes que la clienta puede elegir */
  groups?: string[];
  /** Cupcakes apagados dentro de esta caja (migración 0016) */
  excluded?: string[];
  /** Extras que se ofrecen con este paquete (migración 0017) */
  extras?: string[];
  /** Sabores de pastel mini para elegir (paquete pastel + cupcakes) */
  cake_items?: PackageItem[];
  /** Suplemento por pieza de cada sabor: id del postre → pesos extra (migración 0021) */
  surcharges?: Record<string, number>;
  /** Cuántos pasteles mini lleva */
  cakes?: number;
  pieces: number;
  price: number;
  price_mode: "total" | "pieza";
  items: PackageItem[];
  packaging_id: string | null;
  /** Empaques adicionales (vaso, papel, etc.); todos se cobran y descuentan inventario */
  packaging_ids?: string[];
  extra_cost: number;
  store_visible: boolean;
  active: boolean;
  position: number;
  min_notice_days: number | null;
  season_id?: string | null;
  created_at: string;
};

export type LineItem = {
  id?: string;
  dessert_id: string | null;
  package_id?: string | null;
  components?: PackageComponent[];
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
  followed_up_at?: string | null;
  follow_up_count?: number;
  source?: "manual" | "tienda";
  request?: CustomRequest | null;
  reference_images?: string[];
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
  /** Ubicación marcada en el mapa por la clienta (migración 0019) */
  delivery_lat?: number | null;
  delivery_lng?: number | null;
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
  inventory_applied?: boolean;
  delivery_zone?: string | null;
  coupon_code?: string | null;
  created_at: string;
  clients?: Pick<Client, "id" | "name" | "phone" | "email" | "address"> | null;
  order_items?: LineItem[];
};

export type OrderPayment = {
  id: string;
  order_id: string;
  amount: number;
  method: string | null;
  note: string | null;
  paid_at: string;
};

/** Extra que se vende aparte: listón, moño, tarjeta, carrito… (migración 0017) */
export type Extra = {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  cost: number;
  available: boolean;
  position: number;
};
