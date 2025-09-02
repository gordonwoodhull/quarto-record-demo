// types.ts - Type definitions for the Quarto Record Demo utility

/**
 * Command line options for the Quarto Record utility
 */
export interface QuartoRecordOptions {
  /** Output directory path (required, positional) */
  outputDir: string;
  
  /** Input directory path (location of git repository and Quarto website) */
  inputDir: string;
  
  /** Optional Quarto file to preview (.qmd) */
  file?: string;
  
  /** Starting commit hash */
  startCommit?: string;
  
  /** Optional file to copy to each output directory */
  copyFile?: string;
}

/**
 * Screen capture rectangle coordinates
 */
export interface ScreenRect {
  /** X coordinate of the rectangle */
  x: number;
  
  /** Y coordinate of the rectangle */
  y: number;
  
  /** Width of the rectangle */
  width: number;
  
  /** Height of the rectangle */
  height: number;
}

/**
 * Git commit information
 */
export interface GitCommit {
  /** Abbreviated commit hash */
  hash: string;
  
  /** Full commit message */
  message: string;
  
  /** Author name */
  author: string;
  
  /** Commit date */
  date: string;
}