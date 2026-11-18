export interface EditRequest { type: 'edit'; id: number; version: number; source: string }

export function isEditRequest(value: unknown): value is EditRequest {
  if (!value || typeof value !== 'object') return false;
  const message = value as Record<string, unknown>;
  return message.type === 'edit' && typeof message.source === 'string'
    && typeof message.id === 'number' && Number.isSafeInteger(message.id) && message.id >= 0
    && typeof message.version === 'number' && Number.isSafeInteger(message.version) && message.version >= 1;
}

export function minimalEdit(before: string, after: string): { start: number; end: number; text: string } | undefined {
  if (before === after) return undefined;
  const left = Array.from(before), right = Array.from(after);
  let prefix = 0, oldEnd = left.length, newEnd = right.length;
  while (prefix < oldEnd && prefix < newEnd && left[prefix] === right[prefix]) prefix++;
  while (oldEnd > prefix && newEnd > prefix && left[oldEnd - 1] === right[newEnd - 1]) { oldEnd--; newEnd--; }
  const start = left.slice(0, prefix).join('').length;
  return { start, end: start + left.slice(prefix, oldEnd).join('').length, text: right.slice(prefix, newEnd).join('') };
}
