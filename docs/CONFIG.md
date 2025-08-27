# ⚙️ Konfigurasi & Environment

## ENV

- GEMINI_API_KEY (+ rotasi: GEMINI_API_KEY_1..N atau GEMINI_API_KEYS CSV)
- TZ=Asia/Jakarta
- GROUP_JID=1203...@g.us
- BOT_NAME=Aizen
- BOT_TRIGGERS=zen,aizen,zennn,zeen,zzzznnn
- ALLOWED_GROUPS, ALLOWED_DMS (opsional)

## File Data (JSON)

- data/schedule.json
  - `days`: kunci Indonesia (senin..jumat) atau Inggris; sistem memetakan
  - `overrides`: daftar perubahan bertanggal (diprioritaskan)
- data/lecturers.json
  - `byCode`: indeks kode→{ name, wa, waJid }
- data/whitelist.json
  - `people`: [{ wa, name, roles[], funRole? }]
  - `dmAllowed`: ["62xxxx"], `groupAllowed`: ["...@g.us"]
- data/fun_quotes.json
  - `{ quotes: string[] }` — pencerahan singkat untuk funRole `anak_nakal`
- data/materials/index.json, data/items.json, reminders, exams, cashReminders, hydration, aiState

## Konfigurasi Tag All

`src/config/tagAll.ts`
- `TAG_ALL_RATE_LIMIT_MS` (default 120000)
- `TAG_ALL_BATCH_SIZE` (default 80)
- `TAG_ALL_ADMIN_ONLY` (default false)

## Catatan Penting

- Merge overrides + enrich on-the-fly: ringkasan 06:00 & T-15 menghormati overrides tanggal hari ini dan melengkapi dosen/WA/ruang tanpa rebuild file.
- Role gating:
  - Cash: bendahara/ketua/developer
  - Change schedule: ketua/sekretaris/developer
  - MentionAll tool: ketua/developer
  - @ll trigger (bypass Gemini): funRole `anak_nakal` ditolak kecuali core role
- NLU clarify multi-turn: pending `{ intent, args, expect, expiresAt }`
