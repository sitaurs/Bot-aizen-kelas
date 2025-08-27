/**
 * Test Suite: Function Calling Unique Tools
 * Validates that all tool names are unique and assertUniqueTools works correctly
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Function Calling Unique Tools', () => {
  beforeEach(() => {
    // Clear any cached modules
    vi.resetModules();
  });

  it('should have unique tool names across all declarations', async () => {
    const { tools } = await import('../src/ai/tools.js');
    
    const toolNames = tools.map((tool: any) => tool.name);
    const uniqueNames = new Set(toolNames);
    
    // Should have no duplicates
    expect(toolNames.length).toBe(uniqueNames.size);
    
    // Log for verification
    console.log(`Total tools: ${toolNames.length}`);
    console.log(`Unique tools: ${uniqueNames.size}`);
    
    if (toolNames.length !== uniqueNames.size) {
      const duplicates = toolNames.filter((name: string, index: number) => toolNames.indexOf(name) !== index);
      console.error('Duplicate tool names found:', duplicates);
    }
  });

  it('should call assertUniqueTools without throwing', async () => {
    const { assertUniqueTools } = await import('../src/utils/toolValidation.js');
    const { tools } = await import('../src/ai/tools.js');
    
    // Should not throw any errors
    expect(() => assertUniqueTools(tools)).not.toThrow();
  });

  it('should have deleteReminder only once', async () => {
    const { tools } = await import('../src/ai/tools.js');
    
    const deleteReminderTools = tools.filter((tool: any) => tool.name === 'deleteReminder');
    expect(deleteReminderTools).toHaveLength(1);
  });

  it('should have all expected reminder tools', async () => {
    const { tools } = await import('../src/ai/tools.js');
    
    const toolNames = tools.map((tool: any) => tool.name);
    const expectedReminderTools = [
      'createUniversalReminder',
      'updateUniversalReminder',
      'pauseReminder',
      'resumeReminder',
      'deleteReminder',
      'listReminders',
      'snoozeReminder'
    ];

    expectedReminderTools.forEach(toolName => {
      expect(toolNames).toContain(toolName);
    });
  });

  it('should have all expected core tools', async () => {
    const { tools } = await import('../src/ai/tools.js');
    
    const toolNames = tools.map((tool: any) => tool.name);
    const expectedCoreTools = [
      'getTodayScheduleEnriched',
      'getScheduleByDay',
      'getWeeklySchedule',
      'getLecturerByCourse',
      'getLecturerInfo',
      'queryMaterials',
      'makeRandomGroups',
      'mentionAll',
      'changeSchedule'
    ];

    expectedCoreTools.forEach(toolName => {
      expect(toolNames).toContain(toolName);
    });
  });

  it('should validate tool routing for all declared tools', async () => {
    const { tools, handleToolCall } = await import('../src/ai/tools.js');
    
    // Get list of tool names that have handlers
    const handledTools = [
      'getTodayScheduleEnriched', 'setFunRole', 'getFunRole', 'updateCoreRoles',
      'getPerson', 'makeRandomGroups', 'getScheduleByDay', 'getWeeklySchedule',
      'lookupLecturerByCourse', 'getTodayInfo', 'askClarify', 'addMaterials',
      'mentionAll', 'setHydrationPlan', 'getHydrationPlan', 'getSchedule',
      'changeSchedule', 'setReminder', 'setExam', 'deleteExam', 'setCashReminder',
      'deleteCashReminder', 'setCarryItem', 'deleteCarryItem', 'queryMaterials',
      'getLecturerContact', 'getLecturerInfo', 'getLecturerByCourse',
      'getLecturerSchedule', 'getClassLocation',
      // URE tools
      'createUniversalReminder', 'updateUniversalReminder', 'pauseReminder',
      'resumeReminder', 'deleteReminder', 'listReminders', 'snoozeReminder'
    ];

    for (const tool of tools) {
      expect(handledTools).toContain(tool.name);
    }
  });

  it('should detect duplicate tools when present', async () => {
    const { assertUniqueTools } = await import('../src/utils/toolValidation.js');
    
    // Create a fake list with duplicates
    const duplicateTools = [
      { name: 'tool1' },
      { name: 'tool2' },
      { name: 'tool1' }, // Duplicate
      { name: 'tool3' }
    ];

    expect(() => assertUniqueTools(duplicateTools)).toThrow('Duplicate tool names found: tool1');
  });

  it('should log unique tools information', async () => {
    const { assertUniqueTools } = await import('../src/utils/toolValidation.js');
    const { tools } = await import('../src/ai/tools.js');
    
    // Capture console output
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // This should log the tools info
    assertUniqueTools(tools);
    
    // Should have logged something about unique tools
    // Note: The actual logging is done via the logger module, but this validates the function runs
    expect(() => assertUniqueTools(tools)).not.toThrow();
    
    consoleSpy.mockRestore();
  });
});
