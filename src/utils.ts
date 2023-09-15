import { statSync } from "node:fs";

export function isDirectorySync(filepath: string) {
  if (typeof filepath !== "string") {
    throw new Error("expected filepath to be a string");
  }
  const stat = statSync(filepath, { throwIfNoEntry: false });
  if (!stat) return false;
  return stat.isDirectory();
}

export function times<T>(count: number, cb: (n: number) => T, indexAt = 0): Array<T> {
  const ret: T[] = [];
  for (let i = indexAt; i < count + indexAt; i++) {
    ret.push(cb(i));
  }
  return ret;
}

export function padEnd(input: string, length: number): string {
  const strLength = length ? input.length : 0;
  return length && strLength < length ? input + times(length - strLength, () => " ") : input || "";
}

export function intersection<T>(a: Array<T>, b: Array<T>): Array<T> {
  const aItems = new Set(a);
  const ret: Array<T> = [];
  for (const item of b) {
    if (aItems.has(item)) {
      ret.push(item);
    }
  }
  return ret;
}
