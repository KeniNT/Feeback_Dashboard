// src/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function postFeedback(feedback) {
  const res = await fetch(`${API_BASE}/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(feedback)
  });
  if (!res.ok) throw await res.json();
  return res.json();
}

export async function fetchFeedbacks(params = {}) {
  const url = new URL(`${API_BASE}/feedback`);
  Object.keys(params).forEach(k => params[k] != null && url.searchParams.set(k, params[k]));
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch feedbacks');
  return res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/feedback/stats`);
  if (!res.ok) throw new Error('Failed to fetch stats');
  return res.json();
}
