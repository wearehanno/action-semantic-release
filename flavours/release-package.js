module.exports = {
  branches: ["main"],
  plugins: [
    [
      "@semantic-release/commit-analyzer",
      {
        config: "conventional-changelog-conventionalcommits",
        releaseRules: [
          {
            type: "build",
            release: "patch",
          },
        ],
      },
    ],
    [
      "@semantic-release/release-notes-generator",
      { config: "conventional-changelog-conventionalcommits" },
    ],
    [
      "@semantic-release/changelog",
      {
        changelogFile: "docs/CHANGELOG.md",
      },
    ],
    [
      "@semantic-release/github",
      {
        assets: [{ path: "pack/*.tgz", label: "Release" }],
      },
    ],
    [
      "@semantic-release/npm",
      {
        tarballDir: "pack",
      },
    ],
  ],
};
