export const TOKENS = {
  schedule: ['jadwal','kelas','hari ini','besok','lusa','minggu ini','pekan ini','mingdep','minggu depan','senin','selasa','rabu','kamis','jumat',"jum'at",'sabtu','minggu'],
  lecturer: ['dosen','pengajar','wa dosen','no dosen','siapa dosen','desen','doskn'],
  materials: ['materi','file','ppt','pdf','foto papan','kirim materi','cari materi','rumus'],
  groups: ['kelompok','grup','group','kelompak','klmpk','grum','acak'],
  tagall: ['@ll'],
  intro: ['!intro']
};

export function detectIntentGroup(text: string): keyof typeof TOKENS | null {
  const t = (text || '').toLowerCase();
  for (const key of Object.keys(TOKENS) as (keyof typeof TOKENS)[]) {
    const tokens = TOKENS[key];
    if (tokens.some(tok => t.includes(tok))) return key;
  }
  return null;
}


