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
  
  /** 
   * Profile group index to use (mutually exclusive with commit-based rendering)
   * If defined, will use profiles from the specified group index in _quarto.yml
   * If set to true with no value, will use the first group (index 0)
   */
  profileGroupIndex?: number;
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

/**
 * Configuration for processing an item (commit or profile)
 */
export interface ProcessItemOptions {
  /** Item identifier (commit hash or profile name) */
  itemId: string;
  
  /** Item description (commit message or profile description) */
  itemDescription: string;
  
  /** Output directory for this item */
  outputDir: string;
  
  /** Input directory path */
  inputDir: string;
  
  /** File to preview */
  file?: string;
  
  /** Profile name (for profile mode only) */
  profile?: string;
  
  /** File to copy */
  copyFile?: string;
  
  /** Screen capture rectangle */
  screenRect: ScreenRect;
}