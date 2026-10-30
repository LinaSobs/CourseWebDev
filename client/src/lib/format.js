export const formatPrice = (price) => `$${price.toFixed(2)}`

export const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
