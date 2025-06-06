// src/types/address.ts

export interface AddressBase {
  street: string;
  number: string;
  neighborhood: string;
  complement?: string;
  city: string;
  state: string;
  postal_code: string;
  country?: string; // padrão "Brasil"
  is_selected?: boolean; // opcional no front, default=false no back
}

// Na criação, `is_selected` existe mas pode ficar false por padrão
export interface AddressCreate extends AddressBase {
  is_selected?: boolean;
}
export interface AddressRead extends AddressBase {
  id: string;
  user_id: string;
  is_selected: boolean;
  created_at: string;
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