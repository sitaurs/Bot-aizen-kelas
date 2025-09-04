import { z } from 'zod';
import { getData, saveData, updateData } from '../storage/files.js';
import { buildEnrichedSchedule, findLecturerByCourse, DayMap, EnrichedClass, getOverridesFor, mergeWithOverrides, enrich } from '../storage/loaders.js';
import { getPersonByJid, assertHasCoreRole, setFunRoleByWa, getFunRoleByJid, updateCoreRolesByWa, getPersonByWa, getPersonByNameOrAbs } from '../utils/access.js';
import { generateReminderId, generateExamId, generateCashId, generateMaterialId } from '../utils/id.js';
import { getToday, getDayName, normalizeRelativeDate } from '../utils/time.js';
import { logger } from '../utils/logger.js';
import { validateMentionAllAccess, validateCoreRoleAccess } from '../utils/gating.js';
import { assertUniqueTools } from '../utils/toolValidation.js';
import { 
  ClassSchedule, 
  ScheduleOverride, 
  Reminder, 
  Exam, 
  CashReminder, 
  MaterialEntry,
  Lecturer 
} from '../types/index.js';
import { resolveCourseAlias } from '../features/courses.js';
import { reminderToolDecls, reminderToolHandler } from './tools.reminder.js';


function logToolStart(name: string, args: any) {
  logger.info({ tool: name, args }, 'tool.start');
}
function logToolSuccess(name: string, result: any) {
  logger.info({ tool: name, result }, 'tool.success');
}

// Function declarations for Gemini AI
export const tools = [
  {
    name: 'getTodayScheduleEnriched',
    description: 'Mengambil jadwal enriched untuk hari ini (dengan dosen & WA)',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'setFunRole',
    description: 'Mengubah fun role user (anak_baik/anak_nakal)',
    parameters: {
      type: 'object',
      properties: {
        targetWa: { type: 'string', description: 'Nomor WA E164 tanpa plus' },
        role: { type: 'string', enum: ['anak_baik','anak_nakal'] }
      },
      required: ['targetWa','role']
    }
  },
  {
    name: 'getFunRole',
    description: 'Mendapatkan fun role user',
    parameters: {
      type: 'object',
      properties: {
        wa: { type: 'string', description: 'Nomor WA E164 (opsional). Default infer pengirim.' }
      }
    }
  },
  {
    name: 'updateCoreRoles',
    description: 'Tambah/hapus core role user pada whitelist',
    parameters: {
      type: 'object',
      properties: {
        target: { anyOf: [
          { type: 'string', description: 'wa (E164) atau nama' },
          { type: 'number', description: 'nomor absen' }
        ] },
        add: { type: 'array', items: { type: 'string', enum: ['ketua_kelas','bendahara','sekretaris','developer'] } },
        remove: { type: 'array', items: { type: 'string', enum: ['ketua_kelas','bendahara','sekretaris','developer'] } }
      },
      required: ['target']
    }
  },
  {
    name: 'getPerson',
    description: 'Ambil info orang dari whitelist',
    parameters: {
      type: 'object',
      properties: {
        target: { anyOf: [{ type: 'string' }, { type: 'number' }], description: 'wa/nama/abs' }
      },
      required: ['target']
    }
  },
  {
    name: 'makeRandomGroups',
    description: 'Bagi anggota whitelist menjadi beberapa kelompok secara adil & acak',
    parameters: {
      type: 'object',
      properties: {
        groupCount: { type: 'number', description: 'Jumlah kelompok (prioritas jika bersama size)' },
        size: { type: 'number', description: 'Jumlah anggota per kelompok' },
        excludeWa: { type: 'array', items: { type: 'string' }, description: 'Daftar E164 untuk dikecualikan' },
        seed: { type: 'string', description: 'Seed deterministik opsional' }
      }
    }
  },
  {
    name: 'getScheduleByDay',
    description: 'Mengambil jadwal enriched untuk hari tertentu',
    parameters: {
      type: 'object',
      properties: {
        dayName: { type: 'string', enum: ['senin','selasa','rabu','kamis','jumat'] }
      },
      required: ['dayName']
    }
  },
  {
    name: 'getWeeklySchedule',
    description: 'Mengambil jadwal enriched untuk rentang tanggal (default Senin–Jumat jika tanpa argumen)',
    parameters: {
      type: 'object',
      properties: {
        startISO: { type: 'string', description: 'Tanggal mulai (YYYY-MM-DD), opsional' },
        endISO: { type: 'string', description: 'Tanggal akhir (YYYY-MM-DD), opsional' },
        includeWeekend: { type: 'boolean', description: 'Sertakan Sabtu/Minggu jika true' }
      }
    }
  },
  {
    name: 'lookupLecturerByCourse',
    description: 'Mencari dosen berdasarkan nama mata kuliah',
    parameters: {
      type: 'object',
      properties: { course: { type: 'string' } },
      required: ['course']
    }
  },
  {
    name: 'getTodayInfo',
    description: 'Mengembalikan tanggal hari ini (Asia/Jakarta) dan nama harinya',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'askClarify',
    description: 'Meminta pertanyaan klarifikasi ke pengguna saat parameter kurang/ambiguous',
    parameters: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'Pertanyaan klarifikasi singkat' },
        expect: {
          type: 'array',
          description: 'Daftar slot/parameter yang diharapkan',
          items: { type: 'string' }
        }
      },
      required: ['question']
    }
  },
  {
    name: 'addMaterials',
    description: 'Menambahkan materi (caption + file) ke index dan storage lokal',
    parameters: {
      type: 'object',
      properties: {
        course: { type: 'string', description: 'Nama mata kuliah' },
        dateISO: { type: 'string', description: 'Tanggal materi (YYYY-MM-DD)' },
        caption: { type: 'string', description: 'Caption penjelasan materi' },
        files: {
          type: 'array',
          description: 'Daftar file materi',
          items: {
            type: 'object',
            properties: {
              tempPath: { type: 'string', description: 'Path sementara atau lokal file' },
              filename: { type: 'string', description: 'Nama file' },
              mime: { type: 'string', description: 'MIME type file' }
            },
            required: ['filename', 'mime']
          }
        }
      },
      required: ['course', 'dateISO', 'caption']
    }
  },
  {
    name: 'mentionAll',
    description: 'Mention semua anggota grup dengan pesan',
    parameters: {
      type: 'object',
      properties: {
        groupJid: { type: 'string', description: 'JID grup' },
        text: { type: 'string', description: 'Pesan untuk dikirim' }
      },
      required: ['text']
    }
  },
  {
    name: 'setHydrationPlan',
    description: 'Mengatur target hidrasi harian',
    parameters: {
      type: 'object',
      properties: {
        dailyGoalMl: { type: 'number', description: 'Target ml per hari' },
        glassSizeMl: { type: 'number', description: 'Ukuran gelas ml' }
      },
      required: ['dailyGoalMl', 'glassSizeMl']
    }
  },
  {
    name: 'getHydrationPlan',
    description: 'Mengambil target hidrasi yang tersimpan',
    parameters: { type: 'object', properties: {} }
  },
  {
    name: 'getSchedule',
    description: 'Mendapatkan jadwal kelas untuk hari tertentu',
    parameters: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Tanggal dalam format YYYY-MM-DD (opsional, default hari ini)'
        },
        dayName: {
          type: 'string',
          description: 'Nama hari (Mon, Tue, Wed, Thu, Fri, Sat, Sun)'
        }
      }
    }
  },
  {
    name: 'changeSchedule',
    description: 'Mengubah jadwal sementara untuk mata kuliah tertentu',
    parameters: {
      type: 'object',
      properties: {
        course: {
          type: 'string',
          description: 'Nama mata kuliah'
        },
        dayName: {
          type: 'string',
          description: 'Nama hari relatif (mis. Senin, besok) opsional'
        },
        date: {
          type: 'string',
          description: 'Tanggal dalam format YYYY-MM-DD'
        },
        start: {
          type: 'string',
          description: 'Waktu mulai dalam format HH:mm'
        },
        end: {
          type: 'string',
          description: 'Waktu selesai dalam format HH:mm'
        },
        room: {
          type: 'string',
          description: 'Ruangan (opsional)'
        },
        reason: {
          type: 'string',
          description: 'Alasan perubahan jadwal'
        }
      },
      required: ['course', 'start', 'end']
    }
  },
  {
    name: 'changeSchedulePermanent',
    description: 'Mengubah jadwal PERMANEN untuk mata kuliah tertentu (base schedule)',
    parameters: {
      type: 'object',
      properties: {
        course: {
          type: 'string',
          description: 'Nama mata kuliah'
        },
        dayName: {
          type: 'string',
          description: 'Nama hari (senin, selasa, rabu, kamis, jumat, sabtu, minggu)'
        },
        start: {
          type: 'string',
          description: 'Waktu mulai dalam format HH:mm'
        },
        end: {
          type: 'string',
          description: 'Waktu selesai dalam format HH:mm'
        },
        room: {
          type: 'string',
          description: 'Ruangan (opsional)'
        },
        reason: {
          type: 'string',
          description: 'Alasan perubahan jadwal'
        }
      },
      required: ['course', 'dayName', 'start', 'end']
    }
  },
  {
    name: 'setReminder',
    description: 'Mengatur pengingat tugas atau acara',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['task', 'exam', 'cash', 'item'],
          description: 'Jenis pengingat'
        },
        title: {
          type: 'string',
          description: 'Judul pengingat'
        },
        course: {
          type: 'string',
          description: 'Mata kuliah (opsional)'
        },
        dueISO: {
          type: 'string',
          description: 'Tanggal dan waktu deadline dalam format ISO'
        },
        notes: {
          type: 'string',
          description: 'Catatan tambahan (opsional)'
        }
      },
      required: ['type', 'title', 'dueISO']
    }
  },
  {
    name: 'setExam',
    description: 'Mengatur jadwal ujian',
    parameters: {
      type: 'object',
      properties: {
        course: {
          type: 'string',
          description: 'Mata kuliah'
        },
        type: {
          type: 'string',
          enum: ['UTS', 'UAS', 'Quiz'],
          description: 'Jenis ujian'
        },
        dateISO: {
          type: 'string',
          description: 'Tanggal ujian dalam format ISO'
        },
        start: {
          type: 'string',
          description: 'Waktu mulai dalam format HH:mm'
        },
        end: {
          type: 'string',
          description: 'Waktu selesai dalam format HH:mm'
        },
        room: {
          type: 'string',
          description: 'Ruangan (opsional)'
        },
        notes: {
          type: 'string',
          description: 'Catatan tambahan (opsional)'
        }
      },
      required: ['course', 'type', 'dateISO', 'start', 'end']
    }
  },
  {
    name: 'deleteExam',
    description: 'Menghapus jadwal ujian berdasarkan ID',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID ujian yang akan dihapus'
        }
      },
      required: []
    }
  },
  {
    name: 'setCashReminder',
    description: 'Mengatur pengingat pembayaran kas',
    parameters: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Jumlah yang harus dibayar'
        },
        dueISO: {
          type: 'string',
          description: 'Tanggal deadline dalam format ISO'
        },
        notes: {
          type: 'string',
          description: 'Catatan tambahan (opsional)'
        }
      },
      required: ['amount', 'dueISO']
    }
  },
  {
    name: 'deleteCashReminder',
    description: 'Menghapus pengingat kas berdasarkan ID',
    parameters: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID pengingat kas yang akan dihapus'
        }
      },
      required: []
    }
  },
  {
    name: 'setCarryItem',
    description: 'Mengatur barang bawaan untuk mata kuliah',
    parameters: {
      type: 'object',
      properties: {
        course: {
          type: 'string',
          description: 'Mata kuliah'
        },
        items: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Daftar barang yang harus dibawa'
        }
      },
      required: ['course', 'items']
    }
  },
  {
    name: 'deleteCarryItem',
    description: 'Menghapus barang bawaan untuk mata kuliah',
    parameters: {
      type: 'object',
      properties: {
        course: {
          type: 'string',
          description: 'Mata kuliah'
        },
        items: {
          type: 'array',
          items: {
            type: 'string'
          },
          description: 'Daftar barang yang akan dihapus (opsional, jika kosong hapus semua)'
        }
      },
      required: ['course']
    }
  },
  {
    name: 'queryMaterials',
    description: 'Mencari materi berdasarkan query',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Kata kunci pencarian'
        },
        course: {
          type: 'string',
          description: 'Mata kuliah (opsional)'
        },
        dateFrom: {
          type: 'string',
          description: 'Tanggal mulai pencarian dalam format YYYY-MM-DD (opsional)'
        },
        dateTo: {
          type: 'string',
          description: 'Tanggal akhir pencarian dalam format YYYY-MM-DD (opsional)'
        },
        topK: {
          type: 'number',
          description: 'Jumlah hasil maksimal (opsional, default 5)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'getLecturerContact',
    description: 'Mendapatkan kontak dosen berdasarkan nama atau mata kuliah',
    parameters: {
      type: 'object',
      properties: {
        nameOrCourse: {
          type: 'string',
          description: 'Nama dosen atau mata kuliah'
        }
      },
      required: ['nameOrCourse']
    }
  },
  {
    name: 'getLecturerInfo',
    description: 'Mendapatkan info dosen (kode, nama, wa, waJid) berdasarkan code/nama/course',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'number', description: 'Kode dosen' },
        name: { type: 'string', description: 'Nama dosen' },
        course: { type: 'string', description: 'Nama mata kuliah' }
      }
    }
  },
  {
    name: 'getLecturerByCourse',
    description: 'Ambil dosen berdasarkan query nama matkul atau alias (mikro, rektraf, FO, dst)',
    parameters: {
      type: 'object',
      properties: {
        courseQuery: { type: 'string', description: 'Nama/alias matkul' }
      },
      required: ['courseQuery']
    }
  },
  {
    name: 'getLecturerSchedule',
    description: 'Mengambil jadwal mengajar dosen berdasarkan code/nama, opsional filter per hari',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'number', description: 'Kode dosen' },
        name: { type: 'string', description: 'Nama dosen' },
        dayName: { type: 'string', enum: ['senin','selasa','rabu','kamis','jumat'] }
      }
    }
  },
  {
    name: 'getClassLocation',
    description: 'Mendapatkan lokasi kelas untuk mata kuliah tertentu',
    parameters: {
      type: 'object',
      properties: {
        course: {
          type: 'string',
          description: 'Mata kuliah'
        },
        dateISO: {
          type: 'string',
          description: 'Tanggal dalam format ISO (opsional, default hari ini)'
        },
        dayName: {
          type: 'string',
          description: 'Nama hari relatif (mis. hari ini, besok, Senin) opsional'
        }
      },
      required: ['course']
    }
  },
  // === Universal Reminder tools ===
  ...reminderToolDecls
];

// Build unified function declarations with deduplication
export function buildFunctionDeclarations() {
  const allTools = [...tools, ...reminderToolDecls];
  
  // Deduplicate by name
  const uniqueTools = new Map();
  for (const tool of allTools) {
    if (uniqueTools.has(tool.name)) {
      logger.warn(`[TOOLS] Duplicate tool name detected: ${tool.name} - keeping first declaration`);
    } else {
      uniqueTools.set(tool.name, tool);
    }
  }
  
  const finalTools = Array.from(uniqueTools.values());
  
  // Validate uniqueness
  assertUniqueTools(finalTools);
  
  logger.info(`[TOOLS] Built ${finalTools.length} unique function declarations`);
  return finalTools;
}

// Export the main tools array for backward compatibility
export const functionDeclarations = buildFunctionDeclarations();

// Tool handlers
export async function handleToolCall(functionCall: any): Promise<any> {
  const { name, args } = functionCall;

  try {
    logToolStart(name, args);
    const result = await (async () => {
      switch (name) {
        case 'getTodayScheduleEnriched':
          return await getTodayScheduleEnrichedHandler(args);
        case 'getScheduleByDay':
          return await getScheduleByDayHandler(args);
        case 'getWeeklySchedule':
          return await getWeeklyScheduleHandler(args);
        case 'lookupLecturerByCourse':
          return await lookupLecturerByCourseHandler(args);
        case 'getTodayInfo':
          return await getTodayInfoHandler(args);
        case 'getSchedule':
          return await getScheduleHandler(args);
        case 'changeSchedule':
          return await changeScheduleHandler(args);
        case 'changeSchedulePermanent':
          return await changeSchedulePermanentHandler(args);
        case 'setExam':
          return await setExamHandler(args);
        case 'deleteExam':
          return await deleteExamHandler(args);
        case 'setCashReminder':
          return await setCashReminderHandler(args);
        case 'deleteCashReminder':
          return await deleteCashReminderHandler(args);
        case 'setCarryItem':
          return await setCarryItemHandler(args);
        case 'deleteCarryItem':
          return await deleteCarryItemHandler(args);
        case 'queryMaterials':
          return await queryMaterialsHandler(args);
        case 'getLecturerContact':
          return await getLecturerContactHandler(args);
        case 'getLecturerInfo':
          return await getLecturerInfoHandler(args);
        case 'getLecturerSchedule':
          return await getLecturerScheduleHandler(args);
        case 'getClassLocation':
          return await getClassLocationHandler(args);
        case 'getLecturerByCourse':
          return await getLecturerByCourseHandler(args);
        case 'addMaterials':
          return await addMaterialsHandler(args);
        case 'mentionAll':
          return await mentionAllHandler(args);
        case 'setHydrationPlan':
          return await setHydrationPlanHandler(args);
        case 'getHydrationPlan':
          return await getHydrationPlanHandler(args);
        case 'askClarify':
          return await askClarifyHandler(args);
        case 'setFunRole':
          return await setFunRoleHandler(args);
        case 'getFunRole':
          return await getFunRoleHandler(args);
        case 'updateCoreRoles':
          return await updateCoreRolesHandler(args);
        case 'makeRandomGroups':
          return await makeRandomGroupsHandler(args);
        // URE tools - Unified routing tanpa duplikasi
        case 'createUniversalReminder':
        case 'updateUniversalReminder':
        case 'pauseReminder':
        case 'resumeReminder':
        case 'deleteReminder':
        case 'listReminders':
        case 'snoozeReminder':
          return await reminderToolHandler(name, args);
        default:
          throw new Error(`Unknown function: ${name}`);
      }
    })();
    logToolSuccess(name, result);
    return result;
  } catch (error) {
    logger.error(`Error in tool handler ${name}:`, error as any);
    return { error: (error as any).message };
  }
}

// Handler implementations
async function getScheduleHandler(args: any) {
  const date = args.date || normalizeRelativeDate(args.dayName || '') || getToday();
  const dayName = getDayName(date);
  
  // Use enriched schedule instead of raw schedule
  const enriched = await ensureEnriched();
  const map: any = { mon: 'senin', tue: 'selasa', wed: 'rabu', thu: 'kamis', fri: 'jumat', sat: 'sabtu', sun: 'minggu' };
  const indonesianDay = (dayName ? map[String(dayName).toLowerCase()] : 'senin');
  
  const classes = (enriched as any)[indonesianDay] || [];
  
  // Check for overrides on this specific date
  const schedule = getData('schedule');
  const overrides = schedule.overrides.filter((o: ScheduleOverride) => o.date === date);

  return {
    date,
    dayName: indonesianDay,
    regularSchedule: classes,
    overrides,
    totalClasses: classes.length + overrides.length
  };
}

async function changeScheduleHandler(args: any) {
  if (args?._requesterJid) {
    try { assertHasCoreRole(args._requesterJid, ['ketua_kelas','developer','sekretaris','bendahara']); } catch (e: any) { return { success: false, message: e?.message || 'Tidak berwenang' }; }
  }
  if (!args.date) {
    const normalized = normalizeRelativeDate(args.dayName || args.date || '');
    if (normalized) args.date = normalized;
  }
  const override: ScheduleOverride = {
    date: args.date,
    course: args.course,
    start: args.start,
    end: args.end,
    room: args.room,
    reason: args.reason
  };

  await updateData('schedule', (schedule) => {
    schedule.overrides.push(override);
    return schedule;
  });

  return { success: true, message: `Jadwal ${args.course} berhasil diubah untuk ${args.date}` };
}

async function changeSchedulePermanentHandler(args: any) {
  if (args?._requesterJid) {
    try { assertHasCoreRole(args._requesterJid, ['ketua_kelas','developer','sekretaris','bendahara']); } catch (e: any) { return { success: false, message: e?.message || 'Tidak berwenang' }; }
  }
  
  const dayNameLower = args.dayName.toLowerCase();
  
  // Map Indonesian day names to English abbreviations
  const dayMap: { [key: string]: string } = {
    'senin': 'Mon',
    'selasa': 'Tue', 
    'rabu': 'Wed',
    'kamis': 'Thu',
    'jumat': 'Fri',
    'sabtu': 'Sat',
    'minggu': 'Sun'
  };
  
  const dayKey = dayMap[dayNameLower];
  if (!dayKey) {
    return { success: false, message: `Hari "${args.dayName}" tidak valid. Gunakan: senin, selasa, rabu, kamis, jumat, sabtu, minggu` };
  }
  
  await updateData('schedule', (schedule) => {
    const dayClasses = schedule.days[dayKey];
    if (!dayClasses) {
      return { success: false, message: `Tidak ada jadwal untuk hari ${args.dayName}` };
    }
    
    // Find the class in the day schedule
    const classIndex = dayClasses.findIndex((cls: ClassSchedule) => {
      const courseMatch = cls.course.toLowerCase().includes(args.course.toLowerCase()) || 
                         args.course.toLowerCase().includes(cls.course.toLowerCase());
      return courseMatch;
    });
    
    if (classIndex !== -1) {
      // Update the existing class
      dayClasses[classIndex].start = args.start;
      dayClasses[classIndex].end = args.end;
      if (args.room) {
        dayClasses[classIndex].room = args.room;
      }
    } else {
      return { success: false, message: `Mata kuliah "${args.course}" pada hari ${args.dayName} tidak ditemukan` };
    }
    
    return schedule;
  });

  return { success: true, message: `✅ Jadwal ${args.course} berhasil diubah PERMANEN untuk hari ${args.dayName} menjadi ${args.start}-${args.end}` };
}

async function setReminderHandler(args: any) {
  try {
    logger.info('[REMINDER] Creating reminder with args');
    logger.info(args);
    
    const reminder: Reminder = {
      id: generateReminderId(),
      type: args.type,
      title: args.title,
      course: args.course,
      dueISO: args.dueISO,
      notes: args.notes,
      completed: false
    };

    logger.info('[REMINDER] Reminder object created');
    logger.info(reminder);

    await updateData('reminders', (reminders) => {
      logger.info('[REMINDER] Current reminders before update');
      logger.info(reminders);
      reminders.push(reminder);
      logger.info('[REMINDER] Reminders after push');
      logger.info(reminders);
      return reminders;
    });

    logger.info('[REMINDER] Reminder saved successfully');
    return { success: true, id: reminder.id, message: 'Pengingat berhasil ditambahkan' };
  } catch (error) {
    logger.error('[REMINDER] Error in setReminderHandler');
    logger.error(error);
    throw error;
  }
}

async function setExamHandler(args: any) {
  const exam: Exam = {
    id: generateExamId(),
    course: args.course,
    type: args.type,
    dateISO: args.dateISO,
    start: args.start,
    end: args.end,
    room: args.room,
    notes: args.notes
  };

  await updateData('exams', (exams) => {
    if (!exams) exams = [];
    exams.push(exam);
    return exams;
  });

  return { success: true, id: exam.id, message: 'Jadwal ujian berhasil ditambahkan' };
}

async function deleteExamHandler(args: any) {
  if (args.id) {
    await updateData('exams', (exams) => {
      if (!exams) return [];
      return exams.filter((e: Exam) => e.id !== args.id);
    });
    return { success: true, message: 'Jadwal ujian berhasil dihapus' };
  }
  // delete latest if no id
  let deleted: Exam | null = null as any;
  await updateData('exams', (exams) => {
    if (!exams || exams.length === 0) return exams || [];
    deleted = exams[exams.length - 1];
    return exams.slice(0, -1);
  });
  return deleted ? { success: true, deletedId: deleted.id, message: 'Jadwal ujian terakhir dihapus' } : { success: false, message: 'Tidak ada ujian untuk dihapus' };
}

async function setCashReminderHandler(args: any) {
  if (args?._requesterJid) {
    try { assertHasCoreRole(args._requesterJid, ['bendahara','developer','ketua_kelas']); } catch (e: any) { return { success: false, message: e?.message || 'Tidak berwenang' }; }
  }
  const cashReminder: CashReminder = {
    id: generateCashId(),
    amount: args.amount,
    dueISO: args.dueISO,
    notes: args.notes,
    paid: false
  };

  await updateData('cashReminders', (reminders) => {
    if (!reminders) reminders = [];
    reminders.push(cashReminder);
    return reminders;
  });

  return { success: true, id: cashReminder.id, message: 'Pengingat kas berhasil ditambahkan' };
}

async function deleteCashReminderHandler(args: any) {
  if (args?._requesterJid) {
    try { assertHasCoreRole(args._requesterJid, ['bendahara','developer','ketua_kelas']); } catch (e: any) { return { success: false, message: e?.message || 'Tidak berwenang' }; }
  }
  if (args.id) {
    await updateData('cashReminders', (reminders) => {
      if (!reminders) return [];
      return reminders.filter((r: CashReminder) => r.id !== args.id);
    });
    return { success: true, message: 'Pengingat kas berhasil dihapus' };
  }
  // delete latest if no id
  let deleted: CashReminder | null = null as any;
  await updateData('cashReminders', (reminders) => {
    if (!reminders || reminders.length === 0) return reminders || [];
    deleted = reminders[reminders.length - 1];
    return reminders.slice(0, -1);
  });
  return deleted ? { success: true, deletedId: deleted.id, message: 'Pengingat kas terakhir dihapus' } : { success: false, message: 'Tidak ada pengingat kas untuk dihapus' };
}

async function setCarryItemHandler(args: any) {
  await updateData('items', (items) => {
    items[args.course] = args.items;
    return items;
  });

  return { success: true, message: `Barang bawaan untuk ${args.course} berhasil diatur` };
}

async function deleteCarryItemHandler(args: any) {
  await updateData('items', (items) => {
    if (args.items && args.items.length > 0) {
      // Remove specific items
      items[args.course] = items[args.course]?.filter((item: string) => !args.items.includes(item)) || [];
    } else {
      // Remove all items for the course
      delete items[args.course];
    }
    return items;
  });

  return { success: true, message: 'Barang bawaan berhasil dihapus' };
}

async function queryMaterialsHandler(args: any) {
  const materials = getData('materials') || { byDate: {}, byCourse: {} };
  const results: any[] = [];
  const query = String(args.query || '').toLowerCase();
  
  if (!query.trim()) {
    return { materials: [], count: 0, query: args.query };
  }

  // Search in byDate first (comprehensive search)
  for (const [date, entries] of Object.entries(materials.byDate)) {
    if (!Array.isArray(entries)) continue;
    
    for (const entry of entries as any[]) {
      // Filter by course if specified
      if (args.course && entry.course && !entry.course.toLowerCase().includes(args.course.toLowerCase())) {
        continue;
      }

      // Filter by date range if specified
      if (args.dateFrom && date < args.dateFrom) continue;
      if (args.dateTo && date > args.dateTo) continue;

      // Search in caption and course name
      const searchText = `${entry.course || ''} ${entry.caption || ''}`.toLowerCase();
      if (searchText.includes(query)) {
        results.push({
          id: entry.id,
          course: entry.course,
          date: entry.date,
          link: entry.link,
          caption: entry.caption,
          type: entry.type || 'link',
          addedBy: entry.addedBy,
          timestamp: entry.timestamp
        });
      }
    }
  }

  // Remove duplicates by ID and sort by timestamp (newest first)
  const unique = results.filter((item, index, arr) => 
    arr.findIndex(x => x.id === item.id) === index
  ).sort((a, b) => new Date(b.timestamp || '').getTime() - new Date(a.timestamp || '').getTime());

  const topK = Math.min(args.topK || 10, unique.length);
  
  return { 
    materials: unique.slice(0, topK),
    count: unique.length,
    query: args.query,
    course: args.course || "semua mata kuliah"
  };
}

async function getLecturerContactHandler(args: any) {
  const enriched = await ensureEnriched();
  const queryRaw = String(args.nameOrCourse || '').trim();
  const query = queryRaw.toLowerCase();
  const pool: any[] = [];
  for (const day of Object.keys(enriched)) {
    for (const cls of (enriched as any)[day]) {
      pool.push({ course: cls.course, lecturer: cls.lecturer });
    }
  }
  // Dedup by lecturer code
  const seenCode = new Set<number>();
  const unique = pool.filter((e) => { const c = e.lecturer.code; if (seenCode.has(c)) return false; seenCode.add(c); return true; });
  // Direct contains first (handles full names/courses)
  const direct = unique.filter(e => e.course.toLowerCase().includes(query) || e.lecturer.name.toLowerCase().includes(query));
  let results = direct.map(e => e.lecturer);
  // Fuzzy fallback for abbreviations/typos (jarkom, traffi, mikrokon, antena)
  if (results.length === 0) {
    const Fuse = (await import('fuse.js')).default as any;
    const fuse = new Fuse(unique, { keys: ['course', 'lecturer.name'], includeScore: true, threshold: 0.45, ignoreLocation: true, distance: 100 });
    const altQueries = [
      queryRaw,
      queryRaw.replace(/jarkom/gi, 'Jaringan Komputer'),
      queryRaw.replace(/traff(i|ik)/gi, 'Rekayasa Trafik'),
      queryRaw.replace(/mikrokon/gi, 'Mikrokontroler'),
      queryRaw.replace(/antena/gi, 'Antena')
    ].filter((s, i, arr) => s && arr.indexOf(s) === i);
    for (const q of altQueries) {
      const hit = fuse.search(q);
      if (hit && hit.length) {
        results = hit.slice(0, 3).map((h: any) => h.item.lecturer);
        break;
      }
    }
  }
  // Dedup final list by code
  const seen = new Set<number>();
  const lecturers = results.filter((l: any) => { if (seen.has(l.code)) return false; seen.add(l.code); return true; });
  return { lecturers };
}

async function getClassLocationHandler(args: any) {
  const schedule = getData('schedule');
  const date = args.dateISO || normalizeRelativeDate(args.dayName || '') || getToday();
  const dn = getDayName(date);
  const map: any = { mon: 'senin', tue: 'selasa', wed: 'rabu', thu: 'kamis', fri: 'jumat', sat: 'sabtu', sun: 'minggu' };
  const idDay = (dn ? map[String(dn).toLowerCase()] : 'senin');

  // Check overrides first for exact date
  const override = (schedule.overrides || []).find((o: ScheduleOverride) => 
    o.date === date && String(o.course || '').toLowerCase() === String(args.course || '').toLowerCase()
  );
  if (override) {
    return {
      course: args.course,
      date,
      room: override.room,
      start: override.start,
      end: override.end,
      isOverride: true,
      reason: override.reason
    };
  }

  // Fallback to enriched schedule for that day (handles English/ID keys and lecturer join)
  const enriched = await ensureEnriched();
  const dayList: EnrichedClass[] = ((enriched as any)[idDay] || []) as any;
  const hit = dayList.find((c: EnrichedClass) => c.course.toLowerCase() === String(args.course || '').toLowerCase());
  if (hit) {
    return {
      course: hit.course,
      date,
      room: hit.room,
      start: hit.start,
      end: hit.end,
      isOverride: false
    };
  }

  return { error: `Tidak ada jadwal untuk ${args.course} pada ${date}` };
}

// === New handlers ===
async function ensureEnriched(): Promise<DayMap> {
  let enriched = getData('enrichedSchedule');
  if (!enriched) {
    enriched = await buildEnrichedSchedule();
  }
  return enriched as DayMap;
}

async function getTodayScheduleEnrichedHandler(_args: any) {
  const enriched = await ensureEnriched();
  const today = getToday();
  const dn = getDayName(today);
  const map: any = { mon: 'senin', tue: 'selasa', wed: 'rabu', thu: 'kamis', fri: 'jumat', sat: 'sabtu', sun: 'minggu' };
  const day = (dn ? map[String(dn).toLowerCase()] : 'senin');
  const schedule = getData('schedule');
  const dayClasses = ((schedule.days || {}) as any)[day] || [];
  const overrides = getOverridesFor(today);
  const merged = mergeWithOverrides(dayClasses, overrides);
  const classes = enrich(merged, enriched);
  return { dayName: day, classes };
}

async function getScheduleByDayHandler(args: any) {
  const enriched = await ensureEnriched();
  const day = String(args.dayName).toLowerCase();
  const schedule = getData('schedule');
  const today = getToday();
  const dayClasses = ((schedule.days || {}) as any)[day] || [];
  const overrides = getOverridesFor(today); // if querying today, include same-day overrides
  const todayMap: any = { mon: 'senin', tue: 'selasa', wed: 'rabu', thu: 'kamis', fri: 'jumat', sat: 'sabtu', sun: 'minggu' };
  const todayDay = todayMap[String(getDayName(today)).toLowerCase()] || 'senin';
  const merged = day === todayDay ? mergeWithOverrides(dayClasses, overrides) : dayClasses;
  const classes = enrich(merged, enriched);
  return { classes };
}

async function getWeeklyScheduleHandler(args: any) {
  const enriched = await ensureEnriched();
  // If explicit range is provided, we still return by day buckets within that range
  // Default: Monday–Friday of current week
  const includeWeekend: boolean = Boolean(args?.includeWeekend);
  const daysOrderAll: string[] = ['senin','selasa','rabu','kamis','jumat','sabtu','minggu'];
  const daysOrderMF: string[] = ['senin','selasa','rabu','kamis','jumat'];
  const order = includeWeekend ? daysOrderAll : daysOrderMF;
  const week = order.map((d) => ({ dayName: d, classes: (enriched as any)[d] || [] }));
  return { week };
}

async function lookupLecturerByCourseHandler(args: any) {
  const enriched = await ensureEnriched();
  const lec = findLecturerByCourse(enriched, args.course || '');
  if (!lec) return { error: 'Tidak ditemukan' };
  return { name: lec.name, wa: lec.wa, code: lec.code };
}

async function getLecturerInfoHandler(args: any) {
  const enriched = await ensureEnriched();
  const byCode = typeof args.code === 'number' ? args.code : undefined;
  const name = args.name ? String(args.name).toLowerCase() : undefined;
  const course = args.course ? String(args.course).toLowerCase() : undefined;
  const results: any[] = [];
  for (const day of Object.keys(enriched)) {
    for (const cls of (enriched as any)[day]) {
      const l = cls.lecturer;
      if ((byCode !== undefined && l.code === byCode) ||
          (name && l.name.toLowerCase().includes(name)) ||
          (course && cls.course.toLowerCase().includes(course))) {
        results.push({ code: l.code, name: l.name, wa: l.wa, waJid: l.waJid });
      }
    }
  }
  // dedup by code
  const seen = new Set<number>();
  let lecturers = results.filter(l => { if (seen.has(l.code)) return false; seen.add(l.code); return true; });
  if (lecturers.length === 0 && (name || course)) {
    const q = name || course || '';
    const byCourse = await getLecturerByCourseHandler({ courseQuery: q });
    if (byCourse && Array.isArray(byCourse.lecturers) && byCourse.lecturers.length) return byCourse;
  }
  return { lecturers };
}

async function getLecturerScheduleHandler(args: any) {
  const enriched = await ensureEnriched();
  const byCode = typeof args.code === 'number' ? args.code : undefined;
  const name = args.name ? String(args.name).toLowerCase() : undefined;
  const dayName = args.dayName ? String(args.dayName).toLowerCase() : undefined;
  const days = dayName ? [dayName] : Object.keys(enriched);
  const classes: any[] = [];
  for (const day of days) {
    for (const cls of (enriched as any)[day] || []) {
      const l = cls.lecturer;
      if ((byCode !== undefined && l.code === byCode) || (name && l.name.toLowerCase().includes(name))) {
        classes.push({ dayName: day, course: cls.course, start: cls.start, end: cls.end, room: cls.room, lecturer: l });
      }
    }
  }
  return { classes };
}
async function getLecturerByCourseHandler(args: any) {
  const q = String(args?.courseQuery || '').trim();
  if (!q) return { error: 'invalid_query' };
  const canonical = await resolveCourseAlias(q);
  const enriched = await ensureEnriched();
  const hits: any[] = [];
  const want = (canonical || q).toLowerCase();
  for (const day of Object.keys(enriched)) {
    for (const cls of (enriched as any)[day] || []) {
      if (cls.course.toLowerCase().includes(want)) {
        const l = cls.lecturer;
        hits.push({ code: l.code, name: l.name, wa: l.wa, waJid: l.waJid });
      }
    }
  }
  // dedup by code
  const seen = new Set<number>();
  const lecturers = hits.filter(l => { if (seen.has(l.code)) return false; seen.add(l.code); return true; });
  return { lecturers };
}
async function addMaterialsHandler(args: any) {
  // Validasi MIME dan filename untuk keamanan
  const allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/avi', 'video/mov',
    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain', 'text/csv'
  ];
  
  const files = args.files || [];
  for (const file of files) {
    // Validasi filename - cegah path traversal
    if (!file.filename || 
        file.filename.includes('..') || 
        file.filename.includes('/') || 
        file.filename.includes('\\') ||
        file.filename.startsWith('.')) {
      return { success: false, message: 'Nama file tidak valid' };
    }
    
    // Validasi MIME type
    if (file.mime && !allowedMimes.includes(file.mime)) {
      return { success: false, message: `Tipe file ${file.mime} tidak diizinkan` };
    }
  }
  
  // Update materials index dengan atomic write
  const materials = getData('materials');
  const entry: any = {
    id: generateMaterialId(),
    course: args.course,
    dateISO: args.dateISO,
    captions: args.caption ? [args.caption] : [],
    files: files.map((f: any) => ({ 
      path: f.tempPath || f.filename, 
      filename: f.filename, 
      mime: f.mime 
    })),
    createdAt: new Date().toISOString()
  };
  
  if (!materials.byDate[args.dateISO]) materials.byDate[args.dateISO] = [];
  materials.byDate[args.dateISO].push(entry);
  await saveData('materials', materials);
  return { success: true, id: entry.id };
}

async function mentionAllHandler(args: any) {
  // Validasi akses menggunakan unified gating
  if (args?._requesterJid) {
    const access = validateMentionAllAccess(args._requesterJid);
    if (!access.allowed) {
      return { success: false, message: access.reason || 'Tidak berwenang' };
    }
  }
  
  // Default to GROUP_JID from env if not provided
  const groupJid = args.groupJid || process.env.GROUP_JID || '';
  return { groupJid, text: args.text, mentionAll: true };
}

async function setHydrationPlanHandler(args: any) {
  const hydration = getData('hydration') || {};
  hydration.dailyGoalMl = args.dailyGoalMl;
  hydration.glassSizeMl = args.glassSizeMl;
  await saveData('hydration', hydration);
  return { success: true, hydration };
}

async function getHydrationPlanHandler(_args: any) {
  const hydration = getData('hydration') || {};
  return { hydration };
}

async function getTodayInfoHandler(_args: any) {
  const date = getToday();
  const dayName = getDayName(date);
  return { date, dayName, timezone: 'Asia/Jakarta' };
}

async function askClarifyHandler(args: any) {
  // Echo back the clarification schema so the model can craft a question naturally
  const question = args?.question || 'Boleh jelaskan lebih spesifik?';
  const expect = Array.isArray(args?.expect) ? args.expect : [];
  return { ok: true, question, expect };
}

// === Fun role handlers ===
async function setFunRoleHandler(args: any) {
  const requesterJid = args?._requesterJid || '';
  const targetWa = String(args?.targetWa || '').replace(/\D/g, '');
  const role = args?.role === 'anak_nakal' ? 'anak_nakal' : 'anak_baik';
  // authorize: core roles or self-change
  try {
    const requester = getPersonByJid(requesterJid);
    const requesterWa = requesterJid.replace(/@s\.whatsapp\.net$/, '');
    const isSelf = requesterWa === targetWa;
    if (!isSelf) {
      assertHasCoreRole(requesterJid, ['ketua_kelas','bendahara','sekretaris','developer']);
    }
    await setFunRoleByWa(targetWa, role);
    return { ok: true, message: `Fun role untuk ${targetWa} diubah ke ${role}.` };
  } catch (e: any) {
    return { ok: false, message: e?.message || 'Tidak berwenang.' };
  }
}

async function getFunRoleHandler(args: any) {
  let wa = String(args?.wa || '').replace(/\D/g, '').replace(/^0/, '62');
  if (!wa && args?._requesterJid) {
    wa = args._requesterJid.replace(/@s\.whatsapp\.net$/, '');
  }
  if (!wa) return { role: 'anak_baik' };
  const jid = `${wa}@s.whatsapp.net`;
  // Prefer direct WA lookup to avoid waJid mismatch
  const personByWa = getPersonByWa(wa);
  if (personByWa && personByWa.funRole) return { role: personByWa.funRole };
  const role = getFunRoleByJid(jid);
  return { role };
}

async function updateCoreRolesHandler(args: any) {
  const requester = args?._requesterJid || '';
  try { assertHasCoreRole(requester, ['developer']); } catch (e: any) { return { ok: false, message: e?.message || 'Tidak berwenang' }; }
  const target = args?.target;
  let person: any = null;
  if (typeof target === 'number') person = getPersonByNameOrAbs(target);
  if (!person && typeof target === 'string') {
    const wa = target.replace(/\D/g, '').replace(/^0/, '62');
    person = getPersonByWa(wa) || getPersonByNameOrAbs(target);
  }
  if (!person) return { ok: false, message: 'Target tidak ditemukan' };
  const updated = await updateCoreRolesByWa(person.wa, args?.add, args?.remove);
  return { ok: true, message: `✅ ${updated.name} kini memiliki role: [${(updated.roles||[]).join(', ')}]`, roles: updated.roles || [] };
}

async function getPersonHandler(args: any) {
  const target = args?.target;
  let person: any = null;
  if (typeof target === 'number') person = getPersonByNameOrAbs(target);
  if (!person && typeof target === 'string') {
    const wa = target.replace(/\D/g, '').replace(/^0/, '62');
    person = getPersonByWa(wa) || getPersonByNameOrAbs(target);
  }
  if (!person) return { error: 'not_found' };
  return { wa: person.wa, name: person.name, roles: person.roles || [], funRole: person.funRole || 'anak_baik', abs: person.abs, nim: person.nim };
}

function mulberry32(seedText: string): () => number {
  // simple string hash to uint32
  let h = 1779033703 ^ seedText.length;
  for (let i = 0; i < seedText.length; i++) {
    h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function() {
    h |= 0; h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

function shuffle<T>(arr: T[], rng: () => number) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
}

async function makeRandomGroupsHandler(args: any) {
  const wl = getData('whitelist') || { people: [] };
  const exclude = new Set(((args?.excludeWa || []) as string[]).map((w) => String(w).replace(/\D/g, '').replace(/^0/, '62')));
  const candidates = (wl.people || [])
    .filter((p: any) => typeof p.abs === 'number')
    .filter((p: any) => !exclude.has(String(p.wa)));
  const N = candidates.length;
  let groupCount = typeof args?.groupCount === 'number' && args.groupCount > 0 ? Math.floor(args.groupCount) : undefined;
  const size = typeof args?.size === 'number' && args.size > 0 ? Math.floor(args.size) : undefined;
  if (!groupCount && size) groupCount = Math.ceil(N / size);
  if (!groupCount || groupCount < 2) groupCount = 2;
  if (groupCount * 2 > N) return { error: 'too_many_groups', message: 'Jumlah kelompok terlalu banyak untuk jumlah anggota.' };

  const rng = args?.seed ? mulberry32(String(args.seed)) : Math.random;
  const list = candidates.map((p: any) => ({ wa: p.wa, name: p.name, abs: p.abs }));
  shuffle(list, rng);
  const groups: { index: number; members: any[] }[] = Array.from({ length: groupCount }, (_, i) => ({ index: i + 1, members: [] as any[] }));
  let idx = 0;
  for (const m of list) {
    const gi = idx % groupCount;
    const g = groups[gi];
    if (g) (g.members as any[]).push(m);
    idx++;
  }
  // save latest
  await saveData('random_groups_latest', { createdAt: new Date().toISOString(), options: { groupCount, size, excludeWa: Array.from(exclude), seed: args?.seed || null }, groups });
  return { groups };
}
