"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
// @ts-ignore
const human_id_1 = __importDefault(require("human-id"));
const changesetActionSignature = `<!-- changeset-check-action-signature -->`;
let addChangesetUrl = `${github.context.payload.pull_request.head.repo.html_url}/new/${github.context.payload.pull_request.head.ref}?filename=.changeset/${(0, human_id_1.default)({
    separator: "-",
    capitalize: false
})}.md`;
function getAbsentMessage(commitSha) {
    return `###  💥  No Changeset
Latest commit: ${commitSha}

Merging this PR will not cause any packages to be released. If these changes should not cause updates to packages in this repo, this is fine 🙂

**If these changes should be published to npm, you need to add a changeset.**

[Click here to learn what changesets are, and how to add one](https://github.com/Noviny/changesets/blob/master/docs/adding-a-changeset.md).

[Click here if you're a maintainer who wants to add a changeset to this PR](${addChangesetUrl})
${changesetActionSignature}`;
}
function getApproveMessage(commitSha) {
    return `###  🦋  Changeset is good to go
Latest commit: ${commitSha}

**We got this.**

Not sure what this means? [Click here to learn what changesets are](https://github.com/Noviny/changesets/blob/master/docs/adding-a-changeset.md).
${changesetActionSignature}`;
}
const getCommentId = (octokit, params) => octokit.rest.issues.listComments(params).then(comments => {
    const changesetBotComment = comments.data.find(comment => comment.body?.includes(changesetActionSignature));
    return changesetBotComment ? changesetBotComment.id : null;
});
const getHasChangeset = (octokit, params) => octokit.rest.pulls.listFiles(params).then(files => {
    const changesetFiles = files.data.filter(file => file.filename.startsWith(".changeset") && file.status === "added");
    return changesetFiles.length > 0;
});
(async () => {
    let githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
        core.setFailed("Please add the GITHUB_TOKEN to the changesets action");
        return;
    }
    let repo = `${github.context.repo.owner}/${github.context.repo.repo}`;
    const octokit = github.getOctokit(githubToken);
    console.log(JSON.stringify(github.context.payload, null, 2));
    const [commentId, hasChangeset] = await Promise.all([
        getCommentId(octokit, {
            issue_number: github.context.payload.pull_request.number,
            ...github.context.repo
        }),
        getHasChangeset(octokit, {
            pull_number: github.context.payload.pull_request.number,
            ...github.context.repo
        })
    ]);
    let message = hasChangeset
        ? getApproveMessage(github.context.sha)
        : getAbsentMessage(github.context.sha);
    if (commentId) {
        return octokit.rest.issues.updateComment({
            comment_id: commentId,
            body: message,
            ...github.context.repo
        });
    }
    return octokit.rest.issues.createComment({
        ...github.context.repo,
        issue_number: github.context.payload.pull_request.number,
        body: message
    });
})().catch(err => {
    console.error(err);
    core.setFailed(err.message);
});
