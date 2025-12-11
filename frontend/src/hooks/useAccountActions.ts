import { useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'

// 解析後端 URL
// 1. 優先使用環境變數 VITE_BACKEND_URL
// 2. 若無，則預設使用 http://localhost:3001 (本地開發預設值)
function resolveBackendUrl() {
  const envUrl = import.meta.env.VITE_BACKEND_URL?.trim()
  if (envUrl) {
    return envUrl.replace(/\/$/, '')
  }
  
  // 智慧預設：嘗試推斷本地後端位置
  if (typeof window !== 'undefined') {
    try {
      const url = new URL(window.location.href)
      // 如果前端跑在 5173 (Vite 預設)，通常後端會在 3001
      // 這裡簡單回傳 localhost:3001 作為 fallback
      return `${url.protocol}//${url.hostname}:3001`
    } catch (e) {
      // ignore
    }
  }
  
  return 'http://localhost:3001'
}

const backendBaseUrl = resolveBackendUrl()

export function useAccountActions() {
  
  // 取得當前使用者資訊 (供 UI 預設值使用)
  const getCurrentUser = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    return data?.user
  }, [])

  // 修改使用者名稱 (回傳 Promise)
  const updateUsername = useCallback(async (newUsername: string) => {
    const trimmed = newUsername.trim()
    if (!trimmed) throw new Error('Username cannot be empty.')

    const { error } = await supabase.auth.updateUser({
      data: { username: trimmed },
    })
    if (error) throw error
  }, [])

  // 修改密碼 (回傳 Promise)
  const updatePassword = useCallback(async (newPassword: string) => {
    if (newPassword.length < 6) {
      throw new Error('Password must be at least 6 characters.')
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }, [])

  // 刪除帳號 (回傳 Promise)
  const deleteAccount = useCallback(async () => {
    if (!backendBaseUrl) {
      throw new Error('Backend URL is not configured.')
    }

    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id
    const accessToken = sessionData?.session?.access_token
    
    if (!userId || !accessToken) {
      throw new Error('Session expired. Please sign in again.')
    }

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
      throw new Error(payload.error || 'Unable to delete account.')
    }

    await supabase.auth.signOut()
    // 成功後，由 UI 層負責導向
  }, [])

  return {
    getCurrentUser,
    updateUsername,
    updatePassword,
    deleteAccount,
  }
}