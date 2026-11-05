// Per-address view of the v1 cleaning rules for the Results list.

/** Why an address ended up where it did. */
export type EntryStatus = "kept" | "duplicate" | "manual" | "invalid";

/** One row in the Results list. */
export interface ListEntry {
    email: string;
    status: EntryStatus;
}

/** The v1 rules: always remove duplicates, plus manual removals. */
export interface ExplainOptions {
    manuallyRemoved: ReadonlySet<string>;
}

/** Labels every found address, in the original order. */
export function explainList(found: readonly string[], options: ExplainOptions): ListEntry[] {
    const seen = new Set<string>();
    const entries: ListEntry[] = [];
    for (const email of found) {
        if (seen.has(email)) {
            entries.push({ email, status: "duplicate" });
            continue;
        }
        seen.add(email);
        if (options.manuallyRemoved.has(email)) entries.push({ email, status: "manual" });
        else entries.push({ email, status: "kept" });
    }
    return entries;
}
