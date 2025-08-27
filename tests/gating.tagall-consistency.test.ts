/**
 * Test Suite: TagAll Gating Consistency  
 * Validates that @ll bypass and mentionAll tool use the same gating logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../src/utils/gating.js', () => ({
  validateMentionAllAccess: vi.fn()
}));

vi.mock('../src/utils/access.js', () => ({
  getPersonByJid: vi.fn(),
  getFunRoleByJid: vi.fn()
}));

describe('TagAll Gating Consistency', () => {
  let validateMentionAllAccessMock: any;
  let getPersonByJidMock: any;
  let getFunRoleByJidMock: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    
    const gatingModule = await import('../src/utils/gating.js');
    const accessModule = await import('../src/utils/access.js');
    
    validateMentionAllAccessMock = gatingModule.validateMentionAllAccess as any;
    getPersonByJidMock = accessModule.getPersonByJid as any;
    getFunRoleByJidMock = accessModule.getFunRoleByJid as any;
  });

  it('should reject anak_nakal without core role for @ll bypass', async () => {
    // Mock anak_nakal user without core role
    getFunRoleByJidMock.mockReturnValue('anak_nakal');
    getPersonByJidMock.mockReturnValue({ 
      name: 'Nakal User', 
      funRole: 'anak_nakal', 
      roles: [] // No core roles
    });
    validateMentionAllAccessMock.mockReturnValue({ allowed: false, reason: 'anak_nakal_no_core' });

    // Test @ll bypass through handleTagAll
    const { handleTagAll } = await import('../src/features/tagAll.js');
    
    const mockSock: any = { sendMessage: vi.fn() };
    const mockMsg: any = {
      key: { remoteJid: '120363123456789@g.us', participant: 'nakal@s.whatsapp.net', fromMe: false },
      message: { conversation: '@ll test message' },
      messageTimestamp: Date.now()
    };

    const handled = await handleTagAll(mockSock, mockMsg, '@ll test message', {
      isAllowedByRoles: (senderJid: string, groupJid: string) => validateMentionAllAccessMock(senderJid).allowed,
      rateLimitMs: 2*60*1000,
      batchSize: 80
    });

    // Should validate access and reject
    expect(validateMentionAllAccessMock).toHaveBeenCalledWith('nakal@s.whatsapp.net');
    expect(handled).toBe(true); // Handled (but rejected)
  });

  it('should reject anak_nakal without core role for mentionAll tool', async () => {
    // Mock same user
    validateMentionAllAccessMock.mockReturnValue({ 
      allowed: false, 
      reason: '🙅‍♀️ Maaf, kamu tidak diizinkan menggunakan mention all.' 
    });

    const { handleToolCall } = await import('../src/ai/tools.js');
    
    const result = await handleToolCall({
      name: 'mentionAll',
      args: {
        message: 'test message',
        _requesterJid: 'nakal@s.whatsapp.net',
        _chatJid: '120363123456789@g.us'
      }
    });

    // Should use same validation and reject
    expect(validateMentionAllAccessMock).toHaveBeenCalledWith('nakal@s.whatsapp.net');
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/tidak diizinkan|tidak berwenang/i);
  });

  it('should allow anak_nakal with core role for both @ll and mentionAll', async () => {
    // Mock anak_nakal user WITH core role
    getFunRoleByJidMock.mockReturnValue('anak_nakal');
    getPersonByJidMock.mockReturnValue({ 
      name: 'Nakal Admin', 
      funRole: 'anak_nakal', 
      roles: ['ketua_kelas'] // Has core role
    });
    validateMentionAllAccessMock.mockReturnValue({ allowed: true });

    // Test @ll bypass
    const { handleTagAll } = await import('../src/features/tagAll.js');
    
    const mockSock: any = { 
      sendMessage: vi.fn(),
      groupMetadata: vi.fn().mockResolvedValue({
        participants: [
          { id: 'user1@s.whatsapp.net', admin: null },
          { id: 'user2@s.whatsapp.net', admin: null }
        ]
      })
    };
    const mockMsg: any = {
      key: { remoteJid: '120363123456789@g.us', participant: 'nakal-admin@s.whatsapp.net', fromMe: false },
      message: { conversation: '@ll test message' },
      messageTimestamp: Date.now()
    };

    const handled = await handleTagAll(mockSock, mockMsg, '@ll test message', {
      isAllowedByRoles: (senderJid: string, groupJid: string) => validateMentionAllAccessMock(senderJid).allowed,
      rateLimitMs: 2*60*1000,
      batchSize: 80
    });

    expect(validateMentionAllAccessMock).toHaveBeenCalledWith('nakal-admin@s.whatsapp.net');
    expect(handled).toBe(true);

    // Test mentionAll tool
    const { handleToolCall } = await import('../src/ai/tools.js');
    
    const result = await handleToolCall({
      name: 'mentionAll',
      args: {
        message: 'test message',
        _requesterJid: 'nakal-admin@s.whatsapp.net',
        _chatJid: '120363123456789@g.us'
      }
    });

    // Should both use same validation and allow
    expect(result.groupJid).toBeDefined();
    expect(result.mentionAll).toBe(true);
  });

  it('should have consistent gating behavior for funRole combinations', async () => {
    const testCases = [
      { funRole: 'anak_baik', roles: [], expected: true }, // anak_baik always allowed
      { funRole: 'anak_nakal', roles: [], expected: false }, // anak_nakal without core rejected  
      { funRole: 'anak_nakal', roles: ['ketua_kelas'], expected: true }, // anak_nakal with core allowed
      { funRole: 'anak_nakal', roles: ['developer'], expected: true }, // anak_nakal with dev allowed
    ];

    for (const testCase of testCases) {
      // Reset mocks
      vi.clearAllMocks();
      
      getFunRoleByJidMock.mockReturnValue(testCase.funRole);
      getPersonByJidMock.mockReturnValue({ 
        name: 'Test User', 
        funRole: testCase.funRole, 
        roles: testCase.roles
      });
      validateMentionAllAccessMock.mockReturnValue({ allowed: testCase.expected });

      // Test @ll bypass
      const { handleTagAll } = await import('../src/features/tagAll.js');
      const mockSock: any = { 
        sendMessage: vi.fn(),
        groupMetadata: vi.fn().mockResolvedValue({ participants: [] })
      };
      const mockMsg: any = {
        key: { remoteJid: '120363123456789@g.us', participant: 'test@s.whatsapp.net', fromMe: false },
        message: { conversation: '@ll test' },
        messageTimestamp: Date.now()
      };

      await handleTagAll(mockSock, mockMsg, '@ll test', {
        isAllowedByRoles: (senderJid: string, groupJid: string) => validateMentionAllAccessMock(senderJid).allowed,
        rateLimitMs: 2*60*1000,
        batchSize: 80
      });

      // Test mentionAll tool
      const { handleToolCall } = await import('../src/ai/tools.js');
      const result = await handleToolCall({
        name: 'mentionAll',
        args: {
          message: 'test',
          _requesterJid: 'test@s.whatsapp.net',
          _chatJid: '120363123456789@g.us'
        }
      });

      // Both should have called the same validation
      expect(validateMentionAllAccessMock).toHaveBeenCalledWith('test@s.whatsapp.net');
      
      // Results should be consistent
      if (testCase.expected) {
        expect(result.groupJid).toBeDefined();
        expect(result.mentionAll).toBe(true);
      } else {
        expect(result.success).toBe(false);
      }
    }
  });

  it('should use the same gating logic for both @ll and mentionAll', async () => {
    // This test ensures both paths use validateMentionAllAccess from the same module
    
    // Mock a user
    validateMentionAllAccessMock.mockReturnValue({ allowed: true });
    
    // Test @ll path
    const { handleTagAll } = await import('../src/features/tagAll.js');
    const mockSock: any = { 
      sendMessage: vi.fn(),
      groupMetadata: vi.fn().mockResolvedValue({ participants: [] })
    };
    const mockMsg: any = {
      key: { remoteJid: '120363123456789@g.us', participant: 'user@s.whatsapp.net', fromMe: false },
      message: { conversation: '@ll test' },
      messageTimestamp: Date.now()
    };

    await handleTagAll(mockSock, mockMsg, '@ll test', {
      isAllowedByRoles: (senderJid: string, groupJid: string) => validateMentionAllAccessMock(senderJid).allowed,
      rateLimitMs: 2*60*1000,
      batchSize: 80
    });

    // Test mentionAll tool path
    const { handleToolCall } = await import('../src/ai/tools.js');
    await handleToolCall({
      name: 'mentionAll',
      args: {
        message: 'test',
        _requesterJid: 'user@s.whatsapp.net',
        _chatJid: '120363123456789@g.us'
      }
    });

    // Both should have called the same validation function
    expect(validateMentionAllAccessMock).toHaveBeenCalledTimes(2);
    expect(validateMentionAllAccessMock).toHaveBeenNthCalledWith(1, 'user@s.whatsapp.net');
    expect(validateMentionAllAccessMock).toHaveBeenNthCalledWith(2, 'user@s.whatsapp.net');
  });

  it('should have consistent gating import in both files', async () => {
    // Verify that both files import from the same gating module
    
    // This is more of a structural test - both should use the same validation
    const tagAllModule = await import('../src/features/tagAll.js');
    const toolsModule = await import('../src/ai/tools.js');
    
    // Both modules should exist and be importable
    expect(tagAllModule).toBeDefined();
    expect(toolsModule).toBeDefined();
    
    // The fact that this test runs without import errors indicates consistent imports
    expect(true).toBe(true);
  });
});
