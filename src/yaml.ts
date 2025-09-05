// yaml.ts - YAML parsing utilities for the Quarto Record Demo

import { parse } from "https://deno.land/std/yaml/mod.ts";

/**
 * Parses the _quarto.yml file and extracts profiles from a specified group
 * @param inputDir Directory containing the _quarto.yml file
 * @param groupIndex Index of the profile group to use (defaults to 0)
 * @returns Array of profile names
 */
export async function getProfilesFromGroup(inputDir: string, groupIndex: number = 0): Promise<string[]> {
  try {
    // Read _quarto.yml file
    const quartoYmlPath = `${inputDir}/_quarto.yml`;
    const quartoYmlContent = await Deno.readTextFile(quartoYmlPath);
    
    // Parse YAML content
    const quartoConfig = parse(quartoYmlContent) as Record<string, any>;
    
    // Check if profile group exists
    if (!quartoConfig.profile?.group) {
      throw new Error("No profile groups found in _quarto.yml");
    }
    
    // Get the profile group at the specified index
    const profileGroups = quartoConfig.profile.group;
    
    if (!Array.isArray(profileGroups)) {
      throw new Error("Profile group is not an array");
    }
    
    if (groupIndex >= profileGroups.length) {
      throw new Error(`Profile group index ${groupIndex} out of range (max: ${profileGroups.length - 1})`);
    }
    
    const profileGroup = profileGroups[groupIndex];
    
    if (!Array.isArray(profileGroup)) {
      throw new Error("Selected profile group is not an array");
    }
    
    // Validate that we have at least one profile
    if (profileGroup.length === 0) {
      throw new Error("Selected profile group is empty");
    }
    
    // Return the profiles, ensuring all elements are strings
    // This handles cases where YAML might parse profile names as numbers or other types
    return profileGroup.map(profile => String(profile));
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error("_quarto.yml file not found in the input directory");
    }
    throw error;
  }
}