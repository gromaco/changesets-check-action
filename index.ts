import * as core from "@actions/core";
import * as github from "@actions/github";
// @ts-ignore
import humanId from "human-id";

import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';
type IssuesListCommentsParams = RestEndpointMethodTypes['issues']['listComments']['parameters'];
type PullsListFilesParams = RestEndpointMethodTypes['pulls']['listFiles']['parameters'];
type Octokit = ReturnType<typeof github.getOctokit>;

const changesetActionSignature = `<!-- changeset-check-action-signature -->`;

let addChangesetUrl = `${
  github.context.payload.pull_request!.head.repo.html_url
}/new/${
  github.context.payload.pull_request!.head.ref
}?filename=.changeset/${humanId({
  separator: "-",
  capitalize: false
})}.md`;

function getAbsentMessage(commitSha: string) {
  return `### ⚠️  Missing Changeset
Latest commit: ${commitSha}

This PR does not currently include a changeset. **Without a changeset, this change will not be documented** and won't appear in the changelog.

If this omission is intentional (e.g., for internal or non-public updates), no further action is needed.

**If these changes are meant to be recorded in the changelog, please add a changeset.**

- [What is a changeset, and how do I add one?](https://github.com/Noviny/changesets/blob/master/docs/adding-a-changeset.md)
- [Maintainers: add a changeset for this PR](${addChangesetUrl})

${changesetActionSignature}`;
}
function getApproveMessage(commitSha: string) {
  return `### 🦋✅  Changeset Detected
Latest commit: ${commitSha}

All set! This PR includes a changeset, so it’s ready for merging and releasing. 

Want to know more about changesets? [Learn more here.](https://github.com/Noviny/changesets/blob/master/docs/adding-a-changeset.md)

${changesetActionSignature}`;
}

const getCommentId = (
  octokit: Octokit,
  params: IssuesListCommentsParams
) =>
  octokit.rest.issues.listComments(params).then(comments => {
    const changesetBotComment = comments.data.find(comment =>
      comment.body?.includes(changesetActionSignature)
    );
    return changesetBotComment ? changesetBotComment.id : null;
  });

const getHasChangeset = (
  octokit: Octokit,
  params: PullsListFilesParams
) =>
  octokit.rest.pulls.listFiles(params).then(files => {
    const changesetFiles = files.data.filter(
      file => file.filename.startsWith(".changeset") && file.status === "added"
    );
    return changesetFiles.length > 0;
  });

(async () => {
  let githubToken = process.env.GITHUB_TOKEN;

  if (!githubToken) {
    core.setFailed("Please add the GITHUB_TOKEN to the changesets action");
    return;
  }


  const octokit = github.getOctokit(githubToken);
  console.log(JSON.stringify(github.context.payload, null, 2));

  const pullRequest = github.context.payload.pull_request;

  if (!pullRequest) {
    core.setFailed("This action only works on pull_request events.");
    return;
  }

  const latestCommitSha = pullRequest.head.sha;

  const [commentId, hasChangeset] = await Promise.all([
    getCommentId(octokit, {
      issue_number: github.context.payload.pull_request!.number,
      ...github.context.repo
    }),
    getHasChangeset(octokit, {
      pull_number: github.context.payload.pull_request!.number,
      ...github.context.repo
    })
  ]);

  let message = hasChangeset
    ? getApproveMessage(latestCommitSha)
    : getAbsentMessage(latestCommitSha);

  if (commentId) {
    return octokit.rest.issues.updateComment({
      comment_id: commentId,
      body: message,
      ...github.context.repo
    });
  }
  return octokit.rest.issues.createComment({
    ...github.context.repo,
    issue_number: github.context.payload.pull_request!.number,
    body: message
  });
})().catch(err => {
  console.error(err);
  core.setFailed(err.message);
});
