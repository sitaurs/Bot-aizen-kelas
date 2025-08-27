# 🛠️ Panduan Pengembangan

## Menjalankan

- Dev: `npm run dev`
- Build: `npm run build`
- Start prod: `npm start`

## Testing

- Lokal (tanpa network): `npm run test:bot`
  - Menguji akses, tools (jadwal/reminder/exam/items), fun roles, tag-all gating/cooldown/chunking.
- E2E AI: `npm run test:ai` (gunakan rotasi API key + throttling)

## Tag All (@ll) Dev Notes

- Trigger: ketik `@ll <pesan>` di grup; modul `src/features/tagAll.ts` bypass Gemini/NLU.
- Gating & Rate-limit dapat di-tuning di `src/config/tagAll.ts`.
- Untuk admin-only, set `TAG_ALL_ADMIN_ONLY = true`.

## Role Gating Tools

- Cash reminders: bendahara/ketua/developer.
- Change schedule: ketua/sekretaris/developer.
- MentionAll tool: ketua/developer.

## NLU Klarifikasi

- Pending state `{ intent, args, expect, expiresAt }` disimpan di `data/context.json`.
- Saat user menjawab pertanyaan, sistem mencoba melengkapi slot lalu eksekusi tool.

## Overrides & Enrichment

- Gunakan helper: `getOverridesFor`, `mergeWithOverrides`, `enrich` dari `src/storage/loaders.ts`.
- Cron 06:00 & T-15 sudah memakai helper ini.
