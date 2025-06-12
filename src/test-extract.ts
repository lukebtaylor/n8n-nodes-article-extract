import { readFileSync } from 'fs';
import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

// Sample function to test Readability outside of n8n
export function extractArticleFromHtml(html: string, url?: string): any {
  try {
    // Create a JSDOM instance from the HTML
    const htmlDom = new JSDOM(html, { url });

    // Use Readability to parse the article
    const readabilityParser = new Readability(htmlDom.window.document);
    const extractedArticle = readabilityParser.parse();

    // Clean up JSDOM resources
    htmlDom.window.close();

    return extractedArticle;
  } catch (error) {
    console.error('Error extracting article:', error);
    return null;
  }
}

// Example usage
async function testWithLocalFile(): Promise<void> {
  try {
    // Replace with path to a sample HTML file
    const htmlContent = readFileSync('./test/fixtures/sample-article.html', 'utf8');
    const sampleUrl = 'https://example.com/sample-article';

    const extractedArticle = extractArticleFromHtml(htmlContent, sampleUrl);

    if (extractedArticle) {
      console.log('Title:', extractedArticle.title);
      console.log('Excerpt:', extractedArticle.excerpt);
      console.log('Content length:', extractedArticle.textContent.length);
      console.log('Byline:', extractedArticle.byline);
    } else {
      console.log('Failed to extract article');
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test when this file is executed directly
if (require.main === module) {
  testWithLocalFile().then(() => console.log('Test completed'));
}
