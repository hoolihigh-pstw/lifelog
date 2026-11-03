# 日記台 — 個人成長紀錄系統

手機網頁就能用的生活紀錄 app：日曆上看得到每一天做了什麼，點進去是一張張明信片。

**功能**
- 📅 **日曆視覺回饋**：有紀錄的日子亮起來，當天有照片就直接變成那格的背景；彩色點點代表類型（運動／飲食／閱讀／感悟／習慣／其他）
- 🖼️ **明信片排版**：照片丟進去就自動裁成 4:3 相框、蓋上日期章、微微傾斜，不用調大小
- 🔢 **數值紀錄**：例如「吊單槓 8 下」，回顧頁會自動長出趨勢長條圖
- 🍚 **飲食 + 身體反應**：飲食類型多一欄「之後身體的感覺」
- 🔥 **回顧頁**：連續天數、12 週熱力圖、各類型累計
- 🔐 **帳號密碼登入**，多裝置同步（Supabase Auth）
- 📱 可加到手機主畫面當 app 用（PWA manifest）

技術：Vite + React（前端）、Supabase（帳號、資料庫、照片儲存）、Vercel（網站託管）。全部免費方案就夠用。

---

## 部署步驟（大約 15 分鐘）

### 第 1 步：建立 Supabase 專案
1. 到 <https://supabase.com> 註冊並 **New project**，區域選 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`，設一個資料庫密碼（之後不太會用到，記下來即可）。
2. 等專案建好後，左側選單 **SQL Editor → New query**，把 `supabase/schema.sql` 整個檔案的內容貼進去，按 **Run**。
   這會建立 `entries` 資料表、`photos` 照片儲存桶，以及「只能看到自己資料」的安全規則。
3. 左側 **Project Settings → API**，記下兩個值：
   - `Project URL`（像 `https://abcd1234.supabase.co`）
   - `anon public` key（很長的一串）
4. （建議）左側 **Authentication → Providers → Email**，把 **Confirm email** 關掉。
   這樣註冊後不用去信箱點確認信就能直接登入。只有你自己用的話關掉比較方便。

### 第 2 步：把程式碼放到 GitHub
1. 在 <https://github.com> 建一個新的 repository（例如 `lifelog`，Private 也可以）。
2. 把這個資料夾裡的所有檔案上傳上去。用 GitHub 網頁的 **Add file → Upload files** 拖進去就可以；或者在電腦上：
   ```bash
   cd lifelog
   git init
   git add .
   git commit -m "init"
   git branch -M main
   git remote add origin https://github.com/你的帳號/lifelog.git
   git push -u origin main
   ```

### 第 3 步：部署到 Vercel
1. 到 <https://vercel.com> 用 GitHub 帳號登入，**Add New → Project**，選剛剛的 `lifelog` repo。
2. Framework 會自動偵測成 **Vite**，不用改。
3. 展開 **Environment Variables**，加兩個：

   | Name | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | 第 1 步記下的 Project URL |
   | `VITE_SUPABASE_ANON_KEY` | 第 1 步記下的 anon public key |

4. 按 **Deploy**，一兩分鐘後會得到一個網址，像 `https://lifelog-xxx.vercel.app`。

### 第 4 步：手機上使用
1. 用手機瀏覽器打開那個網址，按「還沒有帳號？註冊一個」建立帳號。
2. iPhone：Safari 分享 → **加入主畫面**；Android：Chrome 選單 → **加到主畫面**。之後就像一般 app 一樣打開。
3. 任何裝置用同一組帳號密碼登入，資料都會同步。

---

## 在自己電腦上開發（選用）
```bash
npm install
cp .env.example .env      # 填入你的 Supabase URL 和 anon key
npm run dev               # 打開 http://localhost:5173
```

## 之後想改東西
- **新增／修改紀錄類型**：改 `src/types.js`，顏色、圖示、提示文字都在那裡。
- **明信片外觀**：`src/styles.css` 的 `/* 明信片 */` 區塊；照片比例在 `.pc-photo > img { aspect-ratio: 4 / 3 }`。
- **照片上傳大小**：`src/photos.js` 的 `compressImage(file, 1600, 0.85)`，第二個參數是最長邊像素。

## 常見問題
- **註冊後說要去信箱確認** → 到 Supabase **Authentication → Providers → Email** 關掉 Confirm email，或去信箱點確認連結。
- **照片上傳失敗** → 確認 `schema.sql` 有完整執行（它會建 `photos` bucket 和權限）。到 Supabase **Storage** 看是否有 `photos` 這個 bucket。
- **打開網頁一片空白** → 多半是 Vercel 環境變數沒設或打錯，到 Vercel 專案 **Settings → Environment Variables** 檢查後 **Redeploy**。
- **Supabase 免費方案限制**：500 MB 資料庫、1 GB 檔案儲存。照片上傳前會壓到 1600px 以內（一張大約 200–400 KB），大概能放兩三千張；不夠時再升級即可。
