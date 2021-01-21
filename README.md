# action-semantic-release

This is a highly opinionated helper action used on Hanno projects to quickly produce a new versioned release, adopting our standard format via [`semantic-release`](https://github.com/semantic-release/semantic-release). You might find this an interesting reference, but you probably want to develop your own release preferences on your own projects.

## Concept

We adopt the [AngularJS commit message conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines) on our projects, so commit messages contain helpful context for every PR that gets merged:

```
feat(android): add search functionality (#1)
```

This allows us to automatically determine when a new version should be generated on a project and publish this automatically, along with the corresponding release notes.

When this action is run on a repository, it will analyse the `main` branch:

- If there is at least 1 new commit with a `feat:`, `fix:` or `perf:` prefix, a new release will be triggered.
- If other commit types (e.g. `style:`, `docs:` and `refactor:`) are present, these will be included in the release, but will _not_ trigger a release by themselves.

The new version number is then written to the `package.json` and a tarball is created, containing:

- the contents of the `"files": []` definition in `package.json` (see below)
- the `package.json` itself (with correct version number)

This is uploaded to GitHub as both a new **Release** and also a **GitHub Package**. A new Git tag is created to represent the updated version number and applied to the latest commit on the branch. Note that the new version and changelog are _not_ committed to the codebase itself, but do appear in the tarballed GitHub Package.

**Publishing to the NPM registry is disabled in this configuration.** Any repository using this action to publish packages will have to instruct their users outside their organisation to follow the [installation instruction for GitHub Packages](https://docs.github.com/en/packages/guides/configuring-npm-for-use-with-github-packages#installing-a-package).

## Usage

To make use of the action on a Hanno project, you'll want to make the following changes to your source project:

### Adjust your `package.json` configuration

Optional: If you want to produce a package (to GitHub Packages) as part of the release, you may also wish to customise which [files](https://docs.npmjs.com/cli/v6/configuring-npm/package-json#files) to include in the package:

```
{
  ...
  "files": [
    "/dist",
    "/docs"
  ]
}
```

Add the following to publish the package on GitHub instead of npm:

```
{
  ...
  "publishConfig": {
    "registry":"https://npm.pkg.github.com"
  }
  ...
}
```

### Customise your workflow

In your `.github/workflow.yml`, add the following step:

```
- name: Release
  uses: @wearehanno/action-semantic-release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

Inputs:

- `branches` (default: `main`)
  The branches from which to run this action
