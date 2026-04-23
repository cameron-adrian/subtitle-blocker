module.exports = {
  ignoreFiles: [
    'package.json',
    'package-lock.json',
    'web-ext-config.cjs',
    'node_modules',
    'web-ext-artifacts',
    'README.md',
    'CLAUDE.md',
    '.gitignore',
    '.git',
  ],
  build: {
    overwriteDest: true,
  },
};
