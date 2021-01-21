module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'docs/CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: [{ path: 'pack/*.tgz', label: 'Release' }],
      },
    ],
    [
      '@semantic-release/npm',
      {
        npmPublish: false,
        tarballDir: 'pack',
      },
    ],
  ],
};
