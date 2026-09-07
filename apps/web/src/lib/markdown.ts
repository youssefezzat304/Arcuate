export function escapeMarkdown(value: string) {
  return value.replace(/\r?\n/g, " ").replace(/([\\`*_{}\[\]<>()#+.!|~-])/g, "\\$1");
}

export function readingMarkdown(title: string, paragraphs: string[]) {
  return `# ${escapeMarkdown(title)}\n\n${paragraphs.map(escapeMarkdown).join("\n\n")}\n`;
}
