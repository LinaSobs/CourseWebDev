import { createAuthClient } from 'better-auth/react'
import { API_BASE } from './api'

// The browser side of Better Auth. It calls /api/auth/* on our server and gives us:
//   authClient.signUp.email({ name, email, password })   authClient.signIn.email({ email, password })
//   authClient.signOut()                                 authClient.useSession()  <- React hook: who is signed in?
// useSession() asks the server "is this cookie a valid session?" on page load, which is why you stay signed in after a refresh.
export const authClient = createAuthClient({ baseURL: API_BASE || window.location.origin })
