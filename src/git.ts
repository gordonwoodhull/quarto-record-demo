// git.ts - Git operations for the Quarto Record Demo

import { GitCommit } from "./types.ts";

/**
 * Gets a list of abbreviated git commit hashes starting from the given commit
 * @param repoDir The repository directory
 * @param startCommit Optional starting commit hash (defaults to initial commit)
 * @returns Array of commit hashes in chronological order (oldest first)
 */
export async function getGitHistory(repoDir: string, startCommit?: string): Promise<GitCommit[]> {
  try {
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
      
      const { stdout: firstCommitOut } = await firstCommitCommand.output();
      startCommit = new TextDecoder().decode(firstCommitOut).trim();
    }
    
    // Get all commits from start commit to HEAD
    // Format: %h (abbreviated hash), %s (subject), %an (author name), %ad (author date)
    const command = new Deno.Command("git", {
      args: ["log", "--format=%h|%s|%an|%ad", `${startCommit}^..HEAD`],
      stdout: "piped",
      stderr: "piped",
    });
    
    const { stdout } = await command.output();
    const output = new TextDecoder().decode(stdout).trim();
    
    // Parse the output into GitCommit objects
    const commits = output.split("\n").map(line => {
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
    // Change to the repository directory
    const originalDir = Deno.cwd();
    Deno.chdir(repoDir);
    
    // Checkout the commit
    const command = new Deno.Command("git", {
      args: ["checkout", commitHash],
      stdout: "piped",
      stderr: "piped",
    });
    
    const { status } = await command.output();
    
    if (!status.success) {
      throw new Error(`Failed to checkout commit ${commitHash}`);
    }
    
    // Restore original directory
    Deno.chdir(originalDir);
  } catch (error) {
    throw new Error(`Failed to checkout commit ${commitHash}: ${error.message}`);
  }
}