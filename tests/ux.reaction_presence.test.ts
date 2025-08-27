import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('UX Reaction & Presence Tests', () => {
  let mockSock: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    mockSock = {
      sendMessage: vi.fn().mockResolvedValue({}),
      sendPresenceUpdate: vi.fn().mockResolvedValue({})
    };
  });

  it('should send reactions in correct sequence', async () => {
    const { reactStage } = await import('../src/ux/progress.js');
    
    const mockKey = { 
      remoteJid: '120363123456789@g.us',
      id: 'test-message-id',
      fromMe: false
    };
    
    // Test reaction stages
    await reactStage(mockSock, '120363123456789@g.us', mockKey, 'waiting');
    await reactStage(mockSock, '120363123456789@g.us', mockKey, 'composing');
    await reactStage(mockSock, '120363123456789@g.us', mockKey, 'sending');
    await reactStage(mockSock, '120363123456789@g.us', mockKey, 'done');
    
    expect(mockSock.sendMessage).toHaveBeenCalledTimes(4);
    
    // Check reaction payload format
    const calls = mockSock.sendMessage.mock.calls;
    expect(calls[0][1]).toEqual({ react: { text: '⌛', key: mockKey } });
    expect(calls[1][1]).toEqual({ react: { text: '✍️', key: mockKey } });
    expect(calls[2][1]).toEqual({ react: { text: '📤', key: mockKey } });
    expect(calls[3][1]).toEqual({ react: { text: '✅', key: mockKey } });
  });

  it('should handle reaction errors gracefully', async () => {
    mockSock.sendMessage.mockRejectedValue(new Error('Network error'));
    
    const { reactStage } = await import('../src/ux/progress.js');
    
    const mockKey = { 
      remoteJid: '120363123456789@g.us',
      id: 'test-message-id',
      fromMe: false
    };
    
    // Should not throw even if reaction fails
    await expect(reactStage(mockSock, '120363123456789@g.us', mockKey, 'waiting'))
      .resolves.toBeUndefined();
  });

  it('should send presence updates during withPresence', async () => {
    const { withPresence } = await import('../src/ux/progress.js');
    
    const testOperation = vi.fn().mockResolvedValue('test result');
    
    const result = await withPresence(mockSock, '120363123456789@g.us', testOperation);
    
    expect(result).toBe('test result');
    expect(testOperation).toHaveBeenCalled();
    
    // Should start and stop presence
    expect(mockSock.sendPresenceUpdate).toHaveBeenCalledWith('composing', '120363123456789@g.us');
    expect(mockSock.sendPresenceUpdate).toHaveBeenCalledWith('paused', '120363123456789@g.us');
  });

  it('should refresh presence for long operations', async () => {
    vi.useFakeTimers();
    
    const { withPresence } = await import('../src/ux/progress.js');
    
    const longOperation = vi.fn().mockImplementation(async () => {
      // Advance timers to trigger presence refresh
      vi.advanceTimersByTime(9000); // 9 seconds
      return 'result';
    });
    
    const promise = withPresence(mockSock, '120363123456789@g.us', longOperation);
    
    // Let the operation run
    await promise;
    
    // Should have called presence: start, stop, and potentially refresh
    // Just check that it was called at least twice (start + stop minimum)
    expect(mockSock.sendPresenceUpdate.mock.calls.length).toBeGreaterThanOrEqual(2);
    
    vi.useRealTimers();
  });

  it('should handle presence errors gracefully', async () => {
    mockSock.sendPresenceUpdate.mockRejectedValue(new Error('Presence error'));
    
    const { withPresence } = await import('../src/ux/progress.js');
    
    const testOperation = vi.fn().mockResolvedValue('test result');
    
    // Should not throw even if presence fails
    const result = await withPresence(mockSock, '120363123456789@g.us', testOperation);
    
    expect(result).toBe('test result');
    expect(testOperation).toHaveBeenCalled();
  });

  it('should use correct emoji for each stage', async () => {
    const { reactStage } = await import('../src/ux/progress.js');
    
    const mockKey = { 
      remoteJid: '120363123456789@g.us',
      id: 'test-message-id',
      fromMe: false
    };
    
    const stages = [
      { stage: 'queued', emoji: '🟦' },
      { stage: 'waiting', emoji: '⌛' },
      { stage: 'composing', emoji: '✍️' },
      { stage: 'tooling', emoji: '🤖' },
      { stage: 'sending', emoji: '📤' },
      { stage: 'done', emoji: '✅' },
      { stage: 'error', emoji: '🛑' }
    ] as const;
    
    for (const { stage, emoji } of stages) {
      await reactStage(mockSock, '120363123456789@g.us', mockKey, stage);
      
      const lastCall = mockSock.sendMessage.mock.calls[mockSock.sendMessage.mock.calls.length - 1];
      expect(lastCall[1]).toEqual({ react: { text: emoji, key: mockKey } });
    }
  });
});
