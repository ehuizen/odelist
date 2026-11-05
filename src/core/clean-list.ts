// The whole cleaning pipeline as one pure function.
import { type BlockEntry, createBlocker } from "./block";
import { dedupe } from "./dedupe";
import { mergeGmailGroups } from "./gmail";
import { isListed } from "./match-list";
import { isRoleAddress } from "./role-addresses";

/** Every choice the user makes across the cleaning screens. */
export interface CleanOptions {
    removeDuplicates: boolean;
    mergeGmail: boolean;
    listSet: ReadonlySet<string> | null;
    blocks: readonly BlockEntry[];
    removeRoleAddresses: boolean;
    manuallyRemoved: ReadonlySet<string>;
}

/** The defaults before the user changes anything. */
export const DEFAULT_CLEAN_OPTIONS: CleanOptions = {
    removeDuplicates: true,
    mergeGmail: false,
    listSet: null,
    blocks: [],
    removeRoleAddresses: true,
    manuallyRemoved: new Set(),
};

/** How many addresses each step removed. Each address is counted once, under the first step that removed it. */
export interface RemovalCounts {
    duplicates: number;
    gmailMerged: number;
    listed: number;
    blocked: number;
    role: number;
    manual: number;
}

/** Result of {@link cleanList}. */
export interface CleanResult {
    kept: string[];
    removed: RemovalCounts;
    removedTotal: number;
}

/** Applies every cleaning step, in the order the screens show them. */
export function cleanList(found: readonly string[], options: CleanOptions): CleanResult {
    const removed: RemovalCounts = { duplicates: 0, gmailMerged: 0, listed: 0, blocked: 0, role: 0, manual: 0 };
    let list: readonly string[] = found;

    if (options.removeDuplicates) {
        const result = dedupe(list);
        list = result.unique;
        removed.duplicates = result.duplicateCount;
    }
    if (options.mergeGmail) {
        const result = mergeGmailGroups(list);
        list = result.kept;
        removed.gmailMerged = result.mergedCount;
    }

    const isBlocked = createBlocker(options.blocks);
    const kept: string[] = [];
    for (const email of list) {
        if (options.listSet && isListed(email, options.listSet)) removed.listed++;
        else if (isBlocked(email)) removed.blocked++;
        else if (options.removeRoleAddresses && isRoleAddress(email)) removed.role++;
        else if (options.manuallyRemoved.has(email)) removed.manual++;
        else kept.push(email);
    }

    return { kept, removed, removedTotal: found.length - kept.length };
}
