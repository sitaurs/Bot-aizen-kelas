import 'dotenv/config';
import { GoogleGenAI, FunctionCallingConfigMode } from '@google/genai';
import { tools as toolDecls, handleToolCall } from '../src/ai/tools.js';
import { loadAllData } from '../src/storage/files.js';

type ConversationTurn = { input: string; expectCallNames?: string[]; expectContains?: string[]; clarifyAnswers?: string[] };

function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)); }

class RotatingGenAI {
  private keys: string[];
  private idx = 0;
  private client: GoogleGenAI;
  constructor(keys: string[]) {
    if (!keys.length) throw new Error('No GEMINI_API_KEY* provided');
    this.keys = keys;
    this.client = new GoogleGenAI({ apiKey: keys[this.idx]! });
    console.info(`[genai.init] keys=${this.keys.length} using index ${this.idx + 1}/${this.keys.length} (…${this.keys[this.idx].slice(-7)})`);
  }
  private rotate() {
    if (this.keys.length <= 1) return;
    this.idx = (this.idx + 1) % this.keys.length;
    this.client = new GoogleGenAI({ apiKey: this.keys[this.idx]! });
    console.warn(`[genai.rotate] now using key index ${this.idx + 1}/${this.keys.length} (…${this.keys[this.idx].slice(-7)})`);
  }
  async generate(payload: any) {
    console.info(`[genai.request] using key index ${this.idx + 1}/${this.keys.length} (…${this.keys[this.idx].slice(-7)})`);
    let lastErr: any;
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return await this.client.models.generateContent(payload);
      } catch (e: any) {
        lastErr = e;
        const msg = String(e?.message || '');
        if (msg.includes('429') || msg.includes('INTERNAL') || msg.includes('Internal')) {
          // try rotate if possible, then wait suggested retry or fallback
          this.rotate();
          const m = msg.match(/retryDelay":"(\d+)s/);
          const delayMs = m ? (parseInt(m[1], 10) * 1000) : 3000 * (attempt + 1);
          await sleep(delayMs);
          continue;
        }
        throw e;
      }
    }
    throw lastErr;
  }
}

function extractText(resp: any): string {
  try {
    const cand = resp?.candidates?.[0];
    const parts = cand?.content?.parts || [];
    const texts = parts.map((p: any) => p.text).filter(Boolean);
    return texts.join('\n');
  } catch { return ''; }
}

function extractFunctionCalls(resp: any): any[] {
  const calls: any[] = [];
  const cands = resp?.candidates || [];
  for (const cand of cands) {
    const parts = cand?.content?.parts || [];
    for (const part of parts) {
      if (part.functionCall) calls.push(part.functionCall);
    }
  }
  return calls;
}

async function runWithTools(client: RotatingGenAI, history: any[], userText: string) {
  const calledTools: string[] = [];
  const generateWithBackoff = async (payload: any) => {
    return await client.generate(payload);
  };
  let resp = await generateWithBackoff({
    model: 'gemini-2.5-flash',
    contents: [
      ...history,
      { role: 'user', parts: [{ text: userText }] }
    ],
    config: {
      tools: [{ functionDeclarations: toolDecls as any }],
      toolConfig: { functionCallingConfig: { mode: FunctionCallingConfigMode.AUTO } }
    }
  });

  // loop on function calls
  let safety = 0;
  while (safety++ < 5) {
    const calls = extractFunctionCalls(resp);
    if (!calls.length) break;
    const call = calls[0];
    if (call?.name) calledTools.push(call.name);
    let args: any = call.args;
    if (typeof args === 'string') {
      try { args = JSON.parse(args); } catch {}
    }
    const toolResult = await handleToolCall({ name: call.name, args });
    
    // Use fresh conversation for function response to avoid accumulation issues
    // retry/backoff for rate limits (simple)
    const doGenerate = async () => generateWithBackoff({
      model: 'gemini-2.5-flash',
      contents: [
        { role: 'user', parts: [{ text: userText }] },
        { role: 'model', parts: [{ functionCall: call }] },
        { role: 'user', parts: [{ functionResponse: { name: call.name, response: toolResult } }] }
      ]
    });
    resp = await doGenerate();
  }
  const text = extractText(resp);
  
  // Add to history for next turn
  history.push({ role: 'user', parts: [{ text: userText }] });
  if (text) {
    history.push({ role: 'model', parts: [{ text }] });
  }
  
  return { resp, text, called: calledTools };
}

async function main() {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY missing');
  await loadAllData();

  const keys: string[] = [];
  if (process.env.GEMINI_API_KEY) keys.push(process.env.GEMINI_API_KEY);
  const csvKeys = (process.env.GEMINI_API_KEYS || process.env.GEMINI_KEYS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (csvKeys.length) keys.push(...csvKeys);
  for (let i = 1; i <= 50; i++) {
    const k = process.env[`GEMINI_API_KEY_${i}` as any];
    if (k) keys.push(k);
  }
  const ai = new RotatingGenAI(keys);
  const history: any[] = [
    { role: 'user', parts: [{ text: `Kamu adalah asisten kelas bernama ${process.env.BOT_NAME || 'Aizen'} untuk D4 Jaringan Komunikasi Digital.
Gaya santai, singkat, paham slang. Timezone Asia/Jakarta.
SELALU gunakan tools (function-calling) untuk aksi CRUD data (jadwal, reminder, ujian, kas, items, materi, kontak, lokasi, mention-all, hidrasi).
Jika user bilang "terakhir" tanpa ID, panggil deleteExam/deleteCashReminder TANPA id.
Jika user pakai "@ll" atau minta mention semua, panggil mentionAll meski tanpa JID (gunakan default env GROUP_JID).
Untuk pertanyaan tanggal/hari, gunakan getTodayInfo bila relevan.
Jika parameter kurang, tanya satu hal terpenting lalu lanjutkan.` }] }
  ];

  const cases: ConversationTurn[] = [
    // Jadwal & lokasi (4 kasus)
    { input: 'zen jadwal hari ini apa?', expectCallNames: ['getSchedule','getTodayInfo'] },
    { input: 'zen jadwal besok apa?', expectCallNames: ['getSchedule'], expectContains: ['besok','jadwal','tanggal'] },
    { input: 'zen lokasi kelas EM hari ini dimana?', expectCallNames: ['getClassLocation','getTodayInfo'], clarifyAnswers: ['Medan Elektromagnetik'] },
    { input: 'zen pindahin EM ke Senin 17:00-19:00 di B201 karena bentrok', expectCallNames: ['changeSchedule'], clarifyAnswers: ['iya, Medan Elektromagnetik'] },
    { input: 'zen ubah jadwal EM besok', expectCallNames: ['changeSchedule'], clarifyAnswers: ['jam 08:00 sampai 10:00'] },
    { input: 'zen jadwal untuk rabu depan', expectCallNames: ['getSchedule'], clarifyAnswers: ['2025-08-27'], expectContains: ['rabu','27'] },
    { input: 'zen dimana kelas Tekdig minggu depan?', expectCallNames: ['getClassLocation'], clarifyAnswers: ['hari Senin','Tekdig itu Teknik Digital'], expectContains: ['tidak ada jadwal','tekdig'] },

    // Reminder (5 kasus)
    { input: 'zen set reminder tugas EM Jumat 30 Agustus jam 17:00', expectCallNames: ['setReminder'], clarifyAnswers: ['Jumat, 29 Agustus 2025 jam 17:00'] },
    { input: 'zen set reminder kas 50000 tanggal 24 Agustus jam 17:00', expectCallNames: ['setCashReminder'] },
    { input: 'zen set UTS EM 10 September 2025 jam 09:00 sampai 11:00 ruang A101', expectCallNames: ['setExam'], expectContains: ['uts','10 september','09:00','11:00','a101'] },
    { input: 'zen hapus reminder kas terakhir', expectCallNames: ['deleteCashReminder','deleteReminder'], expectContains: ['hapus','kas'] },
    { input: 'zen hapus uts terakhir', expectCallNames: ['deleteExam'], clarifyAnswers: ['hapus yang terakhir aja'] },
    { input: 'zen hapus reminder rem_xxxx', expectCallNames: ['deleteReminder'] },
    { input: 'zen reminder tugas EM hari ini jam 5', expectCallNames: ['setReminder'], clarifyAnswers: ['jam 17:00 ya'], expectContains: ['5 sore','17:00'] },

    // Materials (4 kasus)
    { input: 'zen ada pembahasan vektor ga?', expectCallNames: ['queryMaterials'] },
    { input: 'zen cari materi EM tanggal 2025-08-22', expectCallNames: ['queryMaterials'] },
    { input: 'zen simpan materi EM hari ini caption pengantar EM', expectCallNames: ['addMaterials'], clarifyAnswers: ['file menyusul, simpan caption dulu'], expectContains: ['simpan','caption','em'] },
    { input: 'zen cari materi EM keyword pengantar', expectCallNames: ['queryMaterials'] },
    { input: 'zen cari materi EM rentang 2025-08-01 sampai 2025-08-31', expectCallNames: ['queryMaterials'] },

    // Kontak dosen (4 kasus)
    { input: 'zen kontak dosen kalkulus siapa?', expectCallNames: ['getLecturerContact'] },
    { input: 'zen nomor Dr Siti ada?', expectCallNames: ['getLecturerContact'] },
    { input: 'zen email dosen kalkulus', expectCallNames: ['getLecturerContact'] },
    { input: 'zen dosen EM siapa?', expectCallNames: ['getLecturerContact'] },
    { input: 'zen kontak dosen basis data', expectCallNames: ['getLecturerContact'] },

    // Barang bawaan (4 kasus)
    { input: 'zen set barang bawaan EM kalkulator dan penggaris', expectCallNames: ['setCarryItem'], expectContains: ['kalkulator','penggaris','diatur'] },
    { input: 'zen hapus barang penggaris untuk EM', expectCallNames: ['deleteCarryItem'] },
    { input: 'zen hapus semua barang EM', expectCallNames: ['deleteCarryItem'] },
    // Interpret "papan hapus" as satu item, jangan menghapus "penggaris"
    { input: 'zen set barang bawaan Medan Elektromagnetik spidol papan hapus penggaris', expectCallNames: ['setCarryItem'] },
    { input: 'zen set barang bawaan Kalkulus penghapus penggaris T', expectCallNames: ['setCarryItem'] },

    // Group & hydration (3 kasus)
    { input: '@ll besok kumpul jam 7 ya', expectCallNames: ['mentionAll'] },
    { input: 'zen set hidrasi 2500 ml sehari gelas 250', expectCallNames: ['setHydrationPlan'], expectContains: ['2500','250'] },
    { input: 'zen hidrasi target apa?', expectCallNames: ['getHydrationPlan'] }
  ];

  const results: { name: string; ok: boolean; info?: string }[] = [];

  for (const c of cases) {
    await sleep(8000); // extra delay to avoid rate limit on free tier
    console.log(`\n[CASE] ${c.input}`);
    let turnResp = await runWithTools(ai, history, c.input);
    let { resp, text, called } = turnResp;

    // If no function called and AI likely asked a clarification, optionally send clarifyAnswers
    const looksLikeClarify = (txt: string) => /\?|kapan|dimana|siapa|berapa|jam berapa|tanggal/i.test((txt||''));
    if (((!called.length || called.length === 0) || called.includes('askClarify')) && (looksLikeClarify(text || '') || called.includes('askClarify')) && c.clarifyAnswers && c.clarifyAnswers.length) {
      for (const ans of c.clarifyAnswers) {
        console.log(`[CLARIFY→] ${ans}`);
        await sleep(2000);
        turnResp = await runWithTools(ai, history, ans);
        resp = turnResp.resp; text = turnResp.text; called = turnResp.called;
        if (called.length) break;
      }
    }
    const calls = called;
    console.log(`[CALLED] ${calls.join(', ') || '(none)'}`);
    console.log(`[REPLY] ${(text || '').slice(0, 300)}`);
    const okCall = c.expectCallNames ? c.expectCallNames.some(n => calls.includes(n)) : false;
    const okText = c.expectContains ? c.expectContains.some(s => (text || '').toLowerCase().includes(s)) : false;
    const okEither = (c.expectCallNames ? okCall : false) || (c.expectContains ? okText : false) || (!c.expectCallNames && !c.expectContains && !!text);
    const ok = okEither && Boolean(text && text.length > 0);
    results.push({ name: c.input, ok, info: ok ? undefined : `calls=${calls.join(',')} text=${text?.slice(0,200)}` });
  }

  const pass = results.filter(r => r.ok).length;
  const total = results.length;
  const lines = results.map(r => `- ${r.ok ? '✅' : '❌'} ${r.name}${r.ok ? '' : ` — ${r.info}`}`);
  const summary = [`# Gemini Conversation Tests`, '', `Total: ${pass}/${total} passed`, '', ...lines, ''].join('\n');
  await (await import('fs/promises')).writeFile('tests/AI_TEST_RESULTS.md', summary, 'utf8');
  console.log(summary);
  if (pass !== total) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });


