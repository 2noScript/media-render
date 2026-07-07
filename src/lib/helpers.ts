import fs from "fs";

/**
 * Creates a directory synchronously if it does not already exist.
 */
export async function fsMkdir(p: string): Promise<void> {
  fs.mkdirSync(p, { recursive: true });
}

/**
 * Checks if a given path exists on the filesystem.
 */
export function fsExists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}
