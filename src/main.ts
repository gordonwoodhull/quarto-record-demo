// main.ts - Main execution flow for the Quarto Record Demo

import { parseArgs } from "./cli.ts";
import { getGitHistory, checkoutCommit, isGitRepository } from "./git.ts";
import { startQuartoPreview, stopQuartoPreview } from "./quarto.ts";
import { captureScreen, copyFile } from "./capture.ts";
import { ensureDir, sleep, getLastSelectionRect } from "./utils.ts";
import { checkPermissions, displayScreenCapturePermissionWarning } from "./permissions.ts";
import { basename } from "https://deno.land/std/path/mod.ts";

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
    
    // Get screen capture rectangle once at startup
    console.log("Getting screen capture rectangle...");
    const screenRect = await getLastSelectionRect();
    console.log(`Using screen rectangle: X=${screenRect.x}, Y=${screenRect.y}, Width=${screenRect.width}, Height=${screenRect.height}`);
    console.log("Output directory:", options.outputDir);
    console.log("Input directory:", options.inputDir);
    if (options.file) console.log("File to preview:", options.file);
    if (options.startCommit) console.log("Starting commit:", options.startCommit);
    if (options.copyFile) console.log("File to copy:", options.copyFile);
    
    // Check if input directory is a git repository
    console.log("Checking if input directory is a git repository...");
    const isGitRepo = await isGitRepository(options.inputDir);
    if (!isGitRepo) {
      throw new Error(`The directory '${options.inputDir}' is not a git repository`);
    }
    
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
      
      // Start Quarto preview and wait for it to be ready
      console.log("Starting Quarto preview...");
      const quartoResult = await startQuartoPreview(options.file);
      console.log(`Quarto preview ready at ${quartoResult.url}`);
      
      // Capture screenshot
      const screenshotPath = `${commitOutputDir}/screenshot.png`;
      console.log(`Capturing screenshot to ${screenshotPath}...`);
      const captureSuccess = await captureScreen(screenshotPath, screenRect);
      
      if (captureSuccess) {
        console.log("Screenshot captured successfully");
      } else {
        console.error("Failed to capture screenshot");
        throw new Error("Screenshot capture failed - terminating process");
      }
      
      // Stop Quarto preview
      console.log("Stopping Quarto preview...");
      await stopQuartoPreview(quartoResult);
      
      // Copy additional file if specified
      if (options.copyFile) {
        const destPath = `${commitOutputDir}/${basename(options.copyFile)}`;
        console.log(`Copying ${options.copyFile} to ${destPath}...`);
        const copySuccess = await copyFile(options.copyFile, destPath);
        
        if (copySuccess) {
          console.log("File copied successfully");
        } else {
          console.error("Failed to copy file");
          throw new Error("File copy failed - terminating process");
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