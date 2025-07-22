// src/services/digitalBehaviorService.ts
import api from './api';
import {
  DigitalBehaviorResponse,
  DigitalBehaviorTriggerPayload,
  DigitalBehaviorTriggerResponse,  
} from '../types/digitalBehavior';

const BASE = '/digital-behavior';

/**
 * Busca uma regra digital por slug
 */
export const fetchDigitalRule = async (
  slug: string
): Promise<DigitalBehaviorResponse> => {
  const { data } = await api.get<DigitalBehaviorResponse>(
    `${BASE}/${encodeURIComponent(slug)}`
  );
  return data;
};

/**
 * Dispara o evento digital (atribuição de pontos)
 */
export const triggerDigitalRule = async (
  slug: string,
  payload: DigitalBehaviorTriggerPayload
): Promise<number> => {
  const { data } = await api.post<DigitalBehaviorTriggerResponse>(
    `${BASE}/${encodeURIComponent(slug)}/trigger`,
    payload
  );
  return data.points_awarded;
};