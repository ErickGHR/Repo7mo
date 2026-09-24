import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type Movie = {
  _id: string; title: string; poster?: string; plot?: string; fullplot?: string;
  year?: number | string; released?: string; runtime?: number; rated?: string;
  genres?: string[]; cast?: string[]; directors?: string[]; writers?: string[];
  languages?: string[]; countries?: string[];
  imdb?: { rating?: number }; awards?: { text?: string };
};
export type Session = { token: string; username: string; expiresAt: number };

function getApiUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  if (Platform.OS === 'web' && typeof window !== 'undefined') return `http://${window.location.hostname}:3000`;
  const host = Constants.expoConfig?.hostUri;
  if (host) return `http://${new URL(`http://${host}`).hostname}:3000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:3000' : 'http://localhost:3000';
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function request<T>(path: string, token?: string, body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${getApiUrl()}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal,
    });
    if (response.status === 204) return undefined as T;
    const data = await response.json();
    if (!response.ok) throw new ApiError(data.error || 'No se pudo completar la solicitud.', response.status);
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(controller.signal.aborted
      ? 'La conexión tardó demasiado. Revisa el servidor y vuelve a intentar.'
      : 'No se pudo conectar al servidor. Comprueba la dirección de la API y tu conexión.', 0);
  } finally { clearTimeout(timer); }
}
