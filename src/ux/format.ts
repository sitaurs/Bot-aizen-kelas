export const md = {
  h1: (s: string) => `*${s}*`,
  li: (s: string) => `• ${s}`,
  kv: (k: string, v: string) => `*${k}:* ${v}`,
  code: (s: string) => `\`${s}\``,
  d: { ok: '✅', warn: '⚠️', err: '🛑', clock: '⏰', cal: '📅', pin: '📌', water: '💧' }
};

export function chunkLong(text: string, limit = 3800): string[] {
  const t = String(text || '');
  if (t.length <= limit) return [t];
  const rows = t.split('\n');
  const out: string[] = [];
  let buf = '';
  for (const r of rows) {
    if ((buf + r + '\n').length > limit) {
      out.push(buf.trimEnd());
      buf = '';
    }
    buf += r + '\n';
  }
  if (buf) out.push(buf.trimEnd());
  return out;
}

export async function sendTextSmart(sock: any, jid: string, text: string, contentExtra: any = {}, options: any = { linkPreview: false }) {
  const chunks = chunkLong(text);
  console.log(`[UX] ATTEMPTING to send ${chunks.length} message chunks to ${jid}`);
  
  if (!sock || !sock.sendMessage) {
    console.error(`[UX] ❌ Invalid sock object for sendTextSmart`);
    throw new Error('Invalid WhatsApp socket');
  }
  
  for (let i = 0; i < chunks.length; i++) {
    const part = chunks[i]!;
    console.log(`[UX] Sending chunk ${i + 1}/${chunks.length} (${part.length} chars) to ${jid}`);
    
    try {
      const messagePayload = { text: part, ...contentExtra };
      console.log(`[UX] Message payload: ${JSON.stringify(messagePayload)}`);
      
      const result = await sock.sendMessage(jid, messagePayload, options);
      console.log(`[UX] ✅ Chunk ${i + 1} sent successfully:`, result);
    } catch (error) {
      console.error(`[UX] ❌ Failed to send chunk ${i + 1}:`, error);
      throw error;
    }
  }
  
  console.log(`[UX] ✅ All ${chunks.length} chunks sent successfully to ${jid}`);
}
