import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: {
    signIn: '/login',
  },
})

export const config = {
  matcher: ['/dashboard/:path*', '/api/accounts/:path*', '/api/applications/:path*', '/api/ipos/:path*', '/api/portfolio/:path*', '/api/notifications/:path*', '/api/proxy/:path*'],
}
