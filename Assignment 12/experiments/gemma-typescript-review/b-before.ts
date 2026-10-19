export type Record = { id: string; savedAt: number };

export function retainRecent(records: Record[], limit: number): Record[] {
  return [...records].sort((a, b) => b.savedAt - a.savedAt).slice(0, limit);
}
