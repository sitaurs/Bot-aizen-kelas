export function renderWithMentions(text: string, jids: string[]) {
  return { text, contextInfo: { mentionedJid: jids } } as any;
}
