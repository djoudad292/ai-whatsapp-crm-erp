/**
 * Data-transfer objects for the Odoo client.
 *
 * These are the *only* shapes the client promises; everything else is
 * `unknown` and stays out of the typed boundary. Fields are optional so
 * partial reads (Odoo `fields` lists) do not break callers.
 */

/** A minimal res.partner record. */
export interface OdooPartnerDto {
  id: number;
  name?: string;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  street?: string | null;
  city?: string | null;
  zip?: string | null;
  country_id?: [number, string] | null;
  active?: boolean;
}

/** Fields requested when reading a product.product. */
export interface OdooProductDto {
  id: number;
  name?: string;
  default_code?: string | null; // SKU
  lst_price?: number;
  type?: "product" | "service" | "consu";
  active?: boolean;
  sale_ok?: boolean;
}

/** A line item inside an Odoo sale.order. */
export interface OdooOrderLineDto {
  id: number;
  product_id?: [number, string];
  name?: string;
  product_uom_qty?: number;
  price_unit?: number;
  price_total?: number;
}

/** A sale.order record. */
export interface OdooOrderDto {
  id: number;
  name?: string;
  partner_id?: [number, string];
  state?: "draft" | "sent" | "sale" | "done" | "cancel";
  amount_total?: number;
  amount_untaxed?: number;
  currency_id?: [number, string];
  order_line?: OdooOrderLineDto[];
}

/** A stock.quant record. */
export interface OdooStockQuantDto {
  id: number;
  product_id?: [number, string];
  location_id?: [number, string];
  quantity?: number;
  reservation_id?: [number, string] | null;
}

/** Result of check_availability. */
export interface AvailabilityResult {
  available: boolean;
  quantity: number;
  reserved: number;
  free: number;
  locationId?: number;
}

/** Result of create_order. */
export interface CreateOrderResult {
  orderId: number;
  orderName?: string;
  lineIds: number[];
}

/** Result of res.partner upsert. */
export interface UpsertPartnerResult {
  id: number;
  created: boolean;
}