import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('Gemini CRUD Tools Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have unique tool names', async () => {
    const { buildFunctionDeclarations } = await import('../src/ai/tools.js');
    const { assertUniqueTools } = await import('../src/utils/toolValidation.js');
    
    const declarations = buildFunctionDeclarations();
    
    // Should not throw for unique tools
    expect(() => assertUniqueTools(declarations)).not.toThrow();
    
    // Verify each tool has required properties
    for (const tool of declarations) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('parameters');
      expect(typeof tool.name).toBe('string');
      expect(tool.name.length).toBeGreaterThan(0);
    }
  });

  it('should detect duplicate tool names', async () => {
    const { assertUniqueTools } = await import('../src/utils/toolValidation.js');
    
    const duplicateTools = [
      { name: 'test_tool', description: 'Test 1', parameters: {} },
      { name: 'test_tool', description: 'Test 2', parameters: {} },
      { name: 'other_tool', description: 'Other', parameters: {} }
    ];
    
    expect(() => assertUniqueTools(duplicateTools)).toThrow('Duplicate tool names found: test_tool');
  });

  it('should cover CRUD operations', async () => {
    const { buildFunctionDeclarations } = await import('../src/ai/tools.js');
    
    const declarations = buildFunctionDeclarations();
    const toolNames = declarations.map(d => d.name);
    
    // Check for basic CRUD categories
    const hasCrudTools = {
      create: toolNames.some(name => name.includes('create') || name.includes('add') || name.includes('new') || name.includes('set')),
      read: toolNames.some(name => name.includes('read') || name.includes('get') || name.includes('search') || name.includes('list') || name.includes('query')),
      update: toolNames.some(name => name.includes('update') || name.includes('edit') || name.includes('modify') || name.includes('change')),
      delete: toolNames.some(name => name.includes('delete') || name.includes('remove') || name.includes('clear'))
    };
    
    // Should have tools for each CRUD operation
    expect(hasCrudTools.create, 'Missing CREATE tools').toBe(true);
    expect(hasCrudTools.read, 'Missing READ tools').toBe(true);
    expect(hasCrudTools.update, 'Missing UPDATE tools').toBe(true);
    expect(hasCrudTools.delete, 'Missing DELETE tools').toBe(true);
    
    console.log('Available CRUD tools:', {
      total: toolNames.length,
      crud: hasCrudTools,
      sample: toolNames.slice(0, 5)
    });
  });

  it('should maintain consistent tool structure', async () => {
    const { buildFunctionDeclarations } = await import('../src/ai/tools.js');
    
    const declarations = buildFunctionDeclarations();
    
    for (const tool of declarations) {
      // Each tool should have required structure
      expect(tool).toMatchObject({
        name: expect.any(String),
        description: expect.any(String),
        parameters: expect.any(Object)
      });
      
      // Name should be valid identifier
      expect(tool.name).toMatch(/^[a-zA-Z_][a-zA-Z0-9_]*$/);
      
      // Description should be meaningful
      expect(tool.description.length).toBeGreaterThan(10);
      
      // Parameters should have type object
      if (tool.parameters.properties) {
        expect(tool.parameters.type).toBe('object');
      }
    }
  });

  it('should handle tool execution properly', async () => {
    const { handleToolCall } = await import('../src/ai/tools.js');
    
    // Test successful tool call
    const result = await handleToolCall({
      name: 'getTodayInfo',
      args: {}
    });
    
    expect(result).toHaveProperty('date');
    expect(result).toHaveProperty('dayName');
    expect(result).toHaveProperty('timezone');
  });

  it('should handle unknown tool names', async () => {
    const { handleToolCall } = await import('../src/ai/tools.js');
    
    // Test unknown tool
    const result = await handleToolCall({
      name: 'unknownTool',
      args: {}
    });
    
    expect(result).toHaveProperty('error');
    expect(result.error).toContain('Unknown function');
  });

  it('should validate tool parameters', async () => {
    const { buildFunctionDeclarations } = await import('../src/ai/tools.js');
    
    const declarations = buildFunctionDeclarations();
    
    // Find tools with required parameters
    const toolsWithRequired = declarations.filter(tool => 
      tool.parameters && 
      tool.parameters.required && 
      Array.isArray(tool.parameters.required) && 
      tool.parameters.required.length > 0
    );
    
    expect(toolsWithRequired.length).toBeGreaterThan(0);
    
    // Check that required parameters exist in properties
    for (const tool of toolsWithRequired) {
      const required = tool.parameters.required || [];
      const properties = tool.parameters.properties || {};
      
      for (const param of required) {
        expect(properties).toHaveProperty(param);
      }
    }
  });
});
