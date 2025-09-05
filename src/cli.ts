// cli.ts - Command line argument parsing

import { QuartoRecordOptions } from "./types.ts";
import { resolve } from "https://deno.land/std/path/mod.ts";

/**
 * Parses command line arguments for the Quarto Record utility
 * @returns Parsed command line options
 */
export function parseArgs(): QuartoRecordOptions {
  // Define the argument parser
  const args = Deno.args;
  
  // At least one argument (output directory) is required
  if (args.length < 1) {
    throw new Error(
      "Usage: quarto-record-demo OUTPUT_DIR [--input INPUT_DIR] [--file FILE.qmd] [--start-commit COMMIT] [--copy-file FILE] [--profile-group [INDEX]]"
      + "\n\nModes (mutually exclusive):\n  Default: Process Git commits from history\n  --profile-group: Process profiles from _quarto.yml profile group"
    );
  }
  
  // Parse positional output directory argument
  const outputDir = args[0];
  
  // Parse named arguments
  let inputDir = ".";  // Default to current directory
  let file: string | undefined;
  let startCommit: string | undefined;
  let copyFile: string | undefined;
  let profileGroupIndex: number | undefined;
  
  // Parse named arguments
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === "--input" && i + 1 < args.length) {
      inputDir = args[++i];
    } else if (arg === "--file" && i + 1 < args.length) {
      file = args[++i];
    } else if (arg === "--start-commit" && i + 1 < args.length) {
      startCommit = args[++i];
    } else if (arg === "--copy-file" && i + 1 < args.length) {
      copyFile = args[++i];
    } else if (arg === "--profile-group") {
      // Check if the next argument is a number
      if (i + 1 < args.length && !isNaN(Number(args[i + 1])) && !args[i + 1].startsWith("--")) {
        profileGroupIndex = Number(args[++i]);
      } else {
        // If no number is provided, use index 0 (the first group)
        profileGroupIndex = 0;
      }
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  
  // Convert paths to absolute
  const absOutputDir = resolve(outputDir);
  const absInputDir = resolve(inputDir);
  let absCopyFile: string | undefined;
  
  if (copyFile) {
    absCopyFile = resolve(copyFile);
  }
  
  // Check for mutually exclusive options
  if (profileGroupIndex !== undefined && startCommit) {
    throw new Error("--profile-group and --start-commit are mutually exclusive options");
  }
  
  // Return parsed options
  return {
    outputDir: absOutputDir,
    inputDir: absInputDir,
    file,
    startCommit,
    copyFile: absCopyFile,
    profileGroupIndex,
  };
}