
# Changesets Check Action (Forked Version)

The **Changesets Check Action** comments on pull requests to indicate whether a changeset is included and provides a link to documentation for creating a changeset. Originally archived in favor of the [Changeset bot](https://github.com/apps/changeset-bot), this action has been forked to address use cases where the bot may not work well, such as in repositories with selective package publishing needs.

## Why Use This Fork?

The original `check-action` was archived because it didn't work well with forked pull requests, and its [README](https://github.com/changesets/check-action?tab=readme-ov-file#please-use-httpsgithubcomappschangeset-bot-instead-of-this-because-this-doesnt-work-on-forked-prs) suggested using the [Changeset bot](https://github.com/apps/changeset-bot) instead. However, this bot is not ideal for certain workflows:
- **Selective package publishing**: In monorepos where only certain packages are publishable, the bot comments on every pull request, which may not be necessary.
- **Conditional checks**: This action allows you to conditionally check for changesets, which helps reduce comment noise by only running the check when relevant packages are modified.

For more information on these issues, see the related discussions in the Changeset bot repository:
- [Changeset Bot Issue #39](https://github.com/changesets/bot/issues/39)
- [Changeset Bot Issue #11](https://github.com/changesets/bot/issues/11)

This fork restores and **upgrades** the utility of the `check-action` for use cases that need more granular control over changeset checking and commenting.

## Improvements in This Fork

This fork not only restores functionality but also modernizes and improves the action to work more effectively with updated environments:

- **Upgraded Node version**: Moved from Node v12 to v20 for better performance and support.
- **Simplified build process**: Replaced `parcel` with `tsc` and `ncc`, which are now used for builds.
- **Dependency cleanup**: Removed unused dependencies and updated the remaining ones.
- **Code adjustments**: Fixed `index.ts` to be compatible with updated libraries.
- **Added `.nvmrc`**: Specifies the Node version for consistency across environments.

These updates ensure the action is compatible with modern tooling and workflows, making it more efficient and easier to maintain.

## Usage

To use this action, create a file at `.github/workflows/changeset-check.yml` with the following content:

```yml
name: Changeset Check

on: pull_request

jobs:
  check:
    name: Changeset Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Comment on PR if Changeset is Missing
        uses: <gromaco>/check-action@main
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Customizing the Workflow

You can further customize this action to:
- **Only comment on PRs that modify certain packages**: Use a conditional check to determine if the PR affects a publishable package, and only run this action when necessary.
- **Control when comments are added**: Avoid repetitive comments on each commit by updating or replacing existing comments, reducing notification noise.

## Differences from Changeset Bot

Unlike the Changeset bot, which comments on every pull request regardless of context, this action allows for conditional checks and minimizes unnecessary comments. This is particularly useful in monorepos with a mix of public and private packages, where only specific changes should trigger a release.

## Requirements

This action requires a GitHub token to authenticate and comment on pull requests. The token is provided through the `GITHUB_TOKEN` environment variable, which should be added as a secret in your repository.

## Contributing

If you encounter issues or have suggestions for improving this action, feel free to open an issue or contribute to this fork.
