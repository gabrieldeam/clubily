export enum PixKeyType {
  PHONE  = "PHONE",
  EMAIL  = "EMAIL",
  CPF    = "CPF",
  CNPJ   = "CNPJ",
  RANDOM = "RANDOM",
}

export interface TransferMethodCreate {
  name: string;
  key_type: PixKeyType;
  key_value: string;
}

export interface TransferMethodRead {
  id: string;
  name: string;
  key_type: PixKeyType;
  key_value: string;
  created_at: string; // ISO date string
}
