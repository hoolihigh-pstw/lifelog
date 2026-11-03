import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import Calendar from './Calendar'
import DayView from './DayView'
import EntryForm from './EntryForm'
import Stats from './Stats'
import Settings from './Settings'
import { todayKey } from './dates'
import { makeTypeOf } from './types'
import { loadCategories, loadMoneyTags } from './categories'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = 載入中
  const [entries, setEntries] = useState([])
  const [categories, setCategories] = useState([])
  const [moneyTags, setMoneyTags] = useState([])
  const [selected, setSelected] = useState(todayKey())
  const [view, setView] = useState('calendar') // calendar | day | stats | settings
  const [editing, setEditing] = useState(null) // null | 'new' | entry
  const [loading, setLoading] = useState(false)
  const [fatal, setFatal] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const loadAll = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      const [cats, tags, res] = await Promise.all([
        loadCategories(session.user.id),
        loadMoneyTags(session.user.id),
        supabase.from('entries').select('*').order('date', { ascending: false }).order('created_at', { ascending: false }),
      ])
      if (res.error) throw res.error
      setCategories(cats); setMoneyTags(tags); setEntries(res.data || [])
      setFatal('')
    } catch (e) {
      console.error(e)
      setFatal(e.message || String(e))
    }
    setLoading(false)
  }, [session])

  useEffect(() => { loadAll() }, [loadAll])

  const typeOf = useMemo(() => makeTypeOf(categories), [categories])

  if (session === undefined) return <div className="splash">日記台</div>
  if (!session) return <Auth />

  const user = session.user

  function openDay(key) { setSelected(key); setView('day') }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setView('calendar')}>日記台</button>
        <nav>
          <button className={view === 'calendar' ? 'on' : ''} onClick={() => setView('calendar')}>日曆</button>
          <button className={view === 'day' ? 'on' : ''} onClick={() => setView('day')}>當日</button>
          <button className={view === 'stats' ? 'on' : ''} onClick={() => setView('stats')}>回顧</button>
          <button className={view === 'settings' ? 'on' : ''} onClick={() => setView('settings')} aria-label="設定">⚙</button>
        </nav>
      </header>

      {fatal && (
        <p className="msg">
          讀取資料失敗：{fatal}。若剛更新到新版本，請確認已在 Supabase 執行最新的 schema.sql。
        </p>
      )}

      <main>
        {view === 'calendar' && (
          <Calendar entries={entries} typeOf={typeOf} categories={categories} selected={selected} onSelect={openDay} loading={loading} />
        )}
        {view === 'day' && (
          <DayView
            dateKey={selected}
            entries={entries.filter(e => e.date === selected)}
            typeOf={typeOf}
            onChangeDate={setSelected}
            onEdit={setEditing}
            onDeleted={loadAll}
          />
        )}
        {view === 'stats' && <Stats entries={entries} typeOf={typeOf} categories={categories} />}
        {view === 'settings' && (
          <>
            <Settings user={user} categories={categories} moneyTags={moneyTags} entries={entries} onChanged={loadAll} />
            <div className="signout">
              <span className="muted small">{user.email}</span>
              <button className="ghost" onClick={() => supabase.auth.signOut()}>登出</button>
            </div>
          </>
        )}
      </main>

      {view !== 'settings' && (
        <button className="fab" aria-label="新增紀錄" onClick={() => setEditing('new')}>＋</button>
      )}

      {editing && (
        <EntryForm
          user={user}
          dateKey={selected}
          categories={categories}
          moneyTags={moneyTags}
          entry={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(savedDate) => {
            setEditing(null)
            setSelected(savedDate)
            setView('day')
            loadAll()
          }}
        />
      )}
    </div>
  )
}
