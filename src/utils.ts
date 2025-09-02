// utils.ts - Utility functions for the Quarto Record Demo

import { ScreenRect } from "./types.ts";


/**
 * Retrieves the last used screen capture selection rectangle from macOS preferences
 * @returns The screen capture rectangle coordinates
 */
export async function getLastSelectionRect(): Promise<ScreenRect> {
  try {
    const command = new Deno.Command("defaults", {
      args: ["read", "com.apple.screencapture", "last-selection"],
      stdout: "piped",
      stderr: "piped",
    });
    
    const { stdout } = await command.output();
    const output = new TextDecoder().decode(stdout).trim();
    
    // Parse the output format: {Height = "1691.75"; Width = 1394; X = 4590; Y = "270.625";}
    const xMatch = output.match(/X\s*=\s*"?([0-9.]+)"?/);
    const yMatch = output.match(/Y\s*=\s*"?([0-9.]+)"?/);
    const widthMatch = output.match(/Width\s*=\s*"?([0-9.]+)"?/);
    const heightMatch = output.match(/Height\s*=\s*"?([0-9.]+)"?/);
    
    if (!xMatch || !yMatch || !widthMatch || !heightMatch) {
      throw new Error("Failed to parse screen capture selection coordinates");
    }
    
    return {
      x: parseFloat(xMatch[1]),
      y: parseFloat(yMatch[1]),
      width: parseFloat(widthMatch[1]),
      height: parseFloat(heightMatch[1]),
    };
  } catch (error) {
    throw new Error(`Failed to get screen capture selection: ${error.message}`);
  }
}

/**
 * Waits for the specified number of milliseconds
 * @param ms Milliseconds to wait
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ensures a directory exists, creating it if necessary
 * @param dir Directory path to ensure
 */
export async function ensureDir(dir: string): Promise<void> {
  try {
    await Deno.mkdir(dir, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}