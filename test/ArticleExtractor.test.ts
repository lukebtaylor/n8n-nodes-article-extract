import { readFileSync } from 'fs';
import { join } from 'path';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import { ArticleExtractor } from '../src/nodes/ArticleExtractor/ArticleExtractor.node';

// Function to extract article content (similar to the one in test-extract.ts)
function extractArticleFromHtml(html: string, url?: string): any {
  const htmlDom = new JSDOM(html, { url });
  const readabilityParser = new Readability(htmlDom.window.document);
  const extractedArticle = readabilityParser.parse();
  htmlDom.window.close();
  return extractedArticle;
}

describe('ArticleExtractor', () => {
  let node: ArticleExtractor;
  let sampleHtml: string;
  let confluentBlogHtml: string;

  beforeAll(() => {
    node = new ArticleExtractor();
    sampleHtml = readFileSync(join(__dirname, 'fixtures', 'sample-article.html'), 'utf8');
    confluentBlogHtml = readFileSync(join(__dirname, 'fixtures', 'confluent-blog.html'), 'utf8');
  });

  test('should have proper node properties', () => {
    expect(node.description).toBeDefined();
    expect(node.description.name).toBe('articleExtractor');
    expect(node.description.displayName).toBe('Article Extractor');
    expect(node.description.properties).toBeDefined();
    expect(node.description.properties.length).toBeGreaterThan(0);
  });

  // Note: These tests would need to be expanded and implemented properly
  // with appropriate mocking for IExecuteFunctions and other n8n interfaces

  test('verify node has extract operation', () => {
    const operations = node.description.properties.find((p) => p.name === 'operation');
    expect(operations).toBeDefined();

    if (operations && Array.isArray(operations.options)) {
      expect(operations.options).toContainEqual(
        expect.objectContaining({
          value: 'extract',
          name: 'Extract Article',
        }),
      );
    } else {
      fail('Operation options not found or not an array');
    }
  });

  test('should extract article content from sample HTML', () => {
    // Extract article from sample HTML
    const extractedArticle = extractArticleFromHtml(
      sampleHtml,
      'https://example.com/sample-article',
    );

    // Verify extraction results
    expect(extractedArticle).toBeDefined();
    expect(extractedArticle.title).toBe('Sample Article for Testing');
    expect(extractedArticle.textContent).toContain('The Main Article Title');
    expect(extractedArticle.textContent).toContain('Lorem ipsum dolor sit amet');
    expect(extractedArticle.content).toContain('<div id="readability-page-1"');
  });

  test('should handle custom Readability options', () => {
    // Create two separate DOM instances to avoid interference
    const defaultDom = new JSDOM(sampleHtml, { url: 'https://example.com/sample-article' });
    const customOptionsDom = new JSDOM(sampleHtml, { url: 'https://example.com/sample-article' });

    // Test with default options
    const defaultReader = new Readability(defaultDom.window.document);
    const defaultArticle = defaultReader.parse();

    // Test with very permissive options that should still extract something
    const customReader = new Readability(customOptionsDom.window.document, {
      keepClasses: true,
      charThreshold: 10, // Very low threshold to ensure something is extracted
    });
    const customArticle = customReader.parse();

    // Cleanup
    defaultDom.window.close();
    customOptionsDom.window.close();

    // Verify extraction worked in both cases
    expect(defaultArticle).not.toBeNull();
    expect(customArticle).not.toBeNull();

    // Just ensure basic properties exist on both results
    expect(defaultArticle?.title).toBeDefined();
    expect(defaultArticle?.content).toBeDefined();
    expect(defaultArticle?.textContent).toBeDefined();

    expect(customArticle?.title).toBeDefined();
    expect(customArticle?.content).toBeDefined();
    expect(customArticle?.textContent).toBeDefined();
  });

  test('should extract Confluent blog post consistently with expected output', () => {
    // Load expected metadata and content from previously saved files
    const expectedMetadata = JSON.parse(
      readFileSync(join(__dirname, 'fixtures', 'confluent-blog-metadata.json'), 'utf8'),
    );
    const expectedContent = readFileSync(
      join(__dirname, 'fixtures', 'confluent-blog-extracted.html'),
      'utf8',
    );

    // Extract article from the Confluent blog
    const extractedArticle = extractArticleFromHtml(
      confluentBlogHtml,
      'https://www.confluent.io/blog/kip-848-consumer-rebalance-protocol/',
    );

    // Create current metadata object with the same structure as the expected one
    const currentMetadata = {
      title: extractedArticle.title,
      byline: extractedArticle.byline,
      excerpt: extractedArticle.excerpt,
      siteName: extractedArticle.siteName,
      length: extractedArticle.textContent?.length,
    };

    // Verify metadata matches expected values
    expect(currentMetadata.title).toBe(expectedMetadata.title);
    expect(currentMetadata.byline).toBe(expectedMetadata.byline);
    expect(currentMetadata.excerpt).toBe(expectedMetadata.excerpt);
    expect(currentMetadata.siteName).toBe(expectedMetadata.siteName);

    // Length might vary slightly due to whitespace differences, so use approximate comparison
    expect(currentMetadata.length).toBeGreaterThanOrEqual(expectedMetadata.length * 0.95);
    expect(currentMetadata.length).toBeLessThanOrEqual(expectedMetadata.length * 1.05);

    // The extracted content should be identical to our expected content
    // This ensures consistency in the extraction process
    expect(extractedArticle.content).toBe(expectedContent);
  });
});
