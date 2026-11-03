import { supabase, PHOTO_BUCKET } from './supabase'

// 取得照片公開網址（上傳時已縮到 1600px 以內，手機讀取夠快）
export function photoUrl(path) {
  if (!path) return ''
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl
}

// 在手機上先把照片縮小、轉成 JPEG，再上傳，省流量也省空間
export async function compressImage(file, maxSide = 1600, quality = 0.85) {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  const canvas = document.createElement('canvas')
  canvas.width = w; canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', quality))
  return blob || file
}

export async function uploadPhoto(userId, file) {
  const blob = await compressImage(file)
  const id = (crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2))
  const path = `${userId}/${id}.jpg`
  const { error } = await supabase.storage.from(PHOTO_BUCKET)
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (error) throw error
  return path
}

export async function deletePhotos(paths) {
  if (!paths?.length) return
  await supabase.storage.from(PHOTO_BUCKET).remove(paths)
}
