# Troubleshooting

## Common Issues

### QR/Pairing not showing
- Ensure terminal supports ASCII. Try enabling `printQRInTerminal: true`.
- Check internet connectivity.

### 429 Too Many Requests (Gemini)
- Fill multiple keys in `.env` (GEMINI_API_KEY_1..N). Rotation persists across restarts.
- Increase delay in tests (`tests/ai-conversation.ts`).
- Consider upgrading plan.

### Function-calling errors (400)
- Ensure functionResponse uses `response`, not `content`.
- Wrap arrays in objects (e.g., `{ lecturers: [...] }`).
- Define array `items` schema for array-typed params.

### File save errors (ENOENT)
- Storage paths auto-created; ensure process has write permissions.

### No schedule/location
- Provide `dayName` or `dateISO`. Relative day names normalized internally.

## Logs
- Tools emit `tool.start` and `tool.success` with args/result.
- Application logs via `pino` in pretty mode.

[Back to README](README.md)
