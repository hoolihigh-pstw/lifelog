import { useEffect, useState, useCallback } from 'react'
import { supabase } from './supabase'
import Auth from './Auth'
import Calendar from './Calendar'
import DayView from './DayView'
import EntryForm from './EntryForm'
import Stats from './Stats'
import { todayKey } from './dates'

export default function App() {
  const [session, setSession] = useState(undefined) // undefined = 載入中
  const [entries, setEntries] = useState([])
  const [selected, setSelected] = useState(todayKey())
  const [view, setView] = useState('calendar') // calendar | day | stats
  const [editing, setEditing] = useState(null) // null | 'new' | entry
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const loadEntries = useCallback(async () => {
    if (!session) return
    setLoading(true)
    const { data, error } = await supabase
      .from('entries')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
    if (error) console.error(error)
    setEntries(data || [])
    setLoading(false)
  }, [session])

  useEffect(() => { loadEntries() }, [loadEntries])

  if (session === undefined) return <div className="splash">日記台</div>
  if (!session) return <Auth />

  const user = session.user

  function openDay(key) {
    setSelected(key)
    setView('day')
  }

  return (
    <div className="app">
      <header className="topbar">
        <button className="brand" onClick={() => setView('calendar')}>日記台</button>
        <nav>
          <button className={view === 'calendar' ? 'on' : ''} onClick={() => setView('calendar')}>日曆</button>
          <button className={view === 'day' ? 'on' : ''} onClick={() => setView('day')}>當日</button>
          <button className={view === 'stats' ? 'on' : ''} onClick={() => setView('stats')}>回顧</button>
          <button className="ghost" onClick={() => supabase.auth.signOut()} title="登出">登出</button>
        </nav>
      </header>

      <main>
        {view === 'calendar' && (
          <Calendar entries={entries} selected={selected} onSelect={openDay} loading={loading} />
        )}
        {view === 'day' && (
          <DayView
            dateKey={selected}
            entries={entries.filter(e => e.date === selected)}
            onChangeDate={setSelected}
            onEdit={setEditing}
            onDeleted={loadEntries}
          />
        )}
        {view === 'stats' && <Stats entries={entries} />}
      </main>

      <button className="fab" aria-label="新增紀錄" onClick={() => setEditing('new')}>＋</button>

      {editing && (
        <EntryForm
          user={user}
          dateKey={selected}
          entry={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(savedDate) => {
            setEditing(null)
            setSelected(savedDate)
            setView('day')
            loadEntries()
          }}
        />
      )}
    </div>
  )
}
