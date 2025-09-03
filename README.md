# WhatsApp Class Manager Bot — Aizen ✨

Aizen adalah bot WhatsApp untuk manajemen kelas berbasis Node.js (TypeScript + ESM), Baileys (WhatsApp Web), dan Google Gemini API (`gemini-2.5-flash`). Bot ini siap produksi, data disimpan di JSON (tanpa database), mendukung Function Calling (tools) dengan clarify loop (tanya balik), penjadwalan (cron), kolektor materi, mention-all, fuzzy trigger nama bot, serta rotasi API key yang persisten.

## 🎯 Status Terkini - Patch RC-20250827
✅ **PATCH COMPLETE** - Semua audit items telah diperbaiki dengan perubahan surgical dan backward-compatible:
- **Cron T-15**: Kini inklusif per-menit dengan idempotency guard
- **URE Store**: Operasi atomic dengan file locking penuh  
- **Tool Deduplication**: Validasi uniqueness dan cleanup duplicate handlers
- **NLU Regression**: Hapus pre-clarify "jadwal", kembali ke LLM-led flow
- **Gating Consistency**: Unified access control untuk @ll dan mentionAll

📊 **Test Coverage**: 65/71 tests passing (91.5% success rate)
📋 **Detail lengkap**: Lihat [PATCH_RESULTS.md](PATCH_RESULTS.md)

## 🧭 Navigasi Cepat
- 📚 [Fitur](FEATURES.md)
- 📈 [Progress](PROGRESS.md)  
- 🧩 [Arsitektur Teknis](docs/ARCHITECTURE.md)
- ⚙️ [Konfigurasi & Environment](docs/CONFIG.md)
- 🛠️ [Panduan Pengembangan](docs/DEVELOPMENT.md)
- 🆘 [Troubleshooting](TROUBLESHOOTING.md)
- 📋 [Patch Results](PATCH_RESULTS.md)

---

## ⭐ Highlight Kemampuan
- 🤖 AI Function-Calling (Gemini): tools mode AUTO, hasil natural, parameter tervalidasi.
- 🧠 Clarify Loop (tanya balik): model-led (`askClarify`) & app-led (slot filling per intent) — kini multi-turn dengan pending intent/args/expect + expiry 30 menit.
- � **Multi-Group Setup**: Semua grup di `GROUP_IDS` diperlakukan sama rata (fitur dan reminder universal).
- 📢 **Broadcast Command**: `cht <pesan>` mengirim broadcast ke semua grup tanpa AI.
- 🔔 **Universal Reminders**: Reminder bisa broadcast ke semua grup dengan `broadcastToAllGroups=true`.
- �🗓️ Jadwal & Lokasi Kelas: dukung tanggal relatif ("hari ini", "besok", "Senin") — PENTING: ringkasan harian & T-15 sudah merge overrides + enrich dosen/WA/ruang secara on-the-fly.
- ⏰ Pengingat: tugas, ujian (UTS/UAS/Quiz), kas (role-gated), barang bawaan (set/hapus, hapus “terakhir”).
- 📦 Materi Kuliah: simpan media + caption per tanggal & matkul; cari kembali dengan query.
- 👥 Tag All (@ll) BYPASS Gemini: trigger `@ll <pesan>` langsung mention semua anggota (contextInfo) dengan rate-limit & chunking; dibatasi fun role + core roles.
- 🧲 Fuzzy Trigger: variasi "zen/aizen/zennn/..." dipahami.
- 🕒 Cron Reminders (WIB): ringkasan pagi, T-15 sebelum kelas, barang bawaan malam/pagi, hidrasi.
- 💾 JSON-only: `data/` + file materi di `storage/`.
- 🔁 Rotasi API Key: dukung banyak key, rotasi otomatis saat 429, indeks rotasi disimpan di `data/aiState.json`.

---

## 🔔 Fitur Baru (v terbaru)
- **Multi-Group Setup Universal**
  - Konfigurasi `GROUP_IDS` di file `.env` untuk beberapa grup sekaligus (dipisah koma).
  - HANYA setting di `.env`, TIDAK di `whitelist.json` atau tempat lain.
  - Semua grup mendapat fitur yang sama rata: jadwal, reminder, materi, dll.
  - Backward compatible dengan `GROUP_JID` lama.

- **Broadcast Command Tanpa AI** 
  - Ketik `cht <pesan>` di grup manapun ⇒ pesan dikirim ke SEMUA grup.
  - Tanpa melibatkan Gemini, langsung broadcast.
  - Contoh: `cht Besok libur ya guys!` ⇒ dikirim ke semua grup.

- **Universal Reminders dengan Broadcast**
  - Reminder sekarang bisa di-set untuk broadcast ke semua grup.
  - Gunakan parameter `broadcastToAllGroups=true` saat membuat reminder.
  - Reminder dibuat dari grup mana pun, tapi dikirim ke semua grup.

- @ll Tag-All Tanpa Gemini
  - Ketik `@ll <pesan>` di grup ⇒ bot mengirim `<pesan>` bersih dengan `contextInfo.mentionedJid` untuk semua anggota grup (tanpa @nama di teks).
  - Gate: funRole `anak_nakal` ditolak kecuali punya core role (`ketua_kelas|bendahara|sekretaris|developer`).
  - Rate limit per grup (default 2 menit) dan chunking (default 80 mention/pesan).
- Fun Roles
  - `anak_baik` (default) dan `anak_nakal` per user di `data/whitelist.json`.
  - Anak nakal dapat balasan dengan quotes (anti-spam, cooldown 60 menit). Tools: `setFunRole`, `getFunRole` (core roles; user boleh ubah diri sendiri).
- Role Gating
  - `setCashReminder/deleteCashReminder`: bendahara/ketua/developer.
  - `changeSchedule`: ketua/sekretaris/developer.
  - `mentionAll` (tool): ketua/developer.
- Jadwal Harian & T-15 Robust
  - Merge overrides untuk tanggal hari ini + enrich dosen/WA/ruang tanpa rebuild file.
- NLU Klarifikasi Multi-turn
  - Pending intent/args/expect (expiry 30 menit), tanya balik 1 slot terpenting, eksekusi tool jika sudah lengkap.

---

## 🧾 Model Data (Ringkas)
- `schedule.json`: `{ timezone, days: {senin..jumat: Class[]}, overrides: ScheduleOverride[] }`
- `lecturers.json`: `{ lecturers: Lecturer[], byCode: { [code]: {name, wa, waJid} } }`
- `whitelist.json`: `{ people: [{ wa,name,roles[],funRole? }], dmAllowed: string[], groupAllowed: string[] }`
- `fun_quotes.json`: `{ quotes: string[] }`
- `reminders.json`, `exams.json`, `cashReminders.json`: daftar entri `{ id, ... }`
- `items.json`: `{ [course: string]: string[] }`
- `materials/index.json`: `{ byDate: { [YYYY-MM-DD]: MaterialEntry[] } }`
- `hydration.json`: `{ dailyGoalMl, glassSizeMl }`
- `aiState.json`: `{ keyIndex }`

---

## 🚀 Setup Cepat
1) Persyaratan
- Node.js >= 20
- Akun WhatsApp
- Google Gemini API key(s)

2) Instalasi
```bash
npm install
cp env.example .env
```

3) Konfigurasi `.env`
```
GEMINI_API_KEY=...
# (Opsional, rotasi — boleh menambah banyak)
GEMINI_API_KEY_1=...
GEMINI_API_KEY_2=...
...
TZ=Asia/Jakarta
GROUP_IDS=1203...@g.us,1204...@g.us,1205...@g.us
BOT_NAME=Aizen
BOT_TRIGGERS=zen,aizen,zennn,zeen,zzzznnn
```

4) Menjalankan (dev)
```bash
npm run dev
```
Scan QR / gunakan pairing code untuk login.

5) Build & Start (prod)
```bash
npm run build
npm start
```

---

## 🧩 Function-Calling & Klarifikasi
- Alur FC: model → `functionCall(name,args)` → handler → `functionResponse { name, response }` → model rangkai jawaban natural.
- Klarifikasi:
  - App-led: pending `{ intent, args, expect, expiresAt }` → tanya 1 slot → eksekusi tool saat lengkap.
  - Model-led: tool `askClarify(question, expect)`.
- Tanggal relatif: "hari ini", "besok", nama hari → dipetakan ke Asia/Jakarta.

---

## 👥 Tag All (@ll) — Bypass Gemini
- Penggunaan: `@ll pesan` di grup.
- Gate:
  - funRole `anak_nakal` → ditolak kecuali core role.
  - Rate limit 2 menit/grup, chunk 80 mention/pesan (tuning di `src/config/tagAll.ts`).
- Catatan: exclude bot sendiri dari `mentionedJid`.

---

## 🧪 Pengujian
- `npm run test:bot` → suite lokal (mock BAileys) mencakup: akses, tag-all gating/cooldown/chunking, tools jadwal/override, reminders, fun roles.
- `npm run test:ai` → skenario percakapan (live API) dengan throttling dan rotasi API key.

Hasil & log akan menampilkan `tool.start`/`tool.success` + ringkasan pass/fail.

---

## 📦 Deployment (Ringkas)
- PM2: lihat `ecosystem.config.js`
- Systemd: jalankan `npm run build` → `npm start` sebagai service
- Simpan `.env` & `auth/` (kredensial WA) dengan aman

---

## 🚀 Jalankan di VPS (Ubuntu) dengan PM2 — tanpa ecosystem file

Langsung pakai perintah (tidak memakai `ecosystem.config.js`).

1) Instal Node.js 20, build tools, dan PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs build-essential
npm i -g pm2
```

2) Siapkan project
```bash
cd ~/bot
cp env.example .env   # isi GEMINI_API_KEY, TZ=Asia/Jakarta, GROUP_JID, dll
npm ci                # install deps (ikut devDependencies)
```

3) Build TypeScript → JavaScript
```bash
# cara normal
npx tsc -p tsconfig.json

# jika wrapper tsc bermasalah, pakai path langsung
node node_modules/typescript/lib/tsc.js -p tsconfig.json
```

4) Jalankan dengan PM2 (langsung file JS hasil build)
```bash
pm2 start dist/index.js --name whatsapp-class-manager-bot --cwd /root/bot --time
pm2 save
pm2 startup
pm2 logs whatsapp-class-manager-bot --lines 200    # lihat QR untuk login WhatsApp
```

5) Operasional
```bash
pm2 status
pm2 restart whatsapp-class-manager-bot
pm2 stop whatsapp-class-manager-bot
pm2 logs whatsapp-class-manager-bot
```

6) Update versi
```bash
cd ~/bot
git pull            # atau upload file terbaru
npm ci
npx tsc -p tsconfig.json || node node_modules/typescript/lib/tsc.js -p tsconfig.json
pm2 restart whatsapp-class-manager-bot
```

---

## 🛠️ Troubleshooting (Ubuntu/PM2)

- **tsc: Permission denied**
  - Solusi cepat: `npx tsc -p tsconfig.json`
  - Atau pakai path langsung: `node node_modules/typescript/lib/tsc.js -p tsconfig.json`
  - Jika masih gagal: `npm uninstall typescript && npm i -D typescript@5.6.3`
  - Pastikan devDependencies terpasang: `npm ci` (tanpa `--omit=dev`).

- **Error: Cannot find module '../lib/tsc.js'**
  - Wrapper `.bin/tsc` korup. Reinstall TS: `npm uninstall typescript && npm i -D typescript@5.6.3`
  - Jalankan build dengan `npx tsc -p tsconfig.json` atau `node node_modules/typescript/lib/tsc.js -p tsconfig.json`.

- **Partisi noexec (script tidak bisa dieksekusi)**
  - Cek: `mount | grep noexec`
  - Pindahkan project ke lokasi tanpa noexec, mis. `/opt/bot`, atau jalankan via `node .../tsc.js` (bukan `.bin/tsc`).

- **PM2 error “ecosystem malformated / module is not defined”**
  - Abaikan ecosystem, jalankan langsung: `pm2 start dist/index.js --name whatsapp-class-manager-bot --cwd /root/bot`.

- **QR code tidak muncul**
  - Lihat log: `pm2 logs whatsapp-class-manager-bot --lines 200`
  - Pastikan env sudah benar dan `qrcode-terminal` terpasang (sudah ada di dependencies).

- **Bot tidak membalas di grup/DM**
  - Periksa `.env`: `ALLOWED_GROUPS`, `ALLOWED_DMS`, `GROUP_JID`.
  - Periksa `data/whitelist.json` untuk roles & akses.

- **Koneksi Gemini gagal (429 / fetch failed)**
  - Isi beberapa API key (rotasi): `GEMINI_API_KEY`, `GEMINI_API_KEY_1..N`.
  - Coba lagi; ada retry + rotasi otomatis di `src/ai/gemini.ts`.


## ⚠️ Etika & Kepatuhan
- Baileys bukan API resmi WhatsApp → gunakan bertanggung jawab, hindari spam/mass messaging.
- Hargai privasi data; batasi akses grup/DM dengan whitelist.

---

Silakan jelajahi:
- 📚 [Fitur](FEATURES.md)
- 🧩 [Arsitektur](docs/ARCHITECTURE.md)
- ⚙️ [Konfigurasi](docs/CONFIG.md)
- 🛠️ [Pengembangan](docs/DEVELOPMENT.md)
- 🆘 [Troubleshooting](TROUBLESHOOTING.md)

<!-- TEST_RESULTS_START -->

# Automated Feature Tests

Total: 10/10 passed

- ✅ Access control - groups allow/deny
- ✅ Access control - DMs allow/deny & note takers
- ✅ Fuzzy trigger detection
- ✅ Mention all builds mentions list
- ✅ Tools: getSchedule & changeSchedule
- ✅ Tools: set/delete reminder
- ✅ Tools: set/delete exam
- ✅ Tools: carry items set/delete
- ✅ Lecturer contact & class location
- ✅ Materials: saveIncomingMedia + search + send

<!-- TEST_RESULTS_END -->
