// One small helper for talking to our server. Every component uses this instead of calling fetch() directly.
//   const books = await api('/books?group=kids')
//   await api('/cart', { method: 'POST', body: { bookId: 'moon-bakery', quantity: 2 } })
//
// BASE is empty by default, so requests go to the SAME address as the website ("/api/..."):
//   - in development, Vite forwards /api to the Express server (see vite.config.js)
//   - in production, Vercel forwards /api to Railway (see vercel.json)
// Because the browser only ever talks to one address, the login cookie is a normal first-party cookie.
export const API_BASE = import.meta.env.VITE_API_URL ?? ''

export async function api(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    signal,
    credentials: 'include', // send the session cookie along
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error(data?.error ?? 'Something went wrong. Please try again.')
  return data
}
