// capture.ts - Screen capture functionality

import { ScreenRect } from "./types.ts";

/**
 * Captures a screenshot of a rectangular area of the screen
 * @param outputPath Path where the screenshot should be saved
 * @param rect Rectangle coordinates to capture
 * @returns True if capture was successful, false otherwise
 */
export async function captureScreen(outputPath: string, rect: ScreenRect): Promise<boolean> {
  try {
    
    // Format the rectangle coordinates
    const rectStr = `${rect.x},${rect.y},${rect.width},${rect.height}`;
    
    // Capture the screen with the specified rectangle
    const command = new Deno.Command("screencapture", {
      args: ["-x", "-R", rectStr, outputPath],
      stdout: "piped",
      stderr: "piped",
    });
    
    const output = await command.output();
    
    if (!output.success) {
      throw new Error("Screen capture failed");
    }
    
    // Verify the file exists and has content
    try {
      const fileInfo = await Deno.stat(outputPath);
      if (fileInfo.size === 0) {
        throw new Error("Screenshot file is empty");
      }
      return true;
    } catch (err) {
      console.error(`Screenshot file verification error: ${err.message}`);
      return false;
    }
  } catch (error) {
    console.error(`Screen capture error: ${error.message}`);
    return false;
  }
}

/**
 * Copies a file to the specified destination
 * @param sourcePath Source file path
 * @param destPath Destination file path
 * @returns True if copy was successful, false otherwise
 */
export async function copyFile(sourcePath: string, destPath: string): Promise<boolean> {
  try {
    await Deno.copyFile(sourcePath, destPath);
    return true;
  } catch (error) {
    console.error(`File copy error: ${error.message}`);
    return false;
  }
}