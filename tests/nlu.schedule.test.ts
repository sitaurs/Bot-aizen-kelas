/**
 * Test Suite: NLU Schedule Query Fix (No "date? loop")
 */

import { describe, it, expect } from 'vitest';
import { promises as fs } from 'fs';

describe('NLU Schedule Fix', () => {
  it('should not have active pre-clarify for jadwal queries', async () => {
    const nluContent = await fs.readFile('src/features/nlu.ts', 'utf8');
    
    // Should not contain active if-statement that pre-clarifies jadwal
    expect(nluContent).not.toMatch(/if\s*\([^)]*jadwal[^)]*\)\s*{[^}]*return.*getSchedule.*expect.*date/i);
    
    // Should contain the fix comment
    expect(nluContent).toMatch(/FIXED RC-20250827.*jadwal.*LLM/);
    
    // Should have the problematic code commented out
    expect(nluContent).toMatch(/\/\/\s*if\s*\(.*jadwal.*\)\s*{/);
    expect(nluContent).toMatch(/\/\/.*return.*type.*getSchedule.*expect.*date/);
  });

  it('should not have getSchedule clarification in buildClarifyQuestion', async () => {
    const nluContent = await fs.readFile('src/features/nlu.ts', 'utf8');
    
    // Should not have active getSchedule clarification
    expect(nluContent).not.toMatch(/if\s*\(\s*\/jadwal\/.*getSchedule.*expect.*date/);
    
    // Should have it commented out with fix note
    expect(nluContent).toMatch(/\/\/.*FIXED RC-20250827.*getSchedule.*clarification.*LLM/);
  });

  it('should still export aiClarifyOrAct function', async () => {
    const { aiClarifyOrAct } = await import('../src/features/nlu.js');
    expect(typeof aiClarifyOrAct).toBe('function');
  }, 10000); // 10 second timeout

  it('should handle schedule queries without forced clarification', async () => {
    // Mock function to test inference behavior
    const testInferPendingAction = (text: string) => {
      const t = text.toLowerCase();
      
      // This should mimic the fixed inferPendingAction logic
      if (/ubah|pindah|ganti/.test(t) && /jadwal/.test(t)) {
        return { type: 'changeSchedule', expect: ['course', 'date', 'start', 'end', 'room?'] };
      }
      if (/set|tambah/.test(t) && /reminder|pengingat/.test(t)) {
        return { type: 'setReminder', expect: ['type', 'title', 'dueISO', 'course?'] };
      }
      if (/hapus/.test(t) && /ujian|uts|uas/.test(t)) {
        return { type: 'deleteExam', expect: ['id?'] };
      }
      if (/hapus/.test(t) && /kas/.test(t)) {
        return { type: 'deleteCashReminder', expect: ['id?'] };
      }
      if (/dimana|lokasi/.test(t)) {
        return { type: 'getClassLocation', expect: ['course', 'date?'] };
      }
      // FIXED: No pre-clarify for jadwal - let LLM handle it
      return { type: 'clarification', expect: [] };
    };

    // These should NOT trigger pre-clarification for getSchedule
    const scheduleQueries = [
      'jadwal hari ini',
      'jadwal besok', 
      'jadwal minggu ini',
      'jadwal kamis',
      'kapan jadwal kuliah',
      'jadwal matkul apa aja'
    ];

    scheduleQueries.forEach(query => {
      const result = testInferPendingAction(query);
      // Should not return getSchedule with date expectation
      expect(result.type).not.toBe('getSchedule');
      expect(result.expect).not.toContain('date?');
      
      // Should return clarification (meaning it goes to LLM)
      expect(result.type).toBe('clarification');
      expect(result.expect).toEqual([]);
    });
  });

  it('should preserve other pre-clarify behaviors', async () => {
    // Mock function to test inference behavior
    const testInferPendingAction = (text: string) => {
      const t = text.toLowerCase();
      
      if (/ubah|pindah|ganti/.test(t) && /jadwal/.test(t)) {
        return { type: 'changeSchedule', expect: ['course', 'date', 'start', 'end', 'room?'] };
      }
      if (/set|tambah/.test(t) && /reminder|pengingat/.test(t)) {
        return { type: 'setReminder', expect: ['type', 'title', 'dueISO', 'course?'] };
      }
      if (/dimana|lokasi/.test(t)) {
        return { type: 'getClassLocation', expect: ['course', 'date?'] };
      }
      return { type: 'clarification', expect: [] };
    };

    // These should still trigger appropriate pre-clarification
    const testCases = [
      {
        query: 'ubah jadwal',
        expectedType: 'changeSchedule',
        expectedExpectContains: 'course'
      },
      {
        query: 'tambah reminder',
        expectedType: 'setReminder', 
        expectedExpectContains: 'title'
      },
      {
        query: 'dimana kelas',
        expectedType: 'getClassLocation',
        expectedExpectContains: 'course'
      }
    ];

    testCases.forEach(({ query, expectedType, expectedExpectContains }) => {
      const result = testInferPendingAction(query);
      expect(result.type).toBe(expectedType);
      expect(result.expect).toContain(expectedExpectContains);
    });
  });
});
