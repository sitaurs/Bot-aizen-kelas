/**
 * Tool declaration validation utility
 * Memastikan tidak ada duplikasi nama tools di function declarations
 */

import { logger } from '../utils/logger.js';

export function assertUniqueTools(functionDeclarations: Array<{ name: string }>): void {
  const names = functionDeclarations.map(decl => decl.name);
  const uniqueNames = new Set(names);
  
  if (names.length !== uniqueNames.size) {
    const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
    const uniqueDuplicates = Array.from(new Set(duplicates));
    
    logger.error({ 
      duplicates: uniqueDuplicates,
      totalDeclarations: names.length,
      uniqueDeclarations: uniqueNames.size
    }, 'Duplicate tool names detected in function declarations');
    
    throw new Error(`Duplicate tool names found: ${uniqueDuplicates.join(', ')}`);
  }
  
  logger.info({ 
    totalTools: names.length,
    tools: names 
  }, 'All tool names are unique');
}

export function validateToolRouting(toolName: string, availableHandlers: string[]): void {
  if (!availableHandlers.includes(toolName)) {
    throw new Error(`Tool '${toolName}' declared but no handler found. Available: ${availableHandlers.join(', ')}`);
  }
}
