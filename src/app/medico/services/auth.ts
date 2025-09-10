import { fetchJSON } from './api';

const isBrowser = typeof window !== 'undefined';
const RAW_API_URL = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');
const API_URL = RAW_API_URL.replace(/\/$/, '');

export interface LoginResponse {
  token: string;
  medico: {
    email: string;
    nombre: string;
    apellido: string;
    especialidad?: string;
  };
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return fetchJSON<LoginResponse>(`${API_URL}/api/medico/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function logout(): Promise<{ message: string }> {
  return fetchJSON<{ message: string }>(`${API_URL}/api/medico/logout`, {
    method: 'POST'
  });
}

export function guardarSesion(data: LoginResponse): void {
  localStorage.setItem('medicoEmail', data.medico.email);
  localStorage.setItem('medicoToken', data.token);
  localStorage.setItem('medicoNombre', data.medico.nombre);
  localStorage.setItem('medicoApellido', data.medico.apellido);
  if (data.medico.especialidad) {
    localStorage.setItem('medicoEspecialidad', data.medico.especialidad);
  }
  // Guardar objeto completo si se requiere
  localStorage.setItem('medicoData', JSON.stringify(data.medico));
}

export function cerrarSesion(): void {
  localStorage.removeItem('medicoEmail');
  localStorage.removeItem('medicoToken');
  localStorage.removeItem('medicoData');
}

export function estaAutenticado(): boolean {
  return !!localStorage.getItem('medicoEmail') && !!localStorage.getItem('medicoToken');
}
