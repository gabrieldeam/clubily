import api from "./api";
import type { CheckoutRequest, CheckoutResponse } from "@/types/checkout";

// Se no backend você incluiu como router "/checkout", use isso.
// Se estiver com outro prefixo, ajuste aqui.
const BASE_PATH = "/checkout";

export const checkout = (payload: CheckoutRequest) =>
  api.post<CheckoutResponse>(`${BASE_PATH}`, payload);
