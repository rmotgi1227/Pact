// goal A3 (Aryan). The booking-site repo on GitHub, outbound only. See build-plan.md, Phase D.
import { Octokit } from '@octokit/rest';

let kit: Octokit | undefined;
const octokit = () => (kit ??= new Octokit({ auth: process.env.GITHUB_TOKEN }));
export const repo = () => {
  const [owner, name] = (process.env.BOOKING_REPO_SLUG ?? '').split('/');
  if (!owner || !name) throw new Error('set BOOKING_REPO_SLUG=owner/name');
  return { owner, repo: name };
};

// OpenShell's proxy rejects an encoded '/' (%2F) anywhere in a request target, and Octokit encodes the '/' in
// refs ("heads/main"), file paths ("specs/...") and branch names ("pact/specs-..."). Routes that carry those
// put them in literally: every character encoded except '/'.
const slashy = (s: string) => encodeURIComponent(s).replace(/%2F/gi, '/');

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
    const open = await octokit().request(`GET /repos/{owner}/{repo}/pulls?state=open&head=${slashy(`${r.owner}:${branch}`)}`, r);
    if (open.data[0]) return open.data[0].number as number;
    const { data: main } = await octokit().request('GET /repos/{owner}/{repo}/git/ref/heads/main', r);
    await o.git.createRef({ ...r, ref: `refs/heads/${branch}`, sha: main.object.sha }).catch((e) => { if (e.status !== 422) throw e; });
    for (const f of files) {
      const sha = await octokit().request(`GET /repos/{owner}/{repo}/contents/${slashy(f.path)}?ref=${slashy(branch)}`, r)
        .then(({ data }) => ('sha' in data ? data.sha as string : undefined), () => undefined);
      await octokit().request(`PUT /repos/{owner}/{repo}/contents/${slashy(f.path)}`, { ...r, branch, message: `Add ${f.path}`,
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
  // A tested prototype gets its own new repo under the token's account: one commit with the whole source.
  // Through the API (api.github.com), so it works from inside the sandbox, where git can't reach github.com.
  async publishRepo(name: string, files: { path: string; content: string }[], description: string) {
    const o = octokit().rest;
    const { data: me } = await o.users.getAuthenticated();
    const r = { owner: me.login, repo: name };
    // auto_init: the git data API refuses an empty repo, so start from GitHub's initial commit and replace its tree.
    await o.repos.createForAuthenticatedUser({ name, description, private: true, auto_init: true })
      .catch((e) => { if (e.status !== 422) throw e; }); // 422 = already exists (a re-run): publish over it
    let head: string | undefined;
    for (let i = 0; i < 30 && !head; i++) { // a brand-new repo's initial commit can take 10+ s to appear
      head = await octokit().request('GET /repos/{owner}/{repo}/git/ref/heads/main', r)
        .then(({ data }) => data.object.sha as string, () => undefined);
      if (!head) await new Promise((res) => setTimeout(res, 2000));
    }
    if (!head) throw new Error(`${name}: main never appeared`);
    const { data: tree } = await o.git.createTree({ ...r,
      tree: files.map((f) => ({ path: f.path, mode: '100644' as const, type: 'blob' as const, content: f.content })) });
    const { data: commit } = await o.git.createCommit({ ...r, message: description, tree: tree.sha, parents: [head] });
    await octokit().request('PATCH /repos/{owner}/{repo}/git/refs/heads/main', { ...r, sha: commit.sha, force: true });
    return `https://github.com/${me.login}/${name}`;
  },
  async listMergedPrs(perPage = 20) {
    const { data } = await octokit().rest.pulls.list({ ...repo(), state: 'closed', sort: 'updated', direction: 'desc', per_page: perPage });
    return data.filter((pr) => pr.merged_at).map((pr) => ({ number: pr.number, sha: pr.merge_commit_sha!, author: pr.user?.login ?? 'unknown' }));
  },
};
