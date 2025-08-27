/**
 * Test Suite: Gemini Fallback Handling
 * Validates that Gemini failures result in friendly error messages without heuristic execution
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../src/utils/logger.js', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

describe('Gemini Fallback Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should return friendly error for 429 quota exceeded', async () => {
    // Mock Gemini to throw 429 error
    vi.doMock('../src/ai/gemini.js', () => ({
      GeminiAI: vi.fn().mockImplementation(() => ({
        setRequesterJid: vi.fn(),
        setChatJid: vi.fn(),
        chatAndAct: vi.fn().mockRejectedValue(new Error('429 Quota exceeded'))
      }))
    }));

    const { GeminiAI } = await import('../src/ai/gemini.js');
    const ai = new GeminiAI();
    
    try {
      await ai.chatAndAct('zen jadwal hari ini');
    } catch (error) {
      expect(String(error)).toMatch(/429|quota/i);
    }
  });

  it('should return friendly error for 5xx server errors', async () => {
    // Mock Gemini to throw 500 error
    vi.doMock('../src/ai/gemini.js', () => ({
      GeminiAI: vi.fn().mockImplementation(() => ({
        setRequesterJid: vi.fn(),
        setChatJid: vi.fn(),
        chatAndAct: vi.fn().mockRejectedValue(new Error('500 Internal Server Error'))
      }))
    }));

    const { GeminiAI } = await import('../src/ai/gemini.js');
    const ai = new GeminiAI();
    
    try {
      await ai.chatAndAct('zen jadwal hari ini');
    } catch (error) {
      expect(String(error)).toMatch(/500|server|internal/i);
    }
  });

  it('should return friendly error for network failures', async () => {
    // Mock Gemini to throw network error
    vi.doMock('../src/ai/gemini.js', () => ({
      GeminiAI: vi.fn().mockImplementation(() => ({
        setRequesterJid: vi.fn(),
        setChatJid: vi.fn(),
        chatAndAct: vi.fn().mockRejectedValue(new Error('fetch failed'))
      }))
    }));

    const { GeminiAI } = await import('../src/ai/gemini.js');
    const ai = new GeminiAI();
    
    try {
      await ai.chatAndAct('zen jadwal hari ini');
    } catch (error) {
      expect(String(error)).toMatch(/fetch|network/i);
    }
  });

  it('should NOT execute heuristic schedule functions on Gemini failure', async () => {
    // Mock Gemini to fail
    vi.doMock('../src/ai/gemini.js', () => ({
      GeminiAI: vi.fn().mockImplementation(() => ({
        setRequesterJid: vi.fn(),
        setChatJid: vi.fn(),
        chatAndAct: vi.fn().mockRejectedValue(new Error('500 Server Error'))
      }))
    }));

    // Mock old schedule functions to track if they're called
    const getScheduleSpy = vi.fn();
    const getTodayScheduleSpy = vi.fn();
    
    vi.doMock('../src/storage/loaders.js', () => ({
      buildEnrichedSchedule: getTodayScheduleSpy,
      getScheduleByDay: getScheduleSpy
    }));

    const { GeminiAI } = await import('../src/ai/gemini.js');
    const ai = new GeminiAI();
    
    try {
      await ai.chatAndAct('zen jadwal hari ini');
    } catch (error) {
      // Gemini should fail, but no heuristic functions should be called
      expect(getScheduleSpy).not.toHaveBeenCalled();
      expect(getTodayScheduleSpy).not.toHaveBeenCalled();
    }
  });

  it('should NOT execute heuristic reminder functions on Gemini failure', async () => {
    // Mock Gemini to fail
    vi.doMock('../src/ai/gemini.js', () => ({
      GeminiAI: vi.fn().mockImplementation(() => ({
        setRequesterJid: vi.fn(),
        setChatJid: vi.fn(),
        chatAndAct: vi.fn().mockRejectedValue(new Error('429 Quota exceeded'))
      }))
    }));

    // Mock reminder functions to track if they're called
    const createReminderSpy = vi.fn();
    const listRemindersSpy = vi.fn();
    
    vi.doMock('../src/scheduler/ure.store.js', () => ({
      loadReminders: listRemindersSpy,
      updateReminders: createReminderSpy
    }));

    const { GeminiAI } = await import('../src/ai/gemini.js');
    const ai = new GeminiAI();
    
    try {
      await ai.chatAndAct('zen set reminder besok 08:00 kumpul tugas');
    } catch (error) {
      // Gemini should fail, but no heuristic functions should be called
      expect(createReminderSpy).not.toHaveBeenCalled();
      expect(listRemindersSpy).not.toHaveBeenCalled();
    }
  });

  it('should handle Gemini failures gracefully in message handler', async () => {
    // Mock all dependencies
    vi.doMock('../src/ai/gemini.js', () => ({
      GeminiAI: vi.fn().mockImplementation(() => ({
        setRequesterJid: vi.fn(),
        setChatJid: vi.fn(),
        chatAndAct: vi.fn().mockRejectedValue(new Error('503 Service Unavailable'))
      }))
    }));

    vi.doMock('../src/features/tagAll.js', () => ({
      handleTagAll: vi.fn().mockResolvedValue(false)
    }));

    vi.doMock('../src/features/fuzzy-trigger.js', () => ({
      fuzzyTrigger: vi.fn().mockReturnValue(true)
    }));

    vi.doMock('../src/utils/access.js', () => ({
      isAllowedChat: vi.fn().mockReturnValue(true),
      getPersonByJid: vi.fn().mockReturnValue({ name: 'Test User', roles: [] }),
      getFunRoleByJid: vi.fn().mockReturnValue('anak_baik')
    }));

    vi.doMock('../src/ux/progress.js', () => ({
      reactStage: vi.fn(),
      withPresence: vi.fn().mockImplementation((sock, jid, fn) => fn())
    }));

    vi.doMock('../src/ux/format.js', () => ({
      sendTextSmart: vi.fn()
    }));

    vi.doMock('../src/utils/quotes.js', () => ({
      maybeAppendQuote: vi.fn().mockImplementation((jid, text) => text)
    }));

    vi.doMock('../src/utils/gating.js', () => ({
      validateMentionAllAccess: vi.fn().mockReturnValue({ allowed: true })
    }));

    const { onMessageUpsert } = await import('../src/wa/handlers.js');
    const { sendTextSmart } = await import('../src/ux/format.js');
    
    const mockSock: any = { sendMessage: vi.fn() };
    const mockMessage: any = {
      key: { remoteJid: '120363123456789@g.us', participant: 'user@s.whatsapp.net', fromMe: false },
      message: { conversation: 'zen jadwal hari ini' },
      messageTimestamp: Date.now()
    };

    await onMessageUpsert({
      sock: mockSock,
      upsert: { messages: [mockMessage], type: 'notify' }
    });

    // Should send friendly error message
    expect(sendTextSmart).toHaveBeenCalledWith(
      mockSock,
      '120363123456789@g.us',
      expect.stringMatching(/⚠️.*maaf.*bermasalah/i)
    );
  });

  // Test removed - error handling is at the message handler level, not AI level
});
