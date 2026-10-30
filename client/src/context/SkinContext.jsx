import { createContext, useContext } from 'react'

// Which shelf's look the app is wearing right now ('home', 'kids', 'teens'...).
// App works it out from the address and shares it here, so any component can ask for the matching words.
const SkinContext = createContext('home')

export const SkinProvider = SkinContext.Provider
export const useSkin = () => useContext(SkinContext)
