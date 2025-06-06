// types/address.ts

export interface AddressBase {
  street: string;
  number: string;
  neighborhood: string;
  complement?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string; // padrão "Brasil"
}

export interface AddressCreate extends AddressBase {
  is_selected?: boolean; // padrão false se não enviado
}

export interface AddressRead extends AddressBase {
  id: string;
  user_id: string;
  is_selected: boolean;
  created_at: string; // ISO date string
}

export interface AddressUpdate {
  street?: string;
  number?: string;
  neighborhood?: string;
  complement?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_selected?: boolean;
}
