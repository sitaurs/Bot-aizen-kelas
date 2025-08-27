/*
  Simple test runner that validates major features without hitting network.
  Run with: npm run test:bot
*/
import 'dotenv/config';
import { readFile, writeFile, mkdir, stat, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

import { getData, saveData, loadAllData, updateData, ensureCourseDir } from '../src/storage/files.js';
import { fuzzyTrigger } from '../src/features/fuzzy-trigger.js';
import { handleMentionAll } from '../src/features/mentions.js';
import { saveIncomingMedia, searchMaterials, sendMaterialToChat } from '../src/features/materials.js';
import { tools, handleToolCall } from '../src/ai/tools.js';
import { getAllowedGroupJids, getAllowedDmJids, isAllowedChat } from '../src/utils/access.js';

type TestFn = () => Promise<void> | void;
interface TestCase { name: string; fn: TestFn }

const RESULTS: { name: string; ok: boolean; info?: string }[] = [];
async function test(name: string, fn: TestFn) {
  try {
    await fn();
    RESULTS.push({ name, ok: true });
  } catch (err: any) {
    RESULTS.push({ name, ok: false, info: err?.message || String(err) });
  }
}

// Mock WASocket minimal
class MockSock {
  public sent: any[] = [];
  public participants: string[];
  constructor(participants: string[] = []) { this.participants = participants }
  async sendMessage(jid: string, content: any) {
    this.sent.push({ jid, content });
  }
  async groupMetadata(jid: string) {
    return { id: jid, subject: 'Test Group', participants: this.participants.map(id => ({ id })) } as any;
  }
  async updateMediaMessage(m: any) { return m; }
}

async function backup(path: string): Promise<string | null> {
  try {
    const content = await readFile(path, 'utf8');
    return content;
  } catch {
    return null;
  }
}

async function restore(path: string, backupContent: string | null) {
  if (backupContent === null) return;
  await writeFile(path, backupContent, 'utf8');
}

async function main() {
  // Prepare env for tests
  process.env.GROUP_JID = '12345@g.us';
  process.env.ALLOWED_GROUPS = '12345@g.us';
  process.env.ALLOWED_DMS = '1111@s.whatsapp.net,2222@s.whatsapp.net';

  await loadAllData();

  // Backup critical data files
  const files = [
    'data/schedule.json',
    'data/lecturers.json',
    'data/whitelist.json',
    'data/fun_quotes.json',
    'data/items.json',
    'data/reminders.json',
    'data/noteTakers.json',
    'data/exams.json',
    'data/cashReminders.json',
    'data/materials/index.json',
    'data/context.json'
  ];
  const backups: Record<string, string | null> = {};
  for (const f of files) backups[f] = await backup(f);

  // Seed some data ensuring presence
  await updateData('noteTakers', () => ['3333@s.whatsapp.net']);
  await updateData('exams', () => []);
  await updateData('cashReminders', () => []);
  await updateData('lecturers', () => [
    { id: 'em001', name: 'Dr. Ir. Nama Dosen, S.T., M.T.', phone: '+6281111', courses: ['Medan Elektromagnetik'] }
  ]);
  await updateData('schedule', (s: any) => ({
    timezone: 'Asia/Jakarta',
    days: { Mon: [{ course: 'Medan Elektromagnetik', start: '08:00', end: '10:00', room: 'B-201', lecturerId: 'em001' }], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [], Sun: [] },
    overrides: []
  }));
  await updateData('items', () => ({ 'Medan Elektromagnetik': ['kalkulator', 'buku catatan'] }));
  await updateData('materials', () => ({ byDate: {} }));
  await updateData('whitelist', () => ({
    people: [
      { wa: '1111', name: 'User Satu', roles: ['bendahara'], funRole: 'anak_baik' },
      { wa: '2222', name: 'User Dua', roles: [], funRole: 'anak_baik' }
    ],
    dmAllowed: ['1111','2222'],
    groupAllowed: ['12345@g.us']
  }));
  await updateData('funQuotes', () => ({ quotes: ['Kamu bisa kok 🙂', 'Pelan-pelan asal konsisten.'] }));
  await updateData('reminders', () => []);

  // Tests
  await test('Access control - groups allow/deny', () => {
    const allowed = getAllowedGroupJids();
    if (!allowed.includes('12345@g.us')) throw new Error('main group not allowed');
    if (isAllowedChat('999@g.us')) throw new Error('unexpected allow for other group');
  });

  await test('Access control - DMs allow/deny & note takers', () => {
    if (!isAllowedChat('1111@s.whatsapp.net')) throw new Error('allowed DM not whitelisted');
    if (!isAllowedChat('3333@s.whatsapp.net')) throw new Error('note taker DM not allowed');
    if (isAllowedChat('9999@s.whatsapp.net')) throw new Error('unexpected allow for unknown DM');
  });

  await test('Fuzzy trigger detection', () => {
    const cases = ['zen', 'aizen', 'zeeeen', 'zzzznnn', 'random'];
    const expected = [true, true, true, true, false];
    cases.forEach((t, i) => {
      const got = fuzzyTrigger(t);
      if (got !== expected[i]) throw new Error(`fuzzy failed for ${t}`);
    });
  });

  await test('Mention all builds mentions list', async () => {
    const sock = new MockSock(['111@s.whatsapp.net', '222@s.whatsapp.net']);
    await handleMentionAll({ sock: sock as any, jid: '12345@g.us', text: 'Besok kumpul 7' });
    if (sock.sent.length !== 1) throw new Error('no message sent');
    const m = sock.sent[0].content;
    if (!m.mentions || m.mentions.length !== 2) throw new Error('mentions missing');
  });

  await test('Tools: getSchedule & changeSchedule', async () => {
    const res1 = await handleToolCall({ name: 'getSchedule', args: { dayName: 'Mon', date: '2025-08-25' } });
    if (res1.totalClasses < 1) throw new Error('getSchedule empty');
    const res2 = await handleToolCall({ name: 'changeSchedule', args: { _requesterJid: '1111@s.whatsapp.net', course: 'Tekdig', date: '2025-08-25', start: '17:00', end: '19:00', room: 'LAB-3', reason: 'pindah sementara' } });
    if (!res2.success) throw new Error('changeSchedule failed');
  });

  await test('Tools: set/delete reminder', async () => {
    const add = await handleToolCall({ name: 'setReminder', args: { type: 'task', title: 'Tugas EM', dueISO: '2025-09-01T17:00:00', course: 'Medan Elektromagnetik' } });
    if (!add.success) throw new Error('setReminder failed');
    const id = add.id;
    const del = await handleToolCall({ name: 'deleteReminder', args: { id } });
    if (!del.success) throw new Error('deleteReminder failed');
  });

  await test('Tools: set/delete exam', async () => {
    const add = await handleToolCall({ name: 'setExam', args: { course: 'Medan Elektromagnetik', type: 'UTS', dateISO: '2025-09-10', start: '09:00', end: '11:00', room: 'A-101' } });
    if (!add.success) throw new Error('setExam failed');
    const id = add.id;
    const del = await handleToolCall({ name: 'deleteExam', args: { id } });
    if (!del.success) throw new Error('deleteExam failed');
  });

  await test('Tools: carry items set/delete', async () => {
    const set = await handleToolCall({ name: 'setCarryItem', args: { course: 'Medan Elektromagnetik', items: ['kalkulator', 'penggaris'] } });
    if (!set.success) throw new Error('setCarryItem failed');
    const delPartial = await handleToolCall({ name: 'deleteCarryItem', args: { course: 'Medan Elektromagnetik', items: ['penggaris'] } });
    if (!delPartial.success) throw new Error('deleteCarryItem partial failed');
    const delAll = await handleToolCall({ name: 'deleteCarryItem', args: { course: 'Medan Elektromagnetik' } });
    if (!delAll.success) throw new Error('deleteCarryItem all failed');
  });

  await test('Role gating: cash reminders only for bendahara/developer/ketua', async () => {
    const allowed = await handleToolCall({ name: 'setCashReminder', args: { _requesterJid: '1111@s.whatsapp.net', amount: 50000, dueISO: '2025-08-24T17:00:00' } });
    if (!allowed.success) throw new Error('setCashReminder should be allowed for bendahara');
    const denied = await handleToolCall({ name: 'setCashReminder', args: { _requesterJid: '2222@s.whatsapp.net', amount: 10000, dueISO: '2025-08-24T17:00:00' } });
    if (denied.success) throw new Error('setCashReminder should be denied for regular user');
  });

  await test('@ll gating by fun role & core roles and cooldown/chunking', async () => {
    // prepare a mock sock and participants (150 members)
    const { handleTagAll } = await import('../src/features/tagAll.js');
    class S extends MockSock {
      constructor(n: number) { super(Array.from({ length: n }, (_, i) => `${1000+i}@s.whatsapp.net`)); }
    }
    const sock: any = new S(150);
    // whitelist: user 2222 is regular (anak_baik), user 3333 is anak_nakal non-core
    await saveData('whitelist', {
      people: [
        { wa: '2222', name: 'Good', roles: [], funRole: 'anak_baik' },
        { wa: '3333', name: 'Bad', roles: [], funRole: 'anak_nakal' },
        { wa: '1111', name: 'Admin', roles: ['developer'], funRole: 'anak_baik' }
      ],
      dmAllowed: ['1111','2222','3333'], groupAllowed: ['12345@g.us']
    });
    const msgBase = (from: string) => ({ key: { remoteJid: '12345@g.us', participant: from }, message: { conversation: '@ll Halo semua' } });
    const isAllowed = async (senderJid: string) => {
      const wl = getData('whitelist');
      const wa = senderJid.replace(/@s\.whatsapp\.net$/, '');
      const p = wl.people.find((x: any) => x.wa === wa);
      const fun = p?.funRole || 'anak_baik';
      const core = Array.isArray(p?.roles) && p.roles.some((r: string) => ['ketua_kelas','bendahara','sekretaris','developer'].includes(r));
      if (fun === 'anak_nakal' && !core) return false;
      return true;
    };
    // 3333 (anak_nakal non-core) should be denied
    const denied = await handleTagAll(sock, msgBase('3333@s.whatsapp.net') as any, '@ll test', { isAllowedByRoles: isAllowed, rateLimitMs: 1 });
    if (!denied) throw new Error('handleTagAll should consume message');
    if (!sock.sent[sock.sent.length-1].content.text.includes('tidak diizinkan')) throw new Error('deny message missing');
    // 1111 developer allowed, chunking 150 => 2 messages
    const before = sock.sent.length;
    await handleTagAll(sock, msgBase('1111@s.whatsapp.net') as any, '@ll test', { isAllowedByRoles: isAllowed, rateLimitMs: 1, batchSize: 80 });
    const diff = sock.sent.length - before;
    if (diff < 2) throw new Error('expected chunked messages');
    // cooldown: immediate second call should hit cooldown
    const sentBefore = sock.sent.length;
    await handleTagAll(sock, msgBase('1111@s.whatsapp.net') as any, '@ll test again', { isAllowedByRoles: isAllowed, rateLimitMs: 60*1000 });
    if (sock.sent.length === sentBefore) throw new Error('cooldown response not sent');
  });

  await test('!intro bypass', async () => {
    const sock = new MockSock();
    const { INTRO_MESSAGE } = await import('../src/messages/intro.ts');
    const { onMessageUpsert } = await import('../src/wa/handlers.ts');
    const msg = { key: { remoteJid: '12345@g.us', fromMe: false }, message: { conversation: '!intro' } } as any;
    await onMessageUpsert({ sock: sock as any, upsert: { messages: [msg], type: 'notify' } });
    const sent = sock.sent.find(x => x.content?.text === INTRO_MESSAGE);
    if (!sent) throw new Error('Intro message not sent');
  });

  await test('Random groups: groupCount distribution and determinism', async () => {
    await updateData('whitelist', () => ({
      people: Array.from({ length: 18 }, (_, i) => ({ wa: `62${1000+i}`, name: `P${i+1}`, abs: i+1, roles: [] })),
      dmAllowed: [], groupAllowed: ['12345@g.us']
    }));
    const r1 = await handleToolCall({ name: 'makeRandomGroups', args: { groupCount: 5, seed: 'abc' } });
    const r2 = await handleToolCall({ name: 'makeRandomGroups', args: { groupCount: 5, seed: 'abc' } });
    if (!r1.groups || r1.groups.length !== 5) throw new Error('groups not 5');
    const sizes = r1.groups.map((g: any) => g.members.length);
    const max = Math.max(...sizes), min = Math.min(...sizes);
    if (max - min > 1) throw new Error('distribution not fair');
    // determinism
    const sig1 = r1.groups.map((g: any) => g.members.map((m: any) => m.wa).join(',')).join('|');
    const sig2 = r2.groups.map((g: any) => g.members.map((m: any) => m.wa).join(',')).join('|');
    if (sig1 !== sig2) throw new Error('determinism failed');
  });

  await test('Lecturer contact & class location', async () => {
    const c = await handleToolCall({ name: 'getLecturerContact', args: { nameOrCourse: 'Medan' } });
    if (!c || !Array.isArray(c.lecturers) || c.lecturers.length < 1) throw new Error('lecturer not found');
    const loc = await handleToolCall({ name: 'getClassLocation', args: { course: 'Medan Elektromagnetik', dateISO: '2025-08-25' } });
    if (!loc.room) throw new Error('class location missing');
  });

  await test('Fun role set/get & rate-limit quotes', async () => {
    // set fun role (bendahara changing other user)
    const set = await handleToolCall({ name: 'setFunRole', args: { _requesterJid: '1111@s.whatsapp.net', targetWa: '2222', role: 'anak_nakal' } });
    if (!set.ok) throw new Error('setFunRole failed');
    const get = await handleToolCall({ name: 'getFunRole', args: { _requesterJid: '2222@s.whatsapp.net' } });
    if (get.role !== 'anak_nakal') throw new Error('getFunRole mismatch');
  });

  await test('Materials: saveIncomingMedia + search + send', async () => {
    const course = 'Medan Elektromagnetik';
    const date = '2025-08-22';
    const dir = await ensureCourseDir(course, date);
    const buf = Buffer.from('testdata');
    await saveIncomingMedia({
      sock: new MockSock() as any,
      msg: { key: { remoteJid: '3333@s.whatsapp.net', fromMe: false }, message: {}, messageTimestamp: Date.now() } as any,
      buffer: buf,
      filename: 'board.jpg',
      caption: 'pembahasan vector dan dot product',
      mediaType: 'image'
    });
    const found = await searchMaterials('vector');
    if (!Array.isArray(found) || found.length < 1) throw new Error('searchMaterials failed');
    const sock = new MockSock();
    const sentOk = await sendMaterialToChat(sock as any, '1111@s.whatsapp.net', found[0].id);
    if (!sentOk) throw new Error('sendMaterialToChat failed');
  });

  // Summarize
  const pass = RESULTS.filter(r => r.ok).length;
  const total = RESULTS.length;
  const lines = RESULTS.map(r => `- ${r.ok ? '✅' : '❌'} ${r.name}${r.ok ? '' : ` — ${r.info}`}`);
  const summary = [`# Automated Feature Tests`, '', `Total: ${pass}/${total} passed`, '', ...lines, ''].join('\n');
  await writeFile('tests/TEST_RESULTS.md', summary, 'utf8');

  // Append to README (replace or add section)
  try {
    const readme = await readFile('README.md', 'utf8');
    const start = '<!-- TEST_RESULTS_START -->';
    const end = '<!-- TEST_RESULTS_END -->';
    const block = `${start}\n\n${summary}\n${end}`;
    let next: string;
    if (readme.includes(start) && readme.includes(end)) {
      next = readme.replace(new RegExp(`${start}[\s\S]*?${end}`, 'm'), block);
    } else {
      next = readme + '\n\n' + block + '\n';
    }
    await writeFile('README.md', next, 'utf8');
  } catch {}

  // Restore backups
  for (const f of files) await restore(f, backups[f]);

  // Print concise output
  console.log(`Passed ${pass}/${total}`);
  if (pass !== total) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });


