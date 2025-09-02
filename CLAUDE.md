# quarto demo recorder

This utility, written in deno typescript, captures screenshots of a Quarto website, rendered at each commit in the Git history.

It takes the following arguments:

- output directory (required, positional)
- --input directory (named, location of git repository and Quarto website, defaults to .)
- --file file.qmd (defaults to none)
- --start-commit (git commit hash, defaults to initial commit)
- --copy-file (defaults to none)

It figures out absolute paths for the output and input directories, to be used henceforth.

Then it changes to the input directory, and gets the abbreviated git hashes for the input repo back to start-commit.

Then for each hash, it

- checks out the hash
- mkdir `${output}/${hash}`
- `quarto preview ${file}.qmd` or `quarto preview` if no file
- wait a few seconds
- use the macos screencapture utility to capture a rectangular selection. here is the basic documentation:
  https://ss64.com/mac/screencapture.html
  There should be a way to reuse the last rectangle, because I can see that the values are saved in the plist preferences for screencapture. We may need to research this further!
  Write the screenshot to output-hash directory
- kills quarto preview
- copies copy-file to output-hash directory

## Research Findings on Screencapture

1. The macOS screencapture utility has a `-R` option that allows capturing a specific rectangle using coordinates in the format: `x,y,width,height`

2. The last-used rectangular selection coordinates are stored in macOS preferences and can be retrieved with:
   ```
   defaults read com.apple.screencapture last-selection
   ```
   This returns a dictionary with X, Y, Width, and Height values.

3. To capture using these stored coordinates:
   ```
   screencapture -R "X,Y,Width,Height" output.png
   ```

4. We'll need to request proper permissions for screen recording when executing the utility.

## Additional Implementation Considerations

1. **Process Management**:
   - Need to handle starting and stopping the Quarto preview process properly
   - Should use Deno's subprocess API for this
   - Need to allow enough time for Quarto preview to fully render before capturing

2. **Error Handling**:
   - Handle cases where git operations fail
   - Handle cases where Quarto preview fails to start
   - Handle cases where screencapture fails due to permissions

3. **Implementation Approach**:
   - First create a workflow to capture a single snapshot
   - Then add the git history traversal functionality
   - Use TypeScript interfaces for proper typing

Please draw up a plan for review. Thanks Claude!
