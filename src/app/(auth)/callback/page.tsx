'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function CallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClient()
      const url = new URL(window.location.href)
      
      // Check for email confirmation tokens in URL
      const token_hash = url.searchParams.get('token_hash')
      const type = url.searchParams.get('type')
      
      if (token_hash && type) {
        // Email confirmation callback
        const { error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        })
        
        if (error) {
          console.error('Error verifying email:', error)
          router.push('/login?error=verification_failed')
          return
        }
        
        // Successfully verified, redirect to dashboard
        router.push('/')
        return
      }
      
      // Check if there's a hash in the URL (OAuth implicit flow)
      if (window.location.hash) {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          router.push('/login?error=auth_failed')
          return
        }

        if (data.session) {
          router.push('/')
        } else {
          router.push('/login')
        }
      } else {
        // No tokens, just redirect to dashboard
        router.push('/')
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
