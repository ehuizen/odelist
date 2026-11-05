// Removes duplicate addresses and reports which ones were repeated, for the "Hang on, N duplicates!" screen.

/** An address that appeared more than once. */
export interface RepeatedEmail {
    email: string;
    copies: number;
}

/** Result of {@link dedupe}. */
export interface DedupeResult {
    unique: string[];
    duplicateCount: number;
    repeated: RepeatedEmail[];
}

/** Removes duplicate addresses, keeping the first copy of each. */
export function dedupe(emails: readonly string[]): DedupeResult {
    const counts = new Map<string, number>();
    for (const email of emails) counts.set(email, (counts.get(email) ?? 0) + 1);

    const repeated: RepeatedEmail[] = [];
    for (const [email, copies] of counts) if (copies > 1) repeated.push({ email, copies });
    repeated.sort((a, b) => b.copies - a.copies);

    return { unique: [...counts.keys()], duplicateCount: emails.length - counts.size, repeated };
}
