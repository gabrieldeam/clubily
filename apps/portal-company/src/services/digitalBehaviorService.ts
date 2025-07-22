// src/services/digitalBehaviorService.ts
import api from './api';
import {
  DigitalBehaviorResponse,
  SlugAvailabilityResponse,
  DigitalBehaviorTriggerPayload,
  DigitalBehaviorTriggerResponse
} from '../types/digitalBehavior';

const BASE = '/digital-behavior';

export const checkSlugAvailable = async (slug: string): Promise<boolean> => {
  const { data } = await api.get<SlugAvailabilityResponse>(`${BASE}/slug-available`, {
    params: { slug }
  });
  return data.available;
};

export const fetchDigitalRule = async (
  slug: string
): Promise<DigitalBehaviorResponse> => {
  const { data } = await api.get<DigitalBehaviorResponse>(`${BASE}/${encodeURIComponent(slug)}`);
  return data;
};

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
