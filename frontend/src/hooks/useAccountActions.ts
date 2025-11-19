import { useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL?.trim().replace(/\/$/, '')

export function useAccountActions() {
  const onModifyUsername = useCallback(async () => {
    const { data, error } = await supabase.auth.getUser()
    if (error) {
      window.alert(`Unable to fetch profile: ${error.message}`)
      return
    }

    const existingName =
      data?.user?.user_metadata?.username ?? data?.user?.email ?? ''
    const next = window.prompt('Enter a new username', existingName)
    if (!next) return
    const trimmed = next.trim()
    if (!trimmed) {
      window.alert('Username cannot be empty.')
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      data: { username: trimmed },
    })
    if (updateError) {
      window.alert(`Failed to update username: ${updateError.message}`)
      return
    }

    window.alert('Username updated successfully.')
  }, [])

  const onChangePassword = useCallback(async () => {
    const next = window.prompt('Enter a new password (min 6 chars)')
    if (!next) return
    if (next.length < 6) {
      window.alert('Password must be at least 6 characters.')
      return
    }

    const { error } = await supabase.auth.updateUser({ password: next })
    if (error) {
      window.alert(`Failed to update password: ${error.message}`)
      return
    }

    window.alert('Password updated successfully.')
  }, [])

  const onDeleteAccount = useCallback(async () => {
    const confirmed = window.confirm(
      'Deleting your account will remove access to all documents. This action cannot be undone. Continue?'
    )
    if (!confirmed) return

    if (!backendBaseUrl) {
      window.alert(
        'Backend URL is not configured. Set VITE_BACKEND_URL so account deletion can be processed.'
      )
      return
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id
    const accessToken = sessionData?.session?.access_token
    if (!userId || !accessToken) {
      window.alert('Session expired. Please sign in again and try once more.')
      return
    }

    try {
      const response = await fetch(`${backendBaseUrl}/delete-account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ userId }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to delete account right now.')
      }
      await supabase.auth.signOut()
      window.alert('Account deleted. Redirecting to login page.')
      window.location.assign('/login')
    } catch (err) {
      window.alert(
        `Delete account failed: ${
          err instanceof Error ? err.message : 'Unexpected error'
        }`
      )
    }
  }, [])

  return {
    onModifyUsername,
    onChangePassword,
    onDeleteAccount,
  }
}
