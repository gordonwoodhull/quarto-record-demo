// main.ts - Main execution flow for the Quarto Record Demo

import { parseArgs } from "./cli.ts";
import { getGitHistory, checkoutCommit } from "./git.ts";
import { startQuartoPreview, stopQuartoPreview } from "./quarto.ts";
import { captureScreen, copyFile } from "./capture.ts";
import { ensureDir, sleep, getLastSelectionRect } from "./utils.ts";
import { checkPermissions, displayScreenCapturePermissionWarning } from "./permissions.ts";
import { getProfilesFromGroup } from "./yaml.ts";
import { ProcessItemOptions } from "./types.ts";
import { basename } from "https://deno.land/std/path/mod.ts";


/**
 * Process a single item (commit or profile)
 */
async function processItem(options: ProcessItemOptions): Promise<void> {
  // Create output directory for this item
  const itemOutputDir = `${options.outputDir}/${options.itemId}`;
  await ensureDir(itemOutputDir);
  console.log(`Created output directory: ${itemOutputDir}`);
  
  // Start Quarto preview
  console.log("Starting Quarto preview...");
  const quartoResult = await startQuartoPreview(options.file, options.profile);
  console.log(`Quarto preview ready at ${quartoResult.url}`);
  
  // Capture screenshot
  const screenshotPath = `${itemOutputDir}/screenshot.png`;
  console.log(`Capturing screenshot to ${screenshotPath}...`);
  const captureSuccess = await captureScreen(screenshotPath, options.screenRect);
  
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
    const destPath = `${itemOutputDir}/${basename(options.copyFile)}`;
    console.log(`Copying ${options.copyFile} to ${destPath}...`);
    const copySuccess = await copyFile(options.copyFile, destPath);
    
    if (copySuccess) {
      console.log("File copied successfully");
    } else {
      console.error("Failed to copy file");
      throw new Error("File copy failed - terminating process");
    }
  }
  
  console.log(`Completed processing ${options.itemDescription}`);
}

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
    
    // Determine which mode to run in
    if (options.profileGroupIndex !== undefined) {
      // Profile group mode
      console.log(`Using profile group mode with index ${options.profileGroupIndex}`);
      
      // Get profiles from the specified group
      const profiles = await getProfilesFromGroup(options.inputDir, options.profileGroupIndex);
      console.log(`Found ${profiles.length} profiles to process: ${profiles.join(", ")}`);
      
      // Process each profile
      for (let i = 0; i < profiles.length; i++) {
        const profile = profiles[i];
        console.log(`\nProcessing profile ${i + 1}/${profiles.length}: ${profile}`);
        
        await processItem({
          itemId: profile,
          itemDescription: `profile ${profile}`,
          outputDir: options.outputDir,
          inputDir: options.inputDir,
          file: options.file,
          profile,
          copyFile: options.copyFile,
          screenRect
        });
      }
    } else {
      // Git history mode
      console.log("Using git history mode");
      
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
        
        await processItem({
          itemId: commit.hash,
          itemDescription: `commit ${commit.hash}`,
          outputDir: options.outputDir,
          inputDir: options.inputDir,
          file: options.file,
          copyFile: options.copyFile,
          screenRect
        });
      }
    }
    
    console.log("\nQuarto Record Demo - Completed successfully!");
    // Force exit the process regardless of any hanging operations
    Deno.exit(0);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}