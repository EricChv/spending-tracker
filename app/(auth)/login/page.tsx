'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase'

export default function Login() {
  const supabase = createClient()

  return (
    <div style={{ maxWidth: '400px', margin: '100px auto', padding: '20px', backgroundColor: '#28282B' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px', color: 'white' }}>
        💰 Spending Tracker
      </h1>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme='dark'
        providers={[ 'google', 'apple']}
        redirectTo={`${window.location.origin}/`}
      />
    </div>
  )
}