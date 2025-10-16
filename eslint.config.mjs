import antfu from '@antfu/eslint-config'

export default antfu({
  // Enable auto-detection of frameworks
  vue: true,
  typescript: true,

  // Formatting preferences
  stylistic: {
    indent: 2,
    quotes: 'single',
    semi: false,
  },

  // File patterns to ignore
  ignores: [
    'dist',
    'node_modules',
    '.output',
    '.nuxt',
    '.nitro',
    'coverage',
    '*.min.*',
    'CHANGELOG.md',
    'LICENSE*',
    'public',
    'prisma/migrations',
    // Ignore markdown files to prevent parsing errors
    '**/*.md',
    // Ignore debug and utility scripts
    'debug-*.mjs',
    'test-*.mjs',
    'simple-*.mjs',
    '*.js',
  ],
}, {
  // Project-specific rule overrides
  rules: {
    // Console usage
    'no-console': 'warn',

    // Vue component naming
    'vue/multi-word-component-names': 'off',
    'vue/require-default-prop': 'off',

    // TypeScript preferences
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
    }],
    '@typescript-eslint/no-explicit-any': 'warn',

    // Allow unused expressions (useful for composables)
    '@typescript-eslint/no-unused-expressions': 'off',

    // Stylistic preferences
    'curly': ['error', 'multi-line', 'consistent'],

    // Disable conflicting import sorting rules to prevent circular fixes
    // Let antfu config handle import sorting with its built-in rules
    'sort-imports': 'off',

    // Relax some strict rules that cause too many errors
    'style/max-statements-per-line': 'off',
    'no-alert': 'warn',
    'no-useless-catch': 'warn',
  },
}, {
  // Test file overrides
  files: ['**/*.test.{js,ts,vue}', '**/*.spec.{js,ts,vue}', 'tests/**/*'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'no-console': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    'no-restricted-globals': 'off',
    'test/prefer-hooks-in-order': 'off',
    'unused-imports/no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    'node/prefer-global/process': 'off',
  },
}, {
  // Server-side overrides
  files: ['server/**/*.{js,ts}', 'prisma/**/*.{js,ts}'],
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
  },
}, {
  // Configuration files
  files: ['*.config.{js,ts,mjs}', '*.setup.{js,ts}'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'node/prefer-global/process': 'off',
  },
}, {
  // Debug and utility files
  files: ['debug-*.mjs', 'test-*.mjs', 'simple-*.mjs', '*.js'],
  rules: {
    'no-console': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'unused-imports/no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
  },
})
