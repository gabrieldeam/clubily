import axios from 'axios';
import Constants from 'expo-constants';

const { apiBaseUrl, imagePublicBaseUrl } =
  Constants.expoConfig!.extra as { apiBaseUrl: string; imagePublicBaseUrl: string; };

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export { imagePublicBaseUrl };
export default api;
