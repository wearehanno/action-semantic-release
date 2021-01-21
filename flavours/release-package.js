module.exports = {
  extends: ['./release.js'],
  plugins: [
    [
      '@semantic-release/npm',
      {
        tarballDir: 'pack',
      },
    ],
  ],
};
