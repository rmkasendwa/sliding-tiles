module.exports = {
  plugins: ['@typescript-eslint/eslint-plugin', 'sort-keys-fix'],
  extends: ['react-app', 'react-app/jest', 'prettier'],
  ignorePatterns: ['.eslintrc.js'],
};
