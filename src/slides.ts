// slides.ts - Slide generation utilities for Quarto Record Demo

import { basename } from "https://deno.land/std/path/mod.ts";

/**
 * Simple template function that replaces ${variable} placeholders with values
 * @param template The template string with ${variable} placeholders
 * @param variables The variables to replace in the template
 * @returns The template with variables replaced
 */
function renderTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\${([^}]+)}/g, (_, key) => variables[key] || '');
}

/**
 * Information about a slide to be generated
 */
interface SlideInfo {
  /** Item identifier (commit hash or profile name) */
  itemId: string;
  
  /** Path to the screenshot file */
  screenshot: string;
  
  /** Path to the optional copied file */
  file?: string;
}

/**
 * Class to manage slide collection and generation
 */
export class SlideGenerator {
  private slides: SlideInfo[] = [];
  
  /**
   * Adds a slide to the collection
   * @param itemId Item identifier (commit hash or profile name)
   * @param screenshotPath Path to the screenshot file
   * @param filePath Optional path to the copied file
   */
  addSlide(itemId: string, screenshotPath: string, filePath?: string): void {
    this.slides.push({
      itemId,
      screenshot: screenshotPath,
      file: filePath
    });
  }
  
  /**
   * Generates a slides document from the collected slides
   * @param outputDir Output directory path
   * @param templatePath Path to the template file
   * @param outputFilename Name of the output file
   */
  async generateSlides(outputDir: string, templatePath: string, outputFilename: string): Promise<void> {
    try {
      // Read template file
      const templateContent = await Deno.readTextFile(templatePath);
      
      // Generate slides content (as a document fragment, no metadata)
      let slidesContent = "";
      
      for (let i = 0; i < this.slides.length; i++) {
        const slide = this.slides[i];
        
        // Create relative paths for template variables
        const screenshotRelPath = `${slide.itemId}/screenshot.png`;
        const fileRelPath = slide.file ? `${slide.itemId}/${basename(slide.file)}` : '';
        
        // Process template for this slide
        const slideContent = renderTemplate(templateContent, {
          screenshot: screenshotRelPath,
          file: fileRelPath,
          itemId: slide.itemId
        });
        
        // Add the slide content
        slidesContent += `${slideContent}\n\n`;
        
        // Add slide separator (except after the last slide)
        if (i < this.slides.length - 1) {
          slidesContent += "---\n\n";
        }
      }
      
      // Write slides.qmdf to output directory
      const outputPath = `${outputDir}/${outputFilename}`;
      await Deno.writeTextFile(outputPath, slidesContent);
      console.log(`Generated ${outputFilename} in ${outputDir}`);
    } catch (error) {
      console.error(`Error generating slides: ${error.message}`);
      throw error;
    }
  }
}