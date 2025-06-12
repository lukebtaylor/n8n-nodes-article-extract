import {
  IExecuteFunctions,
  IDataObject,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
  NodeConnectionType,
} from 'n8n-workflow';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

export class ArticleExtractor implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Article Extractor',
    name: 'articleExtractor',
    icon: 'file:article.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Extract article content from web pages using Mozilla Readability',
    defaults: {
      name: 'Article Extractor',
    },
    inputs: [NodeConnectionType.Main],
    outputs: [NodeConnectionType.Main],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Extract Article',
            value: 'extract',
            description: 'Extract article content from HTML',
            action: 'Extract article content from HTML',
          },
        ],
        default: 'extract',
      },
      {
        displayName: 'HTML Input Field',
        name: 'htmlField',
        type: 'string',
        default: 'data',
        description:
          'The field in the input that contains the HTML to extract from. Accepts HTML string directly or URL response data.',
        required: true,
        displayOptions: {
          show: {
            operation: ['extract'],
          },
        },
      },
      {
        displayName: 'URL',
        name: 'url',
        type: 'string',
        default: '',
        description: 'The URL of the page (optional, used for resolving relative links)',
        displayOptions: {
          show: {
            operation: ['extract'],
          },
        },
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Character Threshold',
            name: 'charThreshold',
            type: 'number',
            default: 500,
            description:
              'The minimum number of characters an article must have to be considered valid',
          },
          {
            displayName: 'Include Images',
            name: 'includeImages',
            type: 'boolean',
            default: true,
            description: 'Whether to include images in the extracted content',
          },
          {
            displayName: 'Keep Classes',
            name: 'keepClasses',
            type: 'boolean',
            default: false,
            description: 'Whether to preserve class names in the HTML',
          },
          {
            displayName: 'Max Elements to Parse',
            name: 'maxElemsToParse',
            type: 'number',
            default: 0,
            description: 'The maximum number of elements to parse (0 for no limit)',
          },
        ],
      },
    ],
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: INodeExecutionData[] = [];

    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string;

        if (operation === 'extract') {
          const htmlField = this.getNodeParameter('htmlField', i) as string;
          const url = this.getNodeParameter('url', i, '') as string;
          const options = this.getNodeParameter('options', i, {}) as IDataObject;

          // Get HTML content from the specified field
          const htmlContent = this.getNodeParameter('htmlField', i)
            ? (items[i].json[htmlField] as string)
            : (items[i].json.html as string) || (items[i].json.data as string) || '';

          if (!htmlContent) {
            throw new NodeOperationError(
              this.getNode(),
              `No HTML content found in field '${htmlField}'`,
              { itemIndex: i },
            );
          }

          // Create DOM from HTML
          const dom = new JSDOM(htmlContent, { url });

          // Configure Readability options
          const readabilityOptions: any = {
            debug: false,
            charThreshold: options.charThreshold as number,
            keepClasses: options.keepClasses as boolean,
          };

          if (options.maxElemsToParse) {
            readabilityOptions.maxElemsToParse = options.maxElemsToParse as number;
          }

          // Parse the content with Readability
          const reader = new Readability(dom.window.document, readabilityOptions);
          const article = reader.parse();

          // Clean up JSDOM resources
          dom.window.close();

          if (!article) {
            throw new NodeOperationError(
              this.getNode(),
              'Could not extract article from the provided HTML',
              { itemIndex: i },
            );
          }

          // Build output object
          const result = {
            title: article.title,
            content: article.content,
            textContent: article.textContent,
            length: article.textContent?.length,
            excerpt: article.excerpt,
            byline: article.byline,
            dir: article.dir,
            siteName: article.siteName,
            lang: article.lang,
            publishedTime: article.publishedTime,
          };

          // Handle images if needed
          if (options.includeImages === false) {
            // Create a temporary DOM to manipulate the content
            const tempDom = new JSDOM(`<div>${result.content}</div>`);
            const images = tempDom.window.document.querySelectorAll('img');

            // Remove all images
            images.forEach((img) => img.remove());

            // Update the content
            result.content = tempDom.window.document.querySelector('div')!.innerHTML;
            tempDom.window.close();
          }

          // Add the extracted article data to the returned items
          const newItem: INodeExecutionData = {
            json: {
              ...result,
            },
            pairedItem: { item: i },
          };

          returnData.push(newItem);
        }
      } catch (error: any) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
            },
            pairedItem: { item: i },
          });
          continue;
        }
        throw error;
      }
    }

    return [returnData];
  }
}
