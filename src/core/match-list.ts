// "Check against a list": builds a fast lookup from an unsubscribe/bounce list and tests addresses against it.
import { gmailKey } from "./gmail";

/** Builds a lookup Set from a list of addresses, storing each address and its Gmail canonical form. */
export function buildMatchSet(listEmails: Iterable<string>): Set<string> {
    const set = new Set<string>();
    for (const raw of listEmails) {
        const email = raw.trim().toLowerCase();
        if (!email) continue;
        set.add(email);
        set.add(gmailKey(email));
    }
    return set;
}

/** Is this address on the list? Matches exactly or as the same Gmail inbox. */
export function isListed(email: string, matchSet: ReadonlySet<string>): boolean {
    return matchSet.has(email) || matchSet.has(gmailKey(email));
}
