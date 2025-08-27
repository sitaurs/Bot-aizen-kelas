import { getActiveCoreRoles } from './roles.js';

function formatList(names: string[]): string {
  if (!names || names.length === 0) return '-';
  return names.join(', ');
}

export async function buildIntroMessage(): Promise<string> {
  const roles = await getActiveCoreRoles();

  return `👋 Halo! Aku *Aizen* — asisten kelas JTD-2D.
Panggil aku bebas: zen / aizen / zennn / zeen (boleh di awal, tengah, atau akhir kalimat).

━━━━━━━━━━━━━━━━━━
✨ Yang bisa kulakuin
• *Jadwal & lokasi* + *dosen & WA* (FO, Rektraf, Mikrokontroler, Seluler, Antena, Jarkom, Saltran/GMI, dst)
• *Pengingat otomatis:* 06.00 (semua matkul hari ini) + *T-15* sebelum mulai
• *URE Reminder* (sekali/berulang/interval/jendela), bisa pause/resume/list/snooze
• *Materi kuliah:* simpan foto/link/file (otomatis diindeks), cari & kirim ulang
• *Tugas/Ujian/Kas/Barang bawaan:* set / ubah / hapus (pakai bahasa natural)
• *Kelompok acak adil:* “zen bentuk grup acak 5 kelompok”
• *Tag semua (@ll <pesan>):* echo pesanmu + mention semua (cooldown & chunking). Dipakai juga untuk pesan sistem (intro, ringkasan 06:00, T-15, barang, hidrasi, reminder)
• *Hidrasi:* atur target harian & ukuran gelas; cek progres
• *Fuzzy intent & alias:* paham typo/alias (mikro, rektraf, FO, dll)
• *UX:* reaksi progres + status mengetik (typing/paused) biar jelas lagi proses
• *Roles:* ketua, bendahara, sekretaris, developer (+ fun role: *anak baik* / *anak nakal*)

🔐 *DM bot:* hanya untuk nomor whitelist. Di grup, aku bakal nyapa pakai namamu 🙂
📆 TZ: *Asia/Jakarta*.

━━━━━━━━━━━━━━━━━━
🧭 Cara pakai cepat (contoh)
• Jadwal: “zen jadwal hari ini”, “zen jadwal selasa”, “zen jadwal minggu ini”, “zen jadwal senin-jumat”
• Dosen & kontak: “zen dosen mikro”, “zen WA dosen rektraf”
• Lokasi kelas: “zen kelas seluler di mana?”
• Materi: kirim foto + caption; cari “zen cari materi vektor”
• Reminder sekali: “zen set reminder besok 08:00 Kumpul tugas FO”
• Reminder berulang: “zen ingatkan tiap Senin 06:30 bawa jas lab”
• Reminder interval: “zen ingetin 3 hari sekali jam 20:00 minum vitamin”
• Reminder jendela: “zen ingetin antara 18:00–20:00 belajar 1 jam”
• Kelola reminder: “zen jeda reminder X”, “zen lanjutkan reminder X”, “zen snooze 15 menit”, “zen list reminder”
• Override: “zen ubah jadwal rektraf besok ke 13:00–15:00 di AH.1.10”
• Kelompok acak: “zen bentuk grup acak 5 kelompok”; opsi seed/exclude tersedia
• Tag semua: “@ll <pesan>” (tanpa Gemini, ada cooldown)
• Info grup/JID: ketik “!idg”

━━━━━━━━━━━━━━━━━━
👥 Peran & hak akses (aktif saat ini)
• *Ketua kelas:* ${formatList(roles.ketua_kelas)}
• *Bendahara:* ${formatList(roles.bendahara)}
• *Sekretaris:* ${formatList(roles.sekretaris)}
• *Developer (superuser):* ${formatList(roles.developer)}

• *Fun role default:* *anak baik*. Core role (ketua/bendahara/sekretaris/developer) bisa ubah ke *anak nakal* untuk seru-seruan.
  - Jika *anak nakal*, kadang akan dapat “Catatan Aizen” (rate-limit, max 1×/jam).
  - *Gating @ll:* anak nakal *tanpa* core role → *tidak diizinkan* pakai @ll.

Ketik *!intro* kapan saja buat lihat info ini lagi.`;
}


