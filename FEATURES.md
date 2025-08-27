# ✨ Fitur — Aizen

Aizen adalah asisten kelas berbasis WhatsApp. Berikut kemampuan inti, alur kerjanya, dan contoh penggunaan.

## 🤖 AI & NLU (Gemini Function-Calling)
- Model: `gemini-2.5-flash` via `@google/genai`.
- Mode: AUTO Function-Calling → model memanggil tool yang tepat.
- Klarifikasi (Clarify Loop):
  - Model-led: tool `askClarify(question, expect)` untuk pertanyaan natural saat intent/slot ambigu.
  - App-led: handler validasi slot wajib (mis. `course/start/end` untuk `changeSchedule`) → jika kurang, tanya 1 hal paling penting.
- Normalisasi tanggal relatif (WIB): "hari ini", "besok", "Senin" → tanggal absolut (Asia/Jakarta).

Contoh:
- "zen jadwal hari ini apa?" → `getTodayInfo` + `getSchedule`
- "zen pindahin EM ke Senin 17:00–19:00 di B201" → `changeSchedule` (kalau tanggal belum jelas, tanya balik)

## 🗂️ Tools & Mapping
- Jadwal & Lokasi:
  - `getTodayInfo()` → `{ date, dayName, timezone }`
  - `getSchedule({ dayName?, date? })`
  - `getClassLocation({ course, dateISO?, dayName? })`
  - `changeSchedule({ course, start, end, dayName?, date?, room?, reason? })`
- Pengingat & Ujian & Kas:
  - `setReminder({ type, title, course?, dueISO, notes? })`
  - `deleteReminder({ id })`
  - `setExam({ course, type, dateISO, start, end, room?, notes? })`
  - `deleteExam({ id? })` (tanpa `id` → hapus entri ujian terbaru)
  - `setCashReminder({ amount, dueISO, notes? })`
  - `deleteCashReminder({ id? })` (tanpa `id` → hapus entri kas terbaru)
- Barang Bawaan:
  - `setCarryItem({ course, items: string[] })`
  - `deleteCarryItem({ course, items?: string[] })`
- Materi Kuliah:
  - `addMaterials({ course, dateISO, caption, files?: { tempPath?, filename, mime }[] })`
  - `queryMaterials({ query, course?, dateFrom?, dateTo?, topK? })`
- Kontak Dosen:
  - `getLecturerContact({ nameOrCourse })`
- Grup & Health:
  - `mentionAll({ text, groupJid? })` (default ke `GROUP_JID` jika kosong)
  - `setHydrationPlan({ dailyGoalMl, glassSizeMl })`
  - `getHydrationPlan()`
- Klarifikasi:
  - `askClarify({ question, expect?[] })`

## 💬 Contoh Percakapan
- "zen set reminder tugas EM Jumat 30 Agustus jam 17:00" → `setReminder`
- "zen ada pembahasan vektor ga?" → `queryMaterials`
- "zen simpan materi EM hari ini caption pengantar EM" → `addMaterials` (kalau file belum ada, tanya balik)
- "@ll besok kumpul jam 7" → `mentionAll`

## 📆 Penjadwalan (Cron, WIB)
- 06:00 → ringkasan jadwal hari ini.
- T-15 → pengingat sebelum kelas.
- 21:00 & 06:00 → pengingat barang bawaan.
- Hidrasi → berdasarkan target harian.

## 💾 Penyimpanan & Media
- JSON-only di `data/` (jadwal, dosen, pengingat, ujian, kas, barang, materials index, hidrasi, aiState).
- Media di `storage/<Course>/<YYYY-MM-DD>/...`.

## 🔁 Rotasi API Key
- `.env`: `GEMINI_API_KEY` dan/atau `GEMINI_API_KEY_1..N`.
- Saat 429 → rotasi ke key berikut → retry.
- Indeks rotasi disimpan di `data/aiState.json` (bertahan setelah restart).

## 🧱 Modul Kunci
- `src/ai/gemini.ts` — integrasi model, prompt, retry & rotasi API, jalur FC.
- `src/ai/tools.ts` — deklarasi tools + router + handler fitur.
- `src/wa/connect.ts` — koneksi Baileys, QR/pairing, events.
- `src/wa/handlers.ts` — parsing pesan, akses kontrol, delegasi AI/fitur.
- `src/scheduler/cron.ts` — cron jobs WIB.
- `src/storage/files.ts` — IO JSON & materials index.

[🔙 Kembali ke README](README.md)
