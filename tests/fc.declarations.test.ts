/**
 * Test Suite: Function Declarations Consistency
 */

import { describe, it, expect } from 'vitest';
import { tools } from '../src/ai/tools.js';
import { reminderToolDecls } from '../src/ai/tools.reminder.js';

describe('Function Declarations Consistency', () => {
  it('should have unique tool names across all declarations', () => {
    const allNames = tools.map(tool => tool.name);
    const uniqueNames = new Set(allNames);
    
    expect(allNames.length).toBe(uniqueNames.size);
    
    // If this fails, log the duplicates
    if (allNames.length !== uniqueNames.size) {
      const duplicates = allNames.filter((name, index) => allNames.indexOf(name) !== index);
      console.error('Duplicate tool names:', Array.from(new Set(duplicates)));
    }
  });

  it('should include reminder tool declarations', () => {
    const toolNames = tools.map(tool => tool.name);
    const reminderNames = reminderToolDecls.map(decl => decl.name);
    
    reminderNames.forEach(name => {
      expect(toolNames).toContain(name);
    });
  });

  it('should have deleteReminder only once', () => {
    const deleteReminderDeclarations = tools.filter(tool => tool.name === 'deleteReminder');
    expect(deleteReminderDeclarations).toHaveLength(1);
  });

  it('should have all expected reminder tools', () => {
    const toolNames = tools.map(tool => tool.name);
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

  it('should have consistent parameter structures', () => {
    tools.forEach(tool => {
      expect(tool).toHaveProperty('name');
      expect(typeof tool.name).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);
      
      if (tool.description) {
        expect(typeof tool.description).toBe('string');
      }
      
      if (tool.parameters) {
        expect(tool.parameters).toHaveProperty('type');
        expect(tool.parameters.type).toBe('object');
      }
    });
  });

  it('should not have any undefined or null tool names', () => {
    tools.forEach((tool, index) => {
      expect(tool.name, `Tool at index ${index} has invalid name`).toBeDefined();
      expect(tool.name, `Tool at index ${index} has null name`).not.toBeNull();
      expect(tool.name, `Tool at index ${index} has empty name`).not.toBe('');
    });
  });
});

describe('Tool Routing Validation', () => {
  it('should route deleteReminder to reminder handler', async () => {
    // This test validates that deleteReminder goes through the unified URE handler
    const { handleToolCall } = await import('../src/ai/tools.js');
    
    try {
      // Mock call - should not throw "Unknown function" error
      const result = await handleToolCall({
        name: 'deleteReminder',
        args: { 
          id: 'non-existent-test-id',
          _requesterJid: 'test@s.whatsapp.net',
          _chatJid: 'test@s.whatsapp.net'
        }
      });
      
      // Should return a result structure (even if deletion fails)
      expect(result).toBeDefined();
      
    } catch (error) {
      // Should not be "Unknown function" error
      expect((error as Error).message).not.toContain('Unknown function');
    }
  });

  it('should handle all reminder tools without unknown function errors', async () => {
    const { handleToolCall } = await import('../src/ai/tools.js');
    const reminderTools = ['createUniversalReminder', 'updateUniversalReminder', 'pauseReminder', 'resumeReminder', 'deleteReminder', 'listReminders', 'snoozeReminder'];
    
    for (const toolName of reminderTools) {
      try {
        await handleToolCall({
          name: toolName,
          args: {
            _requesterJid: 'test@s.whatsapp.net',
            _chatJid: 'test@s.whatsapp.net',
            // Minimal args to avoid parameter validation errors
            ...(toolName === 'createUniversalReminder' && { text: 'test' }),
            ...(toolName.includes('Reminder') && toolName !== 'createUniversalReminder' && { id: 'test-id' }),
            ...(toolName === 'snoozeReminder' && { minutes: 15 })
          }
        });
      } catch (error) {
        // Should not be "Unknown function" error
        expect((error as Error).message).not.toContain('Unknown function');
        expect((error as Error).message).not.toContain(`Unknown function: ${toolName}`);
      }
    }
  });
});
