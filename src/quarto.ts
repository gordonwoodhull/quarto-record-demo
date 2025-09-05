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
    
    // 1. First try to kill the process we know about
    console.log(`Killing Quarto preview process with PID ${process.pid}...`);
    try {
      process.kill("SIGTERM");
      
      // Wait for the process to exit with a timeout
      const statusPromise = process.status;
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Timeout waiting for process to exit")), 2000);
      });
      
      await Promise.race([statusPromise, timeoutPromise]);
      console.log(`Successfully terminated process ${process.pid}`);
    } catch (e) {
      console.log(`Process ${process.pid} may be stubborn or already terminated: ${e.message}`);
      
      // Try to force kill
      try {
        process.kill("SIGKILL");
      } catch (innerE) {
        // Process may already be gone, ignore
      }
    }
    
    // 2. Then kill orphaned Deno processes running Quarto preview
    console.log("Finding and killing orphaned Deno processes running Quarto preview...");
    try {
      const pkillCommand = new Deno.Command("pkill", {
        args: ["-f", "deno.*quarto\\.ts preview"],
        stderr: "null",
        stdout: "null",
      });
      await pkillCommand.output();
      console.log("Sent kill signal to any orphaned Deno processes");
      
      // Give processes a moment to terminate
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (e) {
      // pkill returns non-zero if no processes match
      console.log("No matching orphaned processes found or pkill failed");
    }
    
    // 3. Check if there are still processes to clean up (verification step)
    try {
      const checkCommand = new Deno.Command("pgrep", {
        args: ["-f", "deno.*quarto\\.ts preview"],
        stdout: "piped",
      });
      const checkOutput = await checkCommand.output();
      
      if (checkOutput.success) {
        const remainingPids = new TextDecoder().decode(checkOutput.stdout).trim();
        
        if (remainingPids) {
          console.log(`Found stubborn processes still running: ${remainingPids}`);
          
          // Force kill with SIGKILL
          const forceKillCommand = new Deno.Command("pkill", {
            args: ["-9", "-f", "deno.*quarto\\.ts preview"],
            stderr: "null",
            stdout: "null",
          });
          await forceKillCommand.output();
          console.log("Sent SIGKILL to stubborn processes");
        }
      }
    } catch (e) {
      // pgrep returns non-zero if no processes match, which is what we want
      console.log("Verification complete - no remaining processes found");
    }
  } catch (error) {
    console.error(`Error stopping Quarto preview: ${error.message}`);
  }
}