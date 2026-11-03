import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { makeTypeOf } from './types'
import { uploadPhoto, deletePhotos, photoUrl } from './photos'

export default function EntryForm({ user, dateKey, categories, moneyTags, entry, onClose, onSaved }) {
  const typeOf = makeTypeOf(categories)
  const [date, setDate] = useState(entry?.date || dateKey)
  const [type, setType] = useState(entry?.type || categories[0]?.key || 'other')
  const [title, setTitle] = useState(entry?.title || '')
  const [content, setContent] = useState(entry?.content || '')
  const [value, setValue] = useState(entry?.value ?? '')
  const [unit, setUnit] = useState(entry?.unit || '')
  const [feeling, setFeeling] = useState(entry?.feeling || '')
  const [tag, setTag] = useState(entry?.tag || '')
  const [flow, setFlow] = useState(entry?.flow || 'out')   // 記帳：out 支出 / in 收入
  const [photos, setPhotos] = useState(entry?.photos || [])   // 已上傳的路徑
  const [pending, setPending] = useState([])                 // 尚未上傳的 File
  const [removed, setRemoved] = useState([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const t = typeOf(type)

  // 換分類時帶入預設單位（編輯既有紀錄時不動）
  useEffect(() => {
    if (entry) return
    setUnit(t.mode === 'money' ? '元' : (t.unit || ''))
  }, [type]) // eslint-disable-line

  function pick(e) {
    setPending(p => [...p, ...Array.from(e.target.files || [])])
    e.target.value = ''
  }

  async function save(e) {
    e.preventDefault()
    if (!title && !content && value === '' && photos.length === 0 && pending.length === 0) {
      setErr('至少寫點什麼，或放一張照片。'); return
    }
    if (t.mode === 'money' && value === '') { setErr('請填金額。'); return }
    setBusy(true); setErr('')
    try {
      const uploaded = []
      for (const f of pending) uploaded.push(await uploadPhoto(user.id, f))
      const row = {
        user_id: user.id,
        date, type, title, content,
        value: value === '' ? null : Number(value),
        unit: t.mode === 'none' ? null : (unit || null),
        feeling: feeling || null,
        tag: t.mode === 'money' ? (tag || null) : null,
        flow: t.mode === 'money' ? flow : null,
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
          {categories.map(c => (
            <button type="button" key={c.key}
              className={`chip ${type === c.key ? 'on' : ''}`}
              style={{ '--accent': c.color }}
              onClick={() => setType(c.key)}>
              {c.emoji} {c.label}
            </button>
          ))}
        </div>

        <label>日期
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
        </label>

        {t.mode === 'money' && (
          <>
            <div className="row">
              <label>金額
                <input type="number" inputMode="decimal" step="any" min="0" value={value} onChange={e => setValue(e.target.value)} placeholder="例如 120" autoFocus />
              </label>
              <label>收支
                <div className="type-row">
                  <button type="button" className={`chip ${flow === 'out' ? 'on' : ''}`} style={{ '--accent': '#d9573b' }} onClick={() => setFlow('out')}>支出</button>
                  <button type="button" className={`chip ${flow === 'in' ? 'on' : ''}`} style={{ '--accent': '#3a7d5c' }} onClick={() => setFlow('in')}>收入</button>
                </div>
              </label>
            </div>
            <label>分類
              <div className="type-row">
                {moneyTags.map(mt => (
                  <button type="button" key={mt} className={`chip small ${tag === mt ? 'on' : ''}`} style={{ '--accent': t.color }} onClick={() => setTag(tag === mt ? '' : mt)}>{mt}</button>
                ))}
              </div>
            </label>
          </>
        )}

        <label>{t.mode === 'money' ? '項目' : '標題'}
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={t.hint || ''} />
        </label>

        {t.mode === 'count' && (
          <div className="row">
            <label>數值
              <input type="number" inputMode="decimal" step="any" value={value} onChange={e => setValue(e.target.value)} placeholder="例如 8" />
            </label>
            <label>單位
              <input value={unit} onChange={e => setUnit(e.target.value)} placeholder="下 / 分鐘 / 頁" />
            </label>
          </div>
        )}

        <label>{t.mode === 'money' ? '備註' : '內容 / 心得'}
          <textarea rows={t.mode === 'money' ? 2 : 4} value={content} onChange={e => setContent(e.target.value)} placeholder="今天發生了什麼、想到了什麼……" />
        </label>

        {t.has_feeling && (
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
