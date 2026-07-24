/** Small, dependency-free form validation helpers. */

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
export const isFilled = (v: string) => v.trim().length > 0;
export const minLen = (v: string, n: number) => v.trim().length >= n;

export type Errors<T extends string> = Partial<Record<T, string>>;

/** Returns the first failing rule's message, or undefined if valid. */
export function firstError(rules: Array<[boolean, string]>): string | undefined {
  for (const [ok, message] of rules) if (!ok) return message;
  return undefined;
}
