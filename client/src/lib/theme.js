import { useSyncExternalStore } from 'react'

// The two looks of the shop: "light" (the sky-blue one) and "dark" (Night).
// The choice is written on <html data-theme="..."> and remembered on this device.
// Nothing saved yet = light, so nobody gets a surprise; the button in the header switches it.
const KEY = 'gb-theme'
const EVENT = 'gb-theme'

function saved() {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null // storage can be blocked (private mode)
  }
}

export const currentTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

function apply(theme) {
  const root = document.documentElement
  root.dataset.theme = theme
  root.style.colorScheme = theme // native things (scrollbars, date pickers, form controls) follow too
}

// called once in main.jsx BEFORE the first render, so the page never flashes the wrong colours
export function initTheme() {
  apply(saved() ?? 'light')
}

export function setTheme(theme) {
  apply(theme)
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // the choice then lasts until the page is closed
  }
  window.dispatchEvent(new Event(EVENT))
}

export const toggleTheme = () => setTheme(currentTheme() === 'dark' ? 'light' : 'dark')

function subscribe(callback) {
  window.addEventListener(EVENT, callback)
  return () => window.removeEventListener(EVENT, callback)
}

export default function useTheme() {
  return useSyncExternalStore(subscribe, currentTheme, () => 'light')
}
