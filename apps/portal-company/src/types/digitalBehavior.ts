// src/types/digitalBehavior.ts

export interface DigitalBehaviorResponse {
  slug: string;
  name: string;
  description?: string;
  points: number;
  valid_from?: string;
  valid_to?: string;
  max_attributions: number;
}

export interface SlugAvailabilityResponse {
  available: boolean;
}

export interface DigitalBehaviorTriggerPayload {
  user_id: string;            // UUID do usuário
  amount?: number;            // valor (0 se não usar)
  purchased_items?: string[]; // lista de UUIDs de items (pode ser vazia)
}

export interface DigitalBehaviorTriggerResponse {
  points_awarded: number;
}
