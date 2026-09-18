// Standalone copies in 正文美化.html and the card's 变量结构.js are checked by regression tests.
export function normalizeStringArray(input: unknown): string[] {
  const result: string[] = [];
  const append = (value: string) => {
    const text = value
      .trim()
      .replace(/^[-•]\s+/, '')
      .replace(/：/g, ':');
    if (text && !result.includes(text)) result.push(text);
  };
  const visit = (value: unknown, split: boolean) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      value.forEach(item => visit(item, false));
      return;
    }
    if (typeof value === 'object') {
      Object.entries(value).forEach(([key, item]) => {
        if (item != null && typeof item !== 'object') append(`${key}:${item}`);
      });
      return;
    }
    let text = String(value).trim();
    if (!text || /^(null|undefined)$/i.test(text)) return;
    const structured = /^[[{［【]/.test(text);
    if (!split && !structured && !/^[-•]\s/.test(text)) {
      append(text);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      if (parsed === null || typeof parsed === 'object') {
        visit(parsed, false);
        return;
      }
      if (typeof parsed === 'string') {
        visit(parsed, false);
        return;
      }
    } catch {
      /* Read legacy brackets, YAML lists, and loosely quoted arrays below. */
    }
    text = text
      .replace(/[［【]/g, '[')
      .replace(/[］】]/g, ']')
      .replace(/(^|\n)\s*[-•]\s+/g, '$1');
    let token = '';
    let quote = '';
    let quoted = false;
    let parentheses = 0;
    const flush = () => {
      const part = token.trim();
      if (quoted || !/^(null|undefined)$/i.test(part)) append(part);
      token = '';
      quoted = false;
    };
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (quote) {
        if (char === '\\' && i + 1 < text.length) token += text[++i];
        else if (char === quote) quote = '';
        else token += char;
        continue;
      }
      if (['"', "'", '“', '‘'].includes(char) && !token.trim()) {
        quote = char === '“' ? '”' : char === '‘' ? '’' : char;
        quoted = true;
      } else if ('(（'.includes(char)) {
        parentheses++;
        token += char;
      } else if (')）'.includes(char)) {
        parentheses = Math.max(0, parentheses - 1);
        token += char;
      } else if (
        !parentheses &&
        (/[[\]{},，、;；|\r\n]/.test(char) ||
          (char === '/' && /\s/.test(text[i - 1] || '') && /\s/.test(text[i + 1] || '')))
      ) {
        flush();
      } else token += char;
    }
    flush();
  };
  visit(input, true);
  return result;
}
