import { auth } from './firebase';

const API_URL = import.meta.env.VITE_API_URL || '';

export async function apiFetch(path, options = {}) {
  if (!auth.currentUser) {
    throw new Error('Not authenticated');
  }
  
  const token = await auth.currentUser.getIdToken();
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...(options.headers || {})
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

export const apiGet = (path) => apiFetch(path);
export const apiPost = (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) });
export const apiDelete = (path) => apiFetch(path, { method: 'DELETE' });
