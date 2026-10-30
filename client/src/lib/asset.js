// Images and videos sit in public/assets. BASE_URL keeps the paths right
// both on the dev server and on a hosted build.
export const asset = (path) => `${import.meta.env.BASE_URL}assets/${path}`
export const cover = (id) => asset(`covers/${id}.svg`)
