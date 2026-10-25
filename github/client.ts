// goal A3 (Aryan). Real implementation uses @octokit/rest against the booking-site repo.
// Honest stub: correct shape, no fake results. See build-plan.md, Phase D.
const notBuilt = (): never => { throw new Error('not built yet: goal A3 (Aryan)'); };

export const github = {
  async getPr(_prNumber: number): Promise<{ prNumber: number; author: string; linkedIssues: number[]; mergeCommitSha: string | null }> {
    return notBuilt();
  },
  async getDiff(_prNumber: number): Promise<string> { return notBuilt(); },
  async createIssue(_title: string, _body: string): Promise<number> { return notBuilt(); },
  async openPrWithFiles(_branch: string, _files: { path: string; content: string }[], _title: string, _body: string): Promise<number> {
    return notBuilt();
  },
  async comment(_prNumber: number, _body: string): Promise<void> { return notBuilt(); },
  // Used for the engineering baseline build (kind 'main') and by triage-ticket.
  async getHeadSha(_branch: string): Promise<string> { return notBuilt(); },
  // Used by the `merge-regression` demo action.
  async mergePr(_prNumber: number): Promise<void> { return notBuilt(); },
};
