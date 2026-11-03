import JSZip from 'jszip'
import { supabase, PHOTO_BUCKET } from './supabase'
import { photoUrl } from './photos'

// ─── 匯出：zip 內含 data.json + photos/<原路徑> ───────────────────────────
export async function exportBackup({ entries, categories, moneyTags }, onProgress) {
  const zip = new JSZip()
  const data = {
    app: 'lifelog', version: 2, exported_at: new Date().toISOString(),
    categories: categories.map(({ id, user_id, created_at, ...c }) => c),
    money_tags: moneyTags,
    entries: entries.map(({ id, user_id, created_at, updated_at, ...e }) => e),
  }
  zip.file('data.json', JSON.stringify(data, null, 2))

  const paths = entries.flatMap(e => e.photos || [])
  let done = 0
  for (const p of paths) {
    onProgress?.(`下載照片 ${++done} / ${paths.length}…`)
    try {
      const res = await fetch(photoUrl(p))
      if (res.ok) zip.file(`photos/${p}`, await res.blob())
    } catch { /* 單張失敗就跳過 */ }
  }

  onProgress?.('壓縮中…')
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `lifelog-backup-${new Date().toISOString().slice(0, 10)}.zip`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 10000)
}

// ─── 匯入：接受 zip 或純 data.json；照片會重新上傳到目前帳號 ───────────────
export async function importBackup(userId, file, onProgress) {
  let data, zip = null
  if (file.name.endsWith('.json')) {
    data = JSON.parse(await file.text())
  } else {
    zip = await JSZip.loadAsync(file)
    const f = zip.file('data.json')
    if (!f) throw new Error('zip 裡找不到 data.json')
    data = JSON.parse(await f.async('string'))
  }
  if (data.app !== 'lifelog') throw new Error('這不是日記台的備份檔')

  // 1. 分類：同 key 的不重複建立
  const { data: existing } = await supabase.from('categories').select('key')
  const have = new Set((existing || []).map(c => c.key))
  const newCats = (data.categories || []).filter(c => !have.has(c.key)).map(c => ({ ...c, user_id: userId }))
  if (newCats.length) {
    const { error } = await supabase.from('categories').insert(newCats)
    if (error) throw error
  }
  if (data.money_tags?.length) {
    await supabase.from('settings').upsert({ user_id: userId, money_tags: data.money_tags })
  }

  // 2. 照片：從 zip 上傳到目前使用者的資料夾，並記住新路徑
  const remap = {}
  let photoCount = 0
  if (zip) {
    const files = Object.keys(zip.files).filter(n => n.startsWith('photos/') && !zip.files[n].dir)
    let i = 0
    for (const name of files) {
      onProgress?.(`上傳照片 ${++i} / ${files.length}…`)
      const oldPath = name.slice('photos/'.length)
      const base = oldPath.split('/').pop()
      const newPath = `${userId}/${base}`
      const blob = await zip.files[name].async('blob')
      const { error } = await supabase.storage.from(PHOTO_BUCKET)
        .upload(newPath, blob, { contentType: 'image/jpeg', upsert: true })
      if (!error) { remap[oldPath] = newPath; photoCount++ }
    }
  }

  // 3. 紀錄：分批插入
  const rows = (data.entries || []).map(e => ({
    ...e, user_id: userId,
    photos: (e.photos || []).map(p => remap[p] || p),
  }))
  onProgress?.(`寫入 ${rows.length} 則紀錄…`)
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from('entries').insert(rows.slice(i, i + 200))
    if (error) throw error
  }

  return { entries: rows.length, photos: photoCount, categories: newCats.length }
}
