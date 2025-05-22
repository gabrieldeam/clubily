// types/address.ts

export interface AddressBase {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string; // padrão "Brasil"
}

export interface AddressCreate extends AddressBase {}

export interface AddressRead extends AddressBase {
  id: string;
  created_at: string; // ISO date string
}
