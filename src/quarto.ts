// quarto.ts - Quarto preview process management

/**
 * Starts a Quarto preview process
 * @param file Optional QMD file to preview
 * @returns Process object for the Quarto preview
 */
export async function startQuartoPreview(file?: string): Promise<Deno.Process> {
  const args = ["preview"];
  
  // Add file if specified
  if (file) {
    args.push(file);
  }
  
  // Start Quarto preview process
  const quartoProcess = new Deno.Command("quarto", {
    args,
    stdout: "piped",
    stderr: "piped",
  });
  
  const process = quartoProcess.spawn();
  
  // Wait a moment to ensure the process started
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return process;
}

/**
 * Stops a Quarto preview process
 * @param process The Quarto preview process to stop
 */
export async function stopQuartoPreview(process: Deno.Process): Promise<void> {
  try {
    // Try to kill the process gracefully
    process.kill("SIGTERM");
    
    // Wait for the process to exit
    await process.status;
  } catch (error) {
    console.error(`Error stopping Quarto preview: ${error.message}`);
    
    // Try to force kill if graceful stop failed
    try {
      process.kill("SIGKILL");
    } catch (e) {
      // Process may already be gone, ignore
    }
  }
}