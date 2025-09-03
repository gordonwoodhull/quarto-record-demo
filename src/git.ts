// git.ts - Git operations for the Quarto Record Demo

import { GitCommit } from "./types.ts";

/**
 * Checks if a directory is a valid git repository
 * @param repoDir The directory to check
 * @returns True if the directory is a git repository, false otherwise
 */
export async function isGitRepository(repoDir: string): Promise<boolean> {
  try {
    const originalDir = Deno.cwd();
    Deno.chdir(repoDir);
    
    // Try to run a simple git command to check if this is a git repository
    const command = new Deno.Command("git", {
      args: ["rev-parse", "--is-inside-work-tree"],
      stdout: "piped",
      stderr: "piped",
    });
    
    const output = await command.output();
    Deno.chdir(originalDir);
    
    return output && output.status && output.status.success;
  } catch (error) {
    console.error(`Error checking if directory is a git repository: ${error.message}`);
    return false;
  }
}

/**
 * Gets a list of abbreviated git commit hashes starting from the given commit
 * @param repoDir The repository directory
 * @param startCommit Optional starting commit hash (defaults to initial commit)
 * @returns Array of commit hashes in chronological order (oldest first)
 */
export async function getGitHistory(repoDir: string, startCommit?: string): Promise<GitCommit[]> {
  try {
    // Check if the directory is a git repository
    if (!await isGitRepository(repoDir)) {
      throw new Error(`The directory '${repoDir}' is not a git repository`);
    }
    
    // Change to the repository directory
    const originalDir = Deno.cwd();
    Deno.chdir(repoDir);
    
    // If no start commit provided, get the first commit hash
    if (!startCommit) {
      const firstCommitCommand = new Deno.Command("git", {
        args: ["rev-list", "--max-parents=0", "HEAD"],
        stdout: "piped",
        stderr: "piped",
      });
      
      const firstOutput = await firstCommitCommand.output();
      if (!firstOutput || !firstOutput.status || !firstOutput.status.success) {
        throw new Error("Failed to get initial commit hash");
      }
      
      startCommit = new TextDecoder().decode(firstOutput.stdout).trim();
    }
    
    // Get all commits from start commit to HEAD
    // Format: %h (abbreviated hash), %s (subject), %an (author name), %ad (author date)
    const command = new Deno.Command("git", {
      args: ["log", "--format=%h|%s|%an|%ad", `${startCommit}^..HEAD`],
      stdout: "piped",
      stderr: "piped",
    });
    
    const output = await command.output();
    if (!output || !output.status || !output.status.success) {
      throw new Error(`Failed to get git history from ${startCommit}`);
    }
    
    const outputText = new TextDecoder().decode(output.stdout).trim();
    if (!outputText) {
      throw new Error("No git history found or invalid start commit");
    }
    
    // Parse the output into GitCommit objects
    const commits = outputText.split("\n").map(line => {
      const [hash, message, author, date] = line.split("|");
      return { hash, message, author, date };
    });
    
    // Restore original directory
    Deno.chdir(originalDir);
    
    // Return commits in chronological order (oldest first)
    return commits.reverse();
  } catch (error) {
    throw new Error(`Failed to get git history: ${error.message}`);
  }
}

/**
 * Checks out a specific git commit
 * @param repoDir The repository directory
 * @param commitHash The commit hash to checkout
 */
export async function checkoutCommit(repoDir: string, commitHash: string): Promise<void> {
  try {
    // Check if the directory is a git repository
    if (!await isGitRepository(repoDir)) {
      throw new Error(`The directory '${repoDir}' is not a git repository`);
    }
    
    if (!commitHash) {
      throw new Error("No commit hash provided for checkout");
    }
    
    // Change to the repository directory
    const originalDir = Deno.cwd();
    Deno.chdir(repoDir);
    
    // Checkout the commit
    const command = new Deno.Command("git", {
      args: ["checkout", commitHash],
      stdout: "piped",
      stderr: "piped",
    });
    
    const output = await command.output();
    
    if (!output || !output.status || !output.status.success) {
      const stderr = new TextDecoder().decode(output?.stderr ?? new Uint8Array());
      throw new Error(`Failed to checkout commit ${commitHash}: ${stderr}`);
    }
    
    // Restore original directory
    Deno.chdir(originalDir);
  } catch (error) {
    throw new Error(`Failed to checkout commit ${commitHash}: ${error.message}`);
  }
}