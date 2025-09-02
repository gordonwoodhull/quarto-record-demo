// main.ts - Main execution flow for the Quarto Record Demo

import { parseArgs } from "./cli.ts";
import { getGitHistory, checkoutCommit } from "./git.ts";
import { startQuartoPreview, stopQuartoPreview } from "./quarto.ts";
import { captureScreen, copyFile } from "./capture.ts";
import { ensureDir, sleep } from "./utils.ts";
import { checkPermissions, displayScreenCapturePermissionWarning } from "./permissions.ts";

/**
 * Main function that runs the Quarto Record Demo utility
 */
async function main() {
  try {
    // Check for required permissions
    const hasPermissions = await checkPermissions();
    if (!hasPermissions) {
      Deno.exit(1);
    }
    
    // Display screen capture permission warning
    displayScreenCapturePermissionWarning();
    console.log("Quarto Record Demo - Starting...");
    
    // Parse command line arguments
    const options = parseArgs();
    console.log("Output directory:", options.outputDir);
    console.log("Input directory:", options.inputDir);
    if (options.file) console.log("File to preview:", options.file);
    if (options.startCommit) console.log("Starting commit:", options.startCommit);
    if (options.copyFile) console.log("File to copy:", options.copyFile);
    
    // Get git history
    console.log("Retrieving git history...");
    const commits = await getGitHistory(options.inputDir, options.startCommit);
    console.log(`Found ${commits.length} commits to process`);
    
    // Process each commit
    for (let i = 0; i < commits.length; i++) {
      const commit = commits[i];
      console.log(`\nProcessing commit ${i + 1}/${commits.length}: ${commit.hash} - ${commit.message}`);
      
      // Checkout the commit
      console.log(`Checking out commit ${commit.hash}...`);
      await checkoutCommit(options.inputDir, commit.hash);
      
      // Create output directory for this commit
      const commitOutputDir = `${options.outputDir}/${commit.hash}`;
      await ensureDir(commitOutputDir);
      console.log(`Created output directory: ${commitOutputDir}`);
      
      // Start Quarto preview
      console.log("Starting Quarto preview...");
      const quartoProcess = await startQuartoPreview(options.file);
      
      // Wait for Quarto to render (adjust as needed)
      console.log("Waiting for Quarto to render...");
      await sleep(5000);
      
      // Capture screenshot
      const screenshotPath = `${commitOutputDir}/screenshot.png`;
      console.log(`Capturing screenshot to ${screenshotPath}...`);
      const captureSuccess = await captureScreen(screenshotPath);
      
      if (captureSuccess) {
        console.log("Screenshot captured successfully");
      } else {
        console.error("Failed to capture screenshot");
      }
      
      // Stop Quarto preview
      console.log("Stopping Quarto preview...");
      await stopQuartoPreview(quartoProcess);
      
      // Copy additional file if specified
      if (options.copyFile) {
        const destPath = `${commitOutputDir}/${Deno.basename(options.copyFile)}`;
        console.log(`Copying ${options.copyFile} to ${destPath}...`);
        const copySuccess = await copyFile(options.copyFile, destPath);
        
        if (copySuccess) {
          console.log("File copied successfully");
        } else {
          console.error("Failed to copy file");
        }
      }
      
      console.log(`Completed processing commit ${commit.hash}`);
    }
    
    console.log("\nQuarto Record Demo - Completed successfully!");
  } catch (error) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}