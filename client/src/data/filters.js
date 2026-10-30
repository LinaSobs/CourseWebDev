// Options for the price filter (this is page UI, not shop data, so it stays in the client).
// A book passes if min <= price <= max. The numbers are sent to the API as ?min= and ?max=.
export const priceFilters = [
  { id: 'any', label: 'Any price', min: null, max: null },
  { id: 'under-15', label: 'Under $15', min: null, max: 14.99 },
  { id: '15-25', label: '$15 to $25', min: 15, max: 25 },
  { id: 'over-25', label: 'Over $25', min: 25.01, max: null },
]

// The Kids Corner filters by age instead of price (that is how parents shop for kids).
// A book passes if its age range overlaps the band. Sent to the API as ?ageFrom= and ?ageTo=.
export const ageFilters = [
  { id: 'any', label: 'All ages', min: null, max: null },
  { id: '3-5', label: 'Ages 3 to 5', min: 3, max: 5 },
  { id: '6-8', label: 'Ages 6 to 8', min: 6, max: 8 },
  { id: '9-10', label: 'Ages 9 to 10', min: 9, max: 10 },
]
