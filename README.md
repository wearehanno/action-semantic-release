# action-semantic-release

This is a simple but opinionated helper Action used on Hanno's GitHub projects to quickly produce a new Release via [semantic release](https://github.com/semantic-release/semantic-release).

Performing this process via this self-contained GitHub Action means that we can ensure a consistent workflow across multiple projects, without needing to include the semantic-release dependencies and config files each time.

Since this is designed for Hanno's needs, **we don't recommend using this Action directly on your own projects**, as it may be subject to breaking changes. We suggest that you fork or duplicating this code and modify to suit your own purposes.

## Overview

### Release philosophy

We adopt the [Conventional Commits specification](https://www.conventionalcommits.org/en/v1.0.0/#summary) for git commit messages on our projects. We also set the [squash and merge option for pull request commits](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-request-merges#squash-and-merge-your-pull-request-commits). Here's an example of what the first line of the commit message would look like for a merged PR:

```
feat(android): add search functionality (#1)
```

As well as making it easier to follow the project's history, this methodology also allows us to automatically determine versioning and releases for the project.

We trigger this Action to run for each push to the default branch of our repository, to analyse the branch and look for releasable commits.

### What is a releasable commit?

A releasable commit is one with a `feat:`, `fix:` or `build:` prefix.

If other commit types (e.g. `style:`, `docs:`, `refactor:`) are present, these will be included in the next release, but will _not_ trigger a release by themselves. This helps to cut down on noise.

So if the last release was `v1.1.2`, and 5 `fix:` commits have since been added, the next release would bump by 5 patches to `v1.1.7`.

The semver is applied as follows:

| Message                                                                                                                                                                     | Type             | Change            |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ----------------- |
| fix: stop graphite breaking when too much pressure applied                                                                                                                  | Patch            | `1.0.0` → `1.0.1` |
| feat: add 'graphiteWidth' option                                                                                                                                            | Minor            | `1.0.0` → `1.1.0` |
| feat: remove graphiteWidth option<br>BREAKING CHANGE: The graphiteWidth option has been removed. The default graphite width of 10mm is always used for performance reasons. | Major (Breaking) | `1.0.0` → `2.0.0` |

### What happens when releasable commit(s) are found

If any are found, we automatically:

1. Calculate the next [semantic version](https://semver.org) number.
2. Update the `package.json` with the version and generate a `CHANGELOG.md` file.
3. Publish the GitHub release (and optionally, create and publish a Package tarball to GitHub or NPMjs, etc).
4. Add a git tag for the version number and push this to the main branch.
5. Optionally, commit the `package.json` and `CHANGELOG.md` to the repository.

## Configuration

### `flavour`

We support 3 different release flavours:

- `release` - bump the version number, publish a simple GitHub Release, push the new version tag to the current branch.
- `release-commit` - as in `release`, but with an additional commit pushed to the current branch with the new version number in the the `package.json` and the updated `docs/CHANGELOG.md`.
- `release-package` - as in `release`, but also with a GitHub or NPM **Package** tarball.

See _Examples_ below for detailed implementation instructions.

### `branches`

By default, the release process will be locked to run only on your `main` branch. This can be overriden via the `branches` parameter:

```
- name: Custom Release
  uses: wearehanno/action-semantic-release@main
  with:
    branches: custom-branch-name
```

### `semantic_release_version`

This controls the version of semantic-release to use within the action. We suggest that you don't use this parameter, as it may cause conflicts with some of the other sub-dependencies that are used.

## Examples

### `release` - GitHub Release only

The simplest possible release type: a bumped version number applied with a git tag and visible in the Releases tab on GitHub for your repository. There is no "build and tarball process" applied here, so this option is usually only desirable for GitHub Actions, which don't actually need to be _consumed_ in another project as a versioned package. For most other dependency types, you'll want to choose one of the alternative configurations below.

In your `.github/workflows/main.yml` (or similar):

```
main_release:
  if: github.ref == 'refs/heads/main'
  needs: main_test
  runs-on: ubuntu-latest
  steps:
    ... your setup steps here

    - name: "GitHub Release"
      uses: wearehanno/action-semantic-release@main
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }} # Required for publishing GitHub *Release*
```

The [`GITHUB_TOKEN`](https://docs.github.com/en/actions/reference/authentication-in-a-workflow#about-the-github_token-secret) is automatically created by GitHub and available to all workflows for authentication. So you do not need to add this to your repository secrets.

### `release-commit` - GitHub Release + separate commit to your default branch

If you have branch protection enabled for your default branch, the setup here is a little more involved since we need to ensure that `semantic-release` is able to commit to your default branch, due to an [issue with semantic-release](https://github.com/semantic-release/git/issues/196#issuecomment-702839100). First, you'll need to:

1. Generate a GitHub [personal access token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) (PAT) with `repo` permissions (all permissions on the repository) for an **administrator** on your repository. We suggest creating a machine user for this purpose.
2. Add this PAT to your repository as a [encrypted secret](https://docs.github.com/en/actions/reference/encrypted-secrets).
3. Make sure that in the repository **Settings > Branch protection rules > `main`**, the "Include administrators" option is **not checked**.

We then use this secret as part of the `checkout` step:

```
main_release:
  # To prevent the release from happening unless we are on the main branch; and also if the triggering commit was from semantic-release already
  if: github.ref == 'refs/heads/main' && !startsWith(github.event.head_commit.message, 'chore(release):')
  needs: main_test
  runs-on: ubuntu-latest
  steps:
    - name: Checkout
      uses: actions/checkout@v2
      with:
        token: ${{ secrets.PAT_TOKEN_HERE }}

    ... your setup steps here

    - name: "GitHub Release + git commit"
      uses: wearehanno/action-semantic-release@main
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        flavour: release-commit
```

### `release-package`

In addition to creating and tagging a Release, the `release-package` flavour also creates a tarball package, which contains:

- the contents of the `"files": []` definition in `package.json`.
- the `package.json` (with the updated version number).
- the `./docs/CHANGELOG.md`.

Unlike with the `release-commit` flavour, the repository itself will be left untouched, so you will not be able to determine the version number from your repository source code.

At present, GitHub Packages [requires you to authenticate with a token](https://docs.github.com/en/packages/guides/configuring-npm-for-use-with-github-packages#installing-a-package) in order to download a Package, even if this Package was created in a public GitHub repository. So if you need the package to be public, you will want to use the NPMjs example below, to publish to an external registry.

#### GitHub Package (Private)

In your `.github/workflows/main.yml` (or similar):

```
main_release:
  ...

  steps:
    ... your setup steps here

    - name: "GitHub Release + GitHub Package"
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

#### NPMjs Package (Private or Public)

In your `.github/workflows/main.yml` (or similar):

```
main_release:
  ...

  steps:
    ... your setup steps here

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
