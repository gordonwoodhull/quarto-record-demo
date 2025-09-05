// quarto.ts - Quarto preview process management

/**
 * Result of starting a Quarto preview process
 */
export interface QuartoPreviewResult {
  /** The process object for the Quarto preview */
  process: Deno.Process;
  
  /** URL where the Quarto preview is being served */
  url: string;
}

/**
 * Starts a Quarto preview process and waits for it to be ready
 * @param file Optional QMD file to preview
 * @param profile Optional profile name to use
 * @returns Promise that resolves with the process and URL when the preview is ready
 */
export async function startQuartoPreview(file?: string, profile?: string): Promise<QuartoPreviewResult> {
  const args = ["preview"];
  
  // Add file if specified
  if (file) {
    args.push(file);
  }
  
  // Add profile if specified
  if (profile) {
    args.push("--profile", profile);
  }
  
  // Start Quarto preview process
  const quartoProcess = new Deno.Command("quarto", {
    args,
    stdout: "piped",
    stderr: "piped",
  });
  
  const process = quartoProcess.spawn();
  
  // Wait for the server to be ready and browser to load the page
  console.log("Waiting for Quarto server to start and page to load...");
  const url = await waitForQuartoServer(process);
  
  return {
    process,
    url
  };
}

/**
 * Waits for the Quarto server to start and the browser to load the page
 * @param process The Quarto preview process
 * @returns The URL where Quarto is serving the preview
 */
async function waitForQuartoServer(process: Deno.Process): Promise<string> {
  const decoder = new TextDecoder();
  let url = "";
  
  // Create a promise for the timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Timed out waiting for Quarto preview server to start"));
    }, 60000); // 60 seconds timeout
  });
  
  // Process the stdout stream just to see its output, but don't wait on it
  const logStdout = async (): Promise<void> => {
    const reader = process.stdout.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        console.log("Quarto stdout:", text);
      }
    } catch (error) {
      console.error("Error reading Quarto stdout:", error);
    } finally {
      reader.releaseLock();
    }
  };
  
  // Process the stderr stream - Quarto sends the important server messages here
  const processStderr = async (): Promise<string> => {
    const reader = process.stderr.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const text = decoder.decode(value);
        console.log("Quarto:", text);
        
        // Look for the Listening message to extract the URL
        const listeningMatch = text.match(/Listening on (http:\/\/[^\/\s]+)/);
        if (listeningMatch && url === "") {
          url = listeningMatch[1];
          console.log(`Quarto server started at ${url}`);
        }
        
        // When we see a GET request, the browser has loaded the page
        if (text.includes("GET:") && url !== "") {
          console.log("Browser has loaded the page");
          
          // Give a little extra time for the page to render fully
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Release the reader lock and return the URL
          reader.releaseLock();
          return url;
        }
      }
      
      throw new Error("Quarto stderr stream ended before server was ready");
    } catch (error) {
      reader.releaseLock();
      throw error;
    }
  };
  
  // Start the stdout logging (no need to await it)
  logStdout();
  
  // Wait for either the server to be ready or the timeout to occur
  return Promise.race([
    processStderr(),
    timeoutPromise
  ]);
}

/**
 * Stops a Quarto preview process
 * @param result The Quarto preview result to stop
 */
export async function stopQuartoPreview(result: QuartoPreviewResult | Deno.Process): Promise<void> {
  try {
    // Handle both new and old API
    const process = 'process' in result ? result.process : result;
    
    // First try to kill all processes matching "quarto preview"
    try {
      console.log("Killing all quarto preview processes...");
      const pkillCommand = new Deno.Command("pkill", {
        args: ["-f", "quarto preview"],
        stderr: "null",
        stdout: "null",
      });
      await pkillCommand.output();
    } catch (e) {
      // Ignore errors if pkill fails
      console.log("pkill command failed or found no matching processes");
    }
    
    // Also try to kill the process gracefully
    try {
      process.kill("SIGTERM");
      
      // Wait for the process to exit
      await process.status();
    } catch (e) {
      // Process may already be gone (killed by pkill), ignore
    }
  } catch (error) {
    console.error(`Error stopping Quarto preview: ${error.message}`);
    
    // Try to force kill if graceful stop failed
    try {
      const process = 'process' in result ? result.process : result;
      process.kill("SIGKILL");
    } catch (e) {
      // Process may already be gone, ignore
    }
  }
}