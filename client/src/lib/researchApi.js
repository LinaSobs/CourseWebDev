import { api, API_BASE } from './api'

// All requests of the Research & Book page. Filtering and searching happen on the server (level goes in the query string).
const qs = (obj) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(obj)) if (v) p.set(k, v)
  const s = p.toString()
  return s ? `?${s}` : ''
}

export const fetchNews = (signal) => api('/research/news', { signal })
export const fetchPapers = (level, signal) => api(`/research/papers${qs({ level })}`, { signal })
export const fetchBooks = ({ level, q } = {}, signal) => api(`/research/books${qs({ level, q })}`, { signal })
export const searchAll = ({ q, type, level }, signal) => api(`/research/search${qs({ q, type, level })}`, { signal })

// Order: first get a short-lived token (CSRF protection), then send it back with the order.
export async function placeOrder({ name, email, address, items }) {
  const send = async () => {
    const { token } = await api('/research/csrf')
    const res = await fetch(`${API_BASE}/api/research/orders`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-csrf-token': token },
      body: JSON.stringify({ name, email, address, items }), // only ids + quantities: the server looks up the prices
    })
    const data = await res.json().catch(() => null)
    return { res, data }
  }
  let { res, data } = await send()
  if (res.status === 403) ({ res, data } = await send()) // token expired while the form was open: get a new one once
  if (!res.ok) throw new Error(data?.error ?? 'We could not place your order. Please try again.')
  return data.order
}
