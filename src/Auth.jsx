import { useState } from 'react'
import { supabase } from './supabase'

export default function Auth() {
  const [mode, setMode] = useState('login') // login | signup
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg('')
    const fn = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password })
    const { data, error } = await fn
    setBusy(false)
    if (error) { setMsg(error.message); return }
    if (mode === 'signup' && !data.session) {
      setMsg('註冊成功！請到信箱點擊確認信，再回來登入。')
    }
  }

  return (
    <div className="auth">
      <div className="auth-card">
        <div className="stamp">POST CARD</div>
        <h1>日記台</h1>
        <p className="muted">把大大小小的事都記下來，回頭看時會很有成就感。</p>
        <form onSubmit={submit}>
          <label>電子郵件
            <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
          </label>
          <label>密碼
            <input type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password} onChange={e => setPassword(e.target.value)} />
          </label>
          {msg && <p className="msg">{msg}</p>}
          <button className="primary" disabled={busy}>
            {busy ? '請稍候…' : mode === 'login' ? '登入' : '建立帳號'}
          </button>
        </form>
        <button className="link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg('') }}>
          {mode === 'login' ? '還沒有帳號？註冊一個' : '已有帳號？直接登入'}
        </button>
      </div>
    </div>
  )
}
