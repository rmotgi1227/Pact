export function must<T>(x: T | undefined | null, what: string): T {
  if (x === undefined || x === null) throw new Error(`missing: ${what}`);
  return x;
}
