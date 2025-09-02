# Quarto Record Demo

A utility written in Deno TypeScript that captures screenshots of a Quarto website rendered at each commit in the Git history.

## Requirements

- Deno (https://deno.com/)
- Git
- Quarto (https://quarto.org/)
- macOS (for the screencapture utility)

## Installation

No installation needed beyond the requirements above. This is a standalone Deno application.

## Usage

```bash
deno task start OUTPUT_DIR [--input INPUT_DIR] [--file FILE.qmd] [--start-commit COMMIT] [--copy-file FILE]
```

### Arguments

- `OUTPUT_DIR` (required, positional): Directory where screenshots will be saved
- `--input INPUT_DIR` (optional): Location of the Git repository and Quarto website (defaults to current directory)
- `--file FILE.qmd` (optional): Specific Quarto file to preview (if not provided, will run `quarto preview` without a file)
- `--start-commit COMMIT` (optional): Git commit hash to start from (defaults to initial commit)
- `--copy-file FILE` (optional): Additional file to copy to each output directory

### Example

```bash
deno task start ./screenshots --input ./my-quarto-project --file index.qmd
```

## Permissions

This application requires the following permissions:
- `--allow-read`: For reading files
- `--allow-write`: For writing output files
- `--allow-run`: For executing Git and Quarto commands

Additionally, your terminal application needs Screen Recording permission to capture screenshots. You may be prompted to enable this in System Settings > Privacy & Security > Screen Recording.

## How It Works

1. Determines absolute paths for input and output directories
2. Retrieves all Git commits from the repository (or from the start-commit if provided)
3. For each commit:
   - Checks out the commit
   - Creates a directory for the commit in the output location
   - Starts a Quarto preview
   - Waits for the preview to render
   - Captures a screenshot of the preview
   - Stops the Quarto preview
   - Copies the additional file if specified

## Notes

- The application will use the last rectangular selection area used by the macOS screencapture tool. Make sure to select the proper area before running the utility for the first time.
- When capturing multiple commits, the same screen area will be used for all captures.