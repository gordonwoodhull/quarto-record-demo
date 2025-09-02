// permissions.ts - Permissions checking and management

/**
 * Checks if the application has the necessary permissions
 * @returns True if all required permissions are available
 */
export async function checkPermissions(): Promise<boolean> {
  // Check for run permission (needed for external commands)
  try {
    await Deno.permissions.query({ name: "run" });
  } catch (_) {
    console.error("Run permission is required for executing external commands");
    console.error("Please run with --allow-run flag");
    return false;
  }
  
  // Check for read permission (needed for file reading)
  try {
    await Deno.permissions.query({ name: "read" });
  } catch (_) {
    console.error("Read permission is required for reading files");
    console.error("Please run with --allow-read flag");
    return false;
  }
  
  // Check for write permission (needed for writing output files)
  try {
    await Deno.permissions.query({ name: "write" });
  } catch (_) {
    console.error("Write permission is required for writing files");
    console.error("Please run with --allow-write flag");
    return false;
  }
  
  return true;
}

/**
 * Displays a warning about the need for screen recording permissions
 */
export function displayScreenCapturePermissionWarning(): void {
  console.warn("\n⚠️  IMPORTANT: Screen Recording Permission Required ⚠️");
  console.warn("This utility requires screen recording permission to capture Quarto previews.");
  console.warn("If prompted, please allow screen recording access for the terminal application.");
  console.warn("You may need to go to System Settings > Privacy & Security > Screen Recording");
  console.warn("and ensure your terminal application has permission.\n");
}