import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  // Si Supabase/Google rebota con un error (p. ej. redirect_to no permitido,
  // Site URL mal configurado, access_denied), viene en la query. Súrfacelo.
  const providerError = searchParams.get('error_description') || searchParams.get('error')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('Auth Callback - exchange failed:', error.message)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error.message)}`)
  }

  // No llegó código: casi siempre allowlist / Site URL mal configurado en Supabase
  console.error('Auth Callback - no code. provider error:', providerError)
  return NextResponse.redirect(
    `${origin}/login?error=${encodeURIComponent(providerError || 'no-code-received')}`
  )
}
