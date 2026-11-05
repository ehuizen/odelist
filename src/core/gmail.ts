// Gmail's address rules: dots and anything after "+" are ignored, so several spellings can reach one inbox.

/** Domains where Gmail's rules apply. googlemail.com is Gmail's old name in some countries. */
const GMAIL_DOMAINS = new Set(["gmail.com", "googlemail.com"]);

/** Canonical form of a Gmail address: dots and `+tag` removed. Others are returned unchanged. */
export function gmailKey(email: string): string {
    const at = email.lastIndexOf("@");
    if (!GMAIL_DOMAINS.has(email.slice(at + 1))) return email;
    const local = email.slice(0, at).split("+")[0];
    return `${local.replaceAll(".", "")}@gmail.com`;
}

/** Several spellings of one Gmail inbox. */
export interface GmailGroup {
    key: string;
    addresses: string[];
}

/** Finds groups of different-looking addresses that reach the same Gmail inbox. */
export function findGmailGroups(uniqueEmails: readonly string[]): GmailGroup[] {
    const byKey = new Map<string, string[]>();
    for (const email of uniqueEmails) {
        const key = gmailKey(email);
        if (key === email && !GMAIL_DOMAINS.has(email.slice(email.lastIndexOf("@") + 1))) continue;
        const group = byKey.get(key);
        if (group) group.push(email);
        else byKey.set(key, [email]);
    }
    return [...byKey].filter(([, addresses]) => addresses.length > 1).map(([key, addresses]) => ({ key, addresses }));
}

/** Keeps only the first spelling of each Gmail inbox. */
export function mergeGmailGroups(emails: readonly string[]): { kept: string[]; mergedCount: number } {
    const seen = new Set<string>();
    const kept: string[] = [];
    for (const email of emails) {
        const key = gmailKey(email);
        if (key !== email || GMAIL_DOMAINS.has(email.slice(email.lastIndexOf("@") + 1))) {
            if (seen.has(key)) continue;
            seen.add(key);
        }
        kept.push(email);
    }
    return { kept, mergedCount: emails.length - kept.length };
}
