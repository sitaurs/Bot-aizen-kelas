# 🧩 Arsitektur Teknis — Aizen

## 🔄 Patch RC-20250827 — Architecture Updates
### Cron & Scheduling Reliability
- **Fire Guard System**: `src/scheduler/fireGuard.ts` menyediakan persistent idempotency untuk cron jobs
- **Atomic URE Operations**: `src/scheduler/ure.store.ts` dengan `updateReminders()` untuk read-modify-write atomik
- **Inclusive T-15**: Cron kini menggunakan `isSame(minute)` untuk inclusive time checks

### Tool Management
- **Tool Validation**: `src/utils/toolValidation.ts` dengan `assertUniqueTools()` build-time check
- **Unified Gating**: `validateMentionAllAccess()` untuk konsistensi akses kontrol
- **Deduplication**: Cleanup semua duplicate tool handlers

### NLU Flow Optimization  
- **LLM-Led Schedule**: Hapus pre-clarify "jadwal", biarkan Gemini handle dengan tools
- **Natural Processing**: Schedule queries kini processed natural oleh AI

## 🏗️ Komponen
- **WhatsApp Layer (Baileys)**: koneksi, login QR/pairing, event, upsert messages.
- **AI Layer (Gemini)**: function-calling, klarifikasi, retry + rotasi API key, prompt sistem.
- **Features Layer**: materials, mentions, tagAll (bypass Gemini), NLU pending multi-turn.
- **Scheduler Layer**: cron jobs WIB (ringkasan, T-15, barang bawaan, hidrasi) + fire guard.
- **Storage Layer**: IO JSON + cache + path helpers (materials index, whitelist, fun_quotes) + atomic operations.
- **Utils**: logger, time (WIB) + normalisasi, id, access whitelist/roles/funRole, quotes, tool validation.

## 🔄 Alur Pesan (High Level)
1. `handlers.ts` menerima pesan → cek allowed chat → ekstrak teks/media.
2. Jika `@ll` diawal → `features/tagAll` (BY-PASS Gemini) kirim mention-all dengan gating & rate limit.
3. Jika trigger nama bot terdeteksi → `ai/gemini.ts`:
   - bentuk sistem prompt + daftar tools
   - panggil model → jika `functionCall` → route ke `ai/tools.ts.handleToolCall`
   - kirim `functionResponse` → model merangkai balasan natural
4. Balasan dikirim ke WhatsApp.

## 🧠 Flow Function-Calling
- Model → `functionCall(name,args)`
- App → eksekusi handler → hasil → `functionResponse { name, response }`
- Model → menulis jawaban natural (mengacu hasil fungsi)

## 🧭 Clarify Loop
- **App-led**: pending `{ intent, args, expect, expiresAt }` → jika ada yang kurang, tanya 1 hal terpenting.
- **Model-led**: tool `askClarify(question, expect)`.

## 🗓️ Normalisasi Jadwal & Overrides
- `storage/loaders.ts` menyediakan helper:
  - `getOverridesFor(dateISO)`, `mergeWithOverrides(dayClasses, overrides)`
  - `enrich(classes, fallbackEnriched)` → join dosen/WA/ruang on-the-fly
- Digunakan oleh cron 06:00, T-15, dan tools jadwal.

## 🔁 Rotasi API Key
- Kunci di `.env`: `GEMINI_API_KEY` dan/atau `GEMINI_API_KEY_1..N`.
- Saat error 429 → rotate ke key berikut + retry.
- Indeks aktif disimpan di `data/aiState.json` (`keyIndex`) dan dipulihkan saat boot.

## 🧱 Modul File Kunci
- `src/ai/gemini.ts` — integrasi model, prompt, retry & rotasi API, jalur FC.
- `src/ai/tools.ts` — deklarasi tools, router, dan handler fitur (dengan role gating tools sensitif).
- `src/wa/handlers.ts` — routing pesan, akses kontrol, TAG ALL bypass, delegasi fitur/AI.
- `src/features/tagAll.ts` — implementasi `@ll` (bypass Gemini) dengan gating, cooldown, chunking.
- `src/scheduler/cron.ts` — cron jobs WIB.
- `src/storage/files.ts` — IO JSON + cache + ensure folder + materials index.
- `src/storage/loaders.ts` — helpers enrich/overrides.
- `src/utils/access.ts` — whitelist + roles + funRole helpers.
- `src/utils/quotes.ts` — quote picker + rate-limit.

## 💽 Persistensi Data
- JSON di `data/`: jadwal, pengingat, ujian, kas, dosen, whitelist (roles & funRole), fun_quotes, items, materials index, hidrasi, `aiState`.
- Media di `storage/<Course>/<YYYY-MM-DD>/...`.

[🔙 Kembali ke README](../README.md)
