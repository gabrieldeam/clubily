export interface CheckoutRequest {
  user_id: string;
  amount: number;
  item_ids?: string[];
  branch_id?: string;
  event?: string;

  coupon_code?: string;
  source_lat?: number;
  source_lng?: number;
  source_location_name?: string;

  associate_cashback?: boolean;
  program_id?: string;
  stamp_code?: string;

  idempotency_key?: string; // opcional (se implementar no back)
}

export interface CheckoutResponse {
  purchase_id: string;
  coupon_id?: string | null;
  redemption_id?: string | null;
  discount: number;
  final_amount: number;
  points_awarded: number;
}
