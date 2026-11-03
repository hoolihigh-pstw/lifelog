import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { TYPES, TYPE_KEYS, typeOf } from './types'
import { uploadPhoto, deletePhotos, photoUrl } from './photos'

export default function EntryForm({ user, dateKey, entry, onClose, onSaved }) {
  const [date, setDate] = useState(entry?.date || dateKey)
  const [type, setType] = useState(entry?.type || 'exercise')
  const [title, setTitle] = useState(entry?.title || '')
  const [content, setContent] = useState(entry?.content || '')
  const [value, setValue] = useState(entry?.value ?? '')
  const [unit, setUnit] = useState(entry?.unit || '')
  const [feeling, setFeeling] = useState(entry?.feeling || '')
  const [photos, setPhotos] = useState(entry?.photos || [])   // 已上傳的路徑
  const [pending, setPending] = useState([])                 // 尚未上傳的 File
  const [removed, setRemoved] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const t = typeOf(type)

  // 若沒填單位，依類型給一個預設
  useEffect(() => {
    if (entry) return
    if (type === 'exercise') setUnit('下')
    else if (type === 'reading') setUnit('頁')
    else if (type === 'habit') setUnit('次')
    else setUnit('')
  }, [type, entry])

  function pick(e) {
    setPending(p => [...p, ...Array.from(e.target.files || [])])
    e.target.value = ''
  }

  async function save(e) {
    e.preventDefault()
    if (!title && !content && !value && photos.length === 0 && pending.length === 0) {
      setErr('至少寫點什麼，或放一張照片。'); return
    }
    setBusy(true); setErr('')
    try {
      const uploaded = []
      for (const f of pending) uploaded.push(await uploadPhoto(user.id, f))
      const row = {
        user_id: user.id,
        date, type, title, content,
        value: value === '' ? null : Number(value),
        unit: unit || null,
        feeling: feeling || null,
        photos: [...photos, ...uploaded],
      }
      const q = entry
        ? supabase.from('entries').update(row).eq('id', entry.id)
        : supabase.from('entries').insert(row)
      const { error } = await q
      if (error) throw error
      await deletePhotos(removed)
      onSaved(date)
    } catch (ex) {
      setErr(ex.message || String(ex))
      setBusy(false)
    }
  }

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <form className="sheet" onClick={e => e.stopPropagation()} onSubmit={save}>
        <div className="sheet-handle" />
        <h2>{entry ? '編輯紀錄' : '新增紀錄'}</h2>

        <div className="type-row">
          {TYPE_KEYS.map(k => (
            <button type="button" key={k}
              className={`chip ${type === k ? 'on' : ''}`}
              style={{ '--accent': TYPES[k].color }}
              onClick={() => setType(k)}>
              {TYPES[k].emoji} {TYPES[k].label}
            </button>
          ))}
        </div>

        <label>日期
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </label>

        <label>標題
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t.hint} />
        </label>

        {t.metric && (
          <div className="row">
            <label>{t.metric}
              <input type="number" inputMode="decimal" step="any" value={value} onChange={e => setValue(e.target.value)} placeholder="例如 8" />
            </label>
            <label>單位
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="下 / 分鐘 / 頁" />
            </label>
          </div>
        )}

        <label>內容 / 心得
          <textarea rows={4} value={content} onChange={e => setContent(e.target.value)} placeholder="今天發生了什麼、想到了什麼……" />
        </label>

        {type === 'food' && (
          <label>之後身體的感覺
            <input value={feeling} onChange={e => setFeeling(e.target.value)} placeholder="例如：兩小時後有點脹氣" />
          </label>
        )}

        <div className="photo-field">
          <label className="upload">
            📷 加入照片
            <input type="file" accept="image/*" multiple onChange={pick} hidden />
          </label>
          <div className="photo-previews">
            {photos.map(p => (
              <div key={p} className="pv">
                <img src={photoUrl(p)} alt="" />
                <button type="button" onClick={() => { setPhotos(photos.filter(x => x !== p)); setRemoved([...removed, p]) }}>×</button>
              </div>
            ))}
            {pending.map((f, i) => (
              <div key={i} className="pv">
                <img src={URL.createObjectURL(f)} alt="" />
                <button type="button" onClick={() => setPending(pending.filter((_, j) => j !== i))}>×</button>
              </div>
            ))}
          </div>
        </div>

        {err && <p className="msg">{err}</p>}

        <div className="sheet-actions">
          <button type="button" className="ghost" onClick={onClose} disabled={busy}>取消</button>
          <button className="primary" disabled={busy}>{busy ? '儲存中…' : '儲存'}</button>
        </div>
      </form>
    </div>
  )
}
