// goal A3 (Aryan). The booking-site repo on GitHub, outbound only. See build-plan.md, Phase D.
import { Octokit } from '@octokit/rest';

let kit: Octokit | undefined;
const octokit = () => (kit ??= new Octokit({ auth: process.env.GITHUB_TOKEN }));
export const repo = () => {
  const [owner, name] = (process.env.BOOKING_REPO_SLUG ?? '').split('/');
  if (!owner || !name) throw new Error('set BOOKING_REPO_SLUG=owner/name');
  return { owner, repo: name };
};

export const github = {
  async getPr(prNumber: number) {
    const { data: pr } = await octokit().rest.pulls.get({ ...repo(), pull_number: prNumber });
    const linkedIssues = [...(pr.body ?? '').matchAll(/(?:fix(?:es|ed)?|close[sd]?|resolve[sd]?)\s+#(\d+)/gi)].map((m) => Number(m[1]));
    return { prNumber, author: pr.user?.login ?? 'unknown', linkedIssues, mergeCommitSha: pr.merge_commit_sha };
  },
  async getDiff(prNumber: number): Promise<string> {
    const { data } = await octokit().rest.pulls.get({ ...repo(), pull_number: prNumber, mediaType: { format: 'diff' } });
    return data as unknown as string;
  },
  async createIssue(title: string, body: string) {
    const { data } = await octokit().rest.issues.create({ ...repo(), title, body });
    return data.number;
  },
  // One commit per file on a fresh branch off main, then a PR. Re-running for the same branch reuses it.
  async openPrWithFiles(branch: string, files: { path: string; content: string }[], title: string, body: string) {
    const r = repo(), o = octokit().rest;
    const open = await o.pulls.list({ ...r, head: `${r.owner}:${branch}`, state: 'open' });
    if (open.data[0]) return open.data[0].number;
    const { data: main } = await o.git.getRef({ ...r, ref: 'heads/main' });
    await o.git.createRef({ ...r, ref: `refs/heads/${branch}`, sha: main.object.sha }).catch((e) => { if (e.status !== 422) throw e; });
    for (const f of files) {
      const sha = await o.repos.getContent({ ...r, path: f.path, ref: branch })
        .then(({ data }) => ('sha' in data ? data.sha : undefined), () => undefined);
      await o.repos.createOrUpdateFileContents({ ...r, path: f.path, branch, message: `Add ${f.path}`,
        content: Buffer.from(f.content).toString('base64'), sha });
    }
    const { data: pr } = await o.pulls.create({ ...r, title, body, head: branch, base: 'main' });
    return pr.number;
  },
  async comment(prNumber: number, body: string) {
    await octokit().rest.issues.createComment({ ...repo(), issue_number: prNumber, body });
  },
  // Used for the engineering baseline build (kind 'main') and by triage-ticket.
  async getHeadSha(branch: string) {
    const { data } = await octokit().rest.repos.getBranch({ ...repo(), branch });
    return data.commit.sha;
  },
  // Used by the `merge-regression` demo action.
  async mergePr(prNumber: number) {
    // Right after another merge, GitHub reports mergeable=null while it recomputes, and the merge call is
    // refused. Wait for it to settle first (fix from Rishab's e2e run; Aryan owns this file).
    for (let i = 0; i < 20; i++) {
      const { data } = await octokit().rest.pulls.get({ ...repo(), pull_number: prNumber });
      if (data.merged) return;
      if (data.mergeable !== null) break;
      await new Promise((r) => setTimeout(r, 1500));
    }
    await octokit().rest.pulls.merge({ ...repo(), pull_number: prNumber });
  },
  async listMergedPrs(perPage = 20) {
    const { data } = await octokit().rest.pulls.list({ ...repo(), state: 'closed', sort: 'updated', direction: 'desc', per_page: perPage });
    return data.filter((pr) => pr.merged_at).map((pr) => ({ number: pr.number, sha: pr.merge_commit_sha!, author: pr.user?.login ?? 'unknown' }));
  },
};
