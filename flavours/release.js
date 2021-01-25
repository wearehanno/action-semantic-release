module.exports = {
  branches: ['main'],
  plugins: [
    [
      '@semantic-release/commit-analyzer',
      {
        preset: 'conventionalcommit',
        presetConfig: {
          types: {
            type: 'build',
            release: 'minor',
          },
        },
      },
    ],
    [
      '@semantic-release/release-notes-generator',
      { preset: 'conventionalcommit' },
    ],
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
  ],
};
