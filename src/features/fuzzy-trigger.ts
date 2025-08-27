export function fuzzyTrigger(text: string): boolean {
  const triggers = process.env.BOT_TRIGGERS?.split(',') || ['zen', 'aizen', 'zennn', 'zeen', 'zzzznnn'];
  const lowerText = text.toLowerCase();
  
  // Check for exact matches first
  for (const trigger of triggers) {
    if (lowerText.includes(trigger.toLowerCase())) {
      return true;
    }
  }
  
  // Check for fuzzy matches with regex
  const fuzzyPattern = /\b(z+e+n+|aizen|ze+n{1,}|z{3,}n{2,})\b/i;
  return fuzzyPattern.test(text);
}

export function extractTrigger(text: string): string | null {
  const triggers = process.env.BOT_TRIGGERS?.split(',') || ['zen', 'aizen', 'zennn', 'zeen', 'zzzznnn'];
  const lowerText = text.toLowerCase();
  
  for (const trigger of triggers) {
    if (lowerText.includes(trigger.toLowerCase())) {
      return trigger;
    }
  }
  
  const fuzzyPattern = /\b(z+e+n+|aizen|ze+n{1,}|z{3,}n{2,})\b/i;
  const match = text.match(fuzzyPattern);
  return match ? match[0] : null;
}

export function cleanTriggerFromText(text: string): string {
  const trigger = extractTrigger(text);
  if (trigger) {
    return text.replace(new RegExp(trigger, 'gi'), '').trim();
  }
  return text;
}
