module.exports = {
  extends: ['./release.js'],
  plugins: [
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
        tarballDir: 'pack',
      },
    ],
  ],
};
