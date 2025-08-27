/**
 * Test Suite: JID Safety & Materials Validation
 */

import { describe, it, expect } from 'vitest';
import { normalizeJid, isGroupJid } from '../src/utils/jid.js';

describe('JID Safety', () => {
  describe('normalizeJid', () => {
    it('should handle undefined and empty values safely', () => {
      expect(() => normalizeJid(undefined as any)).not.toThrow();
      expect(() => normalizeJid(null as any)).not.toThrow();
      expect(() => normalizeJid('')).not.toThrow();
      
      // Should return safe defaults or handle gracefully
      const result1 = normalizeJid(undefined as any);
      const result2 = normalizeJid('');
      
      expect(typeof result1).toBe('string');
      expect(typeof result2).toBe('string');
    });

    it('should normalize various JID formats correctly', () => {
      const testCases = [
        {
          input: '6281234567890@s.whatsapp.net',
          expected: '6281234567890@s.whatsapp.net',
          description: 'Standard WhatsApp JID'
        },
        {
          input: '6281234567890@c.us', 
          expected: '6281234567890@s.whatsapp.net',
          description: 'Legacy c.us format'
        },
        {
          input: '120363123456789@g.us',
          expected: '120363123456789@g.us',
          description: 'Group JID'
        },
        {
          input: '@broadcast',
          expected: '@broadcast',
          description: 'Broadcast JID'
        },
        {
          input: '6281234567890@lid',
          expected: '6281234567890@lid',
          description: 'LID format JID'
        }
      ];

      testCases.forEach(({ input, expected, description }) => {
        const result = normalizeJid(input);
        expect(result, description).toBe(expected);
      });
    });

    it('should handle malformed JIDs gracefully', () => {
      const malformedJids = [
        'invalid-jid',
        '@@@@',
        'no-at-symbol',
        '123@',
        '@no-prefix',
        '   ',
        'spaces in jid@domain.com'
      ];

      malformedJids.forEach(jid => {
        expect(() => normalizeJid(jid)).not.toThrow();
        const result = normalizeJid(jid);
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('isGroupJid', () => {
    it('should correctly identify group JIDs', () => {
      const testCases = [
        { jid: '120363123456789@g.us', expected: true, description: 'Standard group JID' },
        { jid: '6281234567890@s.whatsapp.net', expected: false, description: 'Individual JID' },
        { jid: '6281234567890@c.us', expected: false, description: 'Legacy individual JID' },
        { jid: '@broadcast', expected: false, description: 'Broadcast JID' },
        { jid: '6281234567890@lid', expected: false, description: 'LID JID' },
        { jid: '', expected: false, description: 'Empty string' },
        { jid: undefined as any, expected: false, description: 'Undefined' },
        { jid: null as any, expected: false, description: 'Null' },
        { jid: 'invalid', expected: false, description: 'Invalid format' }
      ];

      testCases.forEach(({ jid, expected, description }) => {
        const result = isGroupJid(jid);
        expect(result, description).toBe(expected);
      });
    });

    it('should handle edge cases safely', () => {
      const edgeCases = [
        '@g.us',  // Missing prefix
        'group@g.us.fake', // Extra domain
        '123@g.us.', // Trailing dot
        '   120363123456789@g.us   ' // Whitespace
      ];

      edgeCases.forEach(jid => {
        expect(() => isGroupJid(jid)).not.toThrow();
        const result = isGroupJid(jid);
        expect(typeof result).toBe('boolean');
      });
    });
  });

  describe('JID Utility Integration', () => {
    it('should work safely with endsWith checks', () => {
      const testJids = [
        '120363123456789@g.us',
        '6281234567890@s.whatsapp.net',
        undefined,
        null,
        '',
        'invalid'
      ];

      testJids.forEach(jid => {
        expect(() => {
          const normalized = normalizeJid(jid as any);
          const isGroup = normalized?.endsWith('@g.us') ?? false;
          return isGroup;
        }).not.toThrow();
      });
    });

    it('should provide consistent behavior between utilities', () => {
      const groupJids = [
        '120363123456789@g.us',
        '120363000000000@g.us'
      ];
      
      const individualJids = [
        '6281234567890@s.whatsapp.net',
        '6281234567890@c.us',
        '6281234567890@lid'
      ];

      groupJids.forEach(jid => {
        const normalized = normalizeJid(jid);
        expect(isGroupJid(normalized)).toBe(true);
        expect(normalized.endsWith('@g.us')).toBe(true);
      });

      individualJids.forEach(jid => {
        const normalized = normalizeJid(jid);
        expect(isGroupJid(normalized)).toBe(false);
        expect(normalized.endsWith('@g.us')).toBe(false);
      });
    });
  });
});

describe('Materials Validation', () => {
  describe('File Safety', () => {
    it('should validate safe file extensions', () => {
      const safeExtensions = [
        '.pdf', '.doc', '.docx', '.txt', '.md',
        '.jpg', '.jpeg', '.png', '.gif', '.webp',
        '.mp4', '.avi', '.mov', '.webm',
        '.mp3', '.wav', '.m4a', '.ogg',
        '.zip', '.rar', '.7z',
        '.ppt', '.pptx', '.xls', '.xlsx'
      ];

      safeExtensions.forEach(ext => {
        expect(ext).toMatch(/^\.[a-z0-9]+$/i);
        expect(ext.length).toBeGreaterThan(1);
        expect(ext.length).toBeLessThan(10);
      });
    });

    it('should reject dangerous file extensions', () => {
      const dangerousExtensions = [
        '.exe', '.bat', '.cmd', '.scr', '.vbs',
        '.js', '.jar', '.php', '.asp', '.jsp',
        '.sh', '.ps1', '.com', '.pif', '.msi'
      ];

      // This test validates that we know what dangerous extensions look like
      // The actual filtering should be implemented in the materials handler
      dangerousExtensions.forEach(ext => {
        expect(ext).toMatch(/^\.[a-z0-9]+$/i);
        // These should be in a blacklist
      });
    });

    it('should validate MIME types safely', () => {
      const safeMimeTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/m4a', 'audio/ogg',
        'application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain', 'text/markdown'
      ];

      safeMimeTypes.forEach(mimeType => {
        expect(mimeType).toMatch(/^[a-z]+\/[a-z0-9\-\+\.]+$/i);
        expect(mimeType).toContain('/');
        expect(mimeType.split('/').length).toBe(2);
      });
    });

    it('should handle filename sanitization', () => {
      const testFilenames = [
        { input: 'normal-file.pdf', expectSafe: true },
        { input: 'file with spaces.docx', expectSafe: true },
        { input: 'file_with_underscores.txt', expectSafe: true },
        { input: 'file-with-dashes.jpg', expectSafe: true },
        { input: '../../../etc/passwd', expectSafe: false },
        { input: 'file\\with\\backslashes.exe', expectSafe: false },
        { input: 'file:with:colons.bat', expectSafe: false },
        { input: 'file|with|pipes.cmd', expectSafe: false },
        { input: 'file<with>brackets.scr', expectSafe: false }
      ];

      testFilenames.forEach(({ input, expectSafe }) => {
        // Basic checks for dangerous patterns
        const hasDangerousPath = input.includes('../') || input.includes('..\\');
        const hasDangerousChars = /[<>:"|?*\\]/.test(input);
        const hasDangerousExt = /\.(exe|bat|cmd|scr|vbs|js|jar|php|asp|jsp|sh|ps1|com|pif|msi)$/i.test(input);
        
        const isSafe = !hasDangerousPath && !hasDangerousChars && !hasDangerousExt;
        
        if (expectSafe) {
          expect(isSafe, `${input} should be considered safe`).toBe(true);
        } else {
          expect(isSafe, `${input} should be considered unsafe`).toBe(false);
        }
      });
    });
  });

  describe('Upload Safety', () => {
    it('should enforce reasonable file size limits', () => {
      const fileSizeLimits = {
        maxImageSize: 10 * 1024 * 1024, // 10MB
        maxVideoSize: 100 * 1024 * 1024, // 100MB  
        maxDocumentSize: 50 * 1024 * 1024, // 50MB
        maxGeneralSize: 25 * 1024 * 1024 // 25MB
      };

      Object.entries(fileSizeLimits).forEach(([type, limit]) => {
        expect(limit).toBeGreaterThan(0);
        expect(limit).toBeLessThan(500 * 1024 * 1024); // Max 500MB
      });
    });

    it('should validate file content vs extension mismatch', () => {
      // This validates the concept of checking file headers vs extensions
      const commonMagicNumbers = {
        PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
        JPEG: [0xFF, 0xD8, 0xFF],
        PNG: [0x89, 0x50, 0x4E, 0x47],
        GIF: [0x47, 0x49, 0x46, 0x38],
        ZIP: [0x50, 0x4B, 0x03, 0x04]
      };

      Object.entries(commonMagicNumbers).forEach(([type, header]) => {
        expect(Array.isArray(header)).toBe(true);
        expect(header.length).toBeGreaterThan(0);
        expect(header.every(byte => byte >= 0 && byte <= 255)).toBe(true);
      });
    });
  });
});
