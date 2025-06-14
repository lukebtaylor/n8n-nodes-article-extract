module.exports = {
  /**
   * https://prettier.io/docs/en/options.html#semicolons
   */
  semi: true,

  /**
   * https://prettier.io/docs/en/options.html#trailing-commas
   */
  trailingComma: 'all',

  /**
   * https://prettier.io/docs/en/options.html#bracket-spacing
   */
  bracketSpacing: true,

  /**
   * https://prettier.io/docs/en/options.html#tabs
   */
  useTabs: false,

  /**
   * https://prettier.io/docs/en/options.html#tab-width
   */
  tabWidth: 2,

  /**
   * https://prettier.io/docs/en/options.html#arrow-function-parentheses
   */
  arrowParens: 'always',

  /**
   * https://prettier.io/docs/en/options.html#quotes
   */
  singleQuote: true,

  /**
   * https://prettier.io/docs/en/options.html#quote-props
   */
  quoteProps: 'as-needed',

  /**
   * https://prettier.io/docs/en/options.html#end-of-line
   */
  endOfLine: 'lf',

  /**
   * https://prettier.io/docs/en/options.html#print-width
   */
  printWidth: 100,

  /**
   * File-specific overrides
   */
  overrides: [
    {
      files: ['*.json', '*.jsonc'],
      options: {
        tabWidth: 4,
      },
    },
    {
      files: ['*.md', '*.markdown'],
      options: {
        proseWrap: 'preserve',
        // useTabs: false,
        tabWidth: 4,
        // Prevents unwanted extra spaces around list markers
        htmlWhitespaceSensitivity: 'strict',
        // Ensures markdown is formatted precisely
        embeddedLanguageFormatting: 'auto',
      },
    },
    {
      files: ['*.yml', '*.yaml'],
      options: {
        tabWidth: 2,
      },
    },
  ],
};
