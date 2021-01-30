# action-semantic-release

This is a highly opinionated helper Action used on Hanno projects to quickly produce a new [`semantic-release`](https://github.com/semantic-release/semantic-release) of a dependency using our favoured workflow and configurations. Hosting this as an Action means that we don't need to include a semantic release configuration on every project.

**We don't recommend using this Action on non-Hanno projects, as it may not remain available indefinitely**.

## Introduction

We adopt the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/#summary) for git commit messages on Hanno projects. Here's an example of what a merged PR would look like in the git log:

```
feat(android): add search functionality (#1)
```

As well as making it easier to follow the git history, this methodology also allows us to automatically determine when a new version and release should be generated.

We run this Action on most of our projects after a PR has been merged and analyse the `main` branch to look for releasable commits. If any are found, we automatically:

1. Calculate the next [semantic version](https://semver.org) number
2. Generate a `docs/CHANGELOG.md` file
3. Publish the release (and package, where requested).
4. Apply a git tag with the corresponding version number.

For context on what constitutes a "releasable commit":

A releasable commit is one with a `feat:`, `fix:` or `build:` prefix. If other commit types (e.g. `style:`, `docs:`, `refactor:`) are present, these will be included in the next release, but will _not_ trigger a release by themselves. This helps to cut down on noise.

So if the last release was `v1.1.2`, and 5 `fix:` commits have been added since then, the next release would bump by 5 patches, to `v1.1.7`.

The semver is applied as follows:

| Message                                                                                                                                                                     | Type             | Change         |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | -------------- |
| fix: stop graphite breaking when too much pressure applied                                                                                                                  | Patch            | 1.0.0 => 1.0.1 |
| feat: add 'graphiteWidth' option                                                                                                                                            | Minor            | 1.0.0 => 1.1.0 |
| feat: remove graphiteWidth option<br>BREAKING CHANGE: The graphiteWidth option has been removed. The default graphite width of 10mm is always used for performance reasons. | Major (Breaking) | 1.0.0 => 2.0.0 |

## Configuration

### Release flavour

We support 3 different `flavour` types for releases:

|     | **Option**                                                        | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| --- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **GitHub Release** (`release`)                                    | The simplest possible release type on GitHub: a bumped version number applied with a git tag and visible in the Releases tab on GitHub for your repository. There is no "build process" applied here, so this option is usually only desirable for GitHub Actions, which don't actually need to be _consumed_ in another project as a versioned package. For most other dependency types, you'll want to choose one of the alternative configurations below.  |
| 2   | **GitHub Release + (Private) GitHub Package** (`release-package`) | Use this method when you need to produce a private versioned dependency for use on a specific project. At present, GitHub Packages [requires you to authenticate with a token](https://docs.github.com/en/packages/guides/configuring-npm-for-use-with-github-packages#installing-a-package) in order to download a package (even if you're creating the package in a public repository), so if you need to make use of a public Package, see option 3 below. |
| 3   | **GitHub Release + (Public) NPM package** (`release-package`)     | Applies the same approach as option 2, but publishes to an external registry like as npmjs.com, and supports publishing as a public package. We use this for global tooling and open source dependencies.                                                                                                                                                                                                                                                     |

See below for the changes you'll need to make to your consuming project to select apply one of these configuration types.

#### Option 1: GitHub Release (`release`)

In your `.github/workflows/main.yml` (or similar):

```
- name: Release
  uses: wearehanno/action-semantic-release@main
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # Required for publishing GitHub *Release*
```

The [`GITHUB_TOKEN`](https://docs.github.com/en/actions/reference/authentication-in-a-workflow#about-the-github_token-secret) is automatically created by GitHub and available to all workflows for authentication. So you do not need to add this to your repository secrets.

#### Option 2: GitHub Release + (Private) GitHub Package (`release-package`)

In addition to tagging a release, the `release-package` also creates a tarball package, which contains:

- the contents of the `"files": []` definition in `package.json` (see below)
- the `package.json` (with the updated version number)
- a `Changelog.md` inside `./docs`

In your `.github/workflows/main.yml` (or similar):

```
- name: Release
  uses: wearehanno/action-semantic-release@main
  with:
    flavour: release-package
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # Required for publishing GitHub *Release*
    NPM_TOKEN: ${{ secrets.GITHUB_TOKEN }} # Required for publishing a GitHub *Package*
```

In your `package.json`:

```
{
  ...
  "name: "@yourorg/project-name-here", // Must match your GitHub organisation and repository name
  "files": [
    "/dist",
    "/docs"
  ],
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

#### Option 3: GitHub Release + (Public) NPM package (`release-package`)

In your `.github/workflows/main.yml` (or similar):

```
- name: Release
  uses: wearehanno/action-semantic-release@main
  with:
    flavour: release-package
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # Required for publishing GitHub *Release*
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }} # Required for publishing a NPM *Package*
```

When publishing to an external registry like `npmjs.com`, you'll need to [create a dedicated access token](https://docs.npmjs.com/creating-and-viewing-access-tokens) with "Automation" type, and publishing permissions. You'll then need to add this as an [encrypted secret](https://docs.github.com/en/actions/reference/encrypted-secrets) called `NPM_TOKEN` on your GitHub repository. **Take care when using secrets in a public repository: when handled incorrectly, they may become publicly visible**.

In your `package.json`:

```
{
  ...
  "name: "@yourorg/project-name-here"
  "files": [
    "/dist",
    "/docs"
  ],
  "publishConfig": {
    "registry": "https://registry.npmjs.org/", // Or whichever external registry you wish to publish to
    "access": "public"
  }
}
```

### Branch to run on

We default to running the release on your `main` branch, but this can be customised using the `branches` option:

```
- name: Release
  uses: wearehanno/action-semantic-release@main
  with:
    branches: custom-branch-name
```
