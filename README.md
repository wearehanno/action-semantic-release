# action-semantic-release

Runs the Semantic Release process for a GitHub repository with opinionated defaults. See `release-config.js` for the list of plugins used.

## Usage

In your `workflow.yml`, add the following step:

```
- name: Release action
  uses: @wearehanno/action-semantic-release
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Inputs:

- `branches` (default: `main`)
  The branches from which to run this action
