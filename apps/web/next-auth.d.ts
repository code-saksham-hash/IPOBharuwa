declare module 'next-auth' {
  import type { JWT } from 'next-auth/jwt'

  interface Session {
    user: {
      id?: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
    expires: string
  }

  interface User {
    id: string
    email: string
    name: string | null
  }

  export interface AuthOptions {
    providers: unknown[]
    session?: { strategy: 'jwt' | 'database' }
    pages?: { signIn?: string }
    callbacks?: {
      jwt?: (params: { token: JWT; user?: User }) => Promise<JWT> | JWT
      session?: (params: { session: Session; token: JWT }) => Promise<Session> | Session
    }
    secret?: string
  }

  export type NextAuthOptions = AuthOptions

  export function getServerSession(
    options: AuthOptions,
  ): Promise<Session | null>

  export default function NextAuth(options: AuthOptions): {
    GET: (req: Request, ctx: { params: { nextauth: string[] } }) => Promise<Response>
    POST: (req: Request, ctx: { params: { nextauth: string[] } }) => Promise<Response>
  }
}

declare module 'next-auth/providers/credentials' {
  import type { User } from 'next-auth'

  interface CredentialsConfig {
    name?: string
    credentials?: Record<string, { label: string; type: string }>
    authorize(
      credentials: Record<string, string> | undefined,
    ): Promise<User | null>
  }

  export default function CredentialsProvider(
    config: CredentialsConfig,
  ): {
    id: string
    name: string
    type: string
    credentials: Record<string, { label: string; type: string }> | undefined
    authorize: (
      credentials: Record<string, string> | undefined,
    ) => Promise<User | null>
  }
}

declare module 'next-auth/middleware' {
  export function withAuth(config: {
    pages?: { signIn?: string }
    callbacks?: {
      authorized?: (params: { token: unknown | null; req: Request }) => boolean
    }
  }): (
    req: Request,
  ) => Promise<Response>
}

declare module 'next-auth/jwt' {
  export interface JWT {
    sub?: string
    email?: string
    name?: string | null
    iat?: number
    exp?: number
    jti?: string
  }

  export function getToken(params: {
    req: Request
    secret?: string
  }): Promise<JWT | null>
}
