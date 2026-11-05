// Finds every email address in a block of text and explains anything that looked like an address but wasn't.
import { normalizeText } from "./normalize-text";

/** Characters that can start the part before the @. */
const LOCAL_START = "[A-Za-z0-9_%+-]";
/** Characters allowed later in the part before the @. */
const LOCAL_CHAR = "[A-Za-z0-9_%+'-]";
/** Characters that, right before a match, mean it would start mid-token. */
const LOCAL_CONTINUATION = "[A-Za-z0-9._%+-]";
/** One domain label: letters/digits, hyphens inside, max 63 characters. */
const LABEL = "[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?";

/** The address pattern, with every quantifier bounded. */
const EMAIL_PATTERN = `(?<!${LOCAL_CONTINUATION})${LOCAL_START}(?:${LOCAL_CHAR}|\\.(?!\\.)){0,63}(?<!\\.)@(?:${LABEL}\\.){1,8}[A-Za-z]{2,24}(?![A-Za-z0-9-])`;

/** "TLDs" that are really file extensions, e.g. logo@2x.png. */
const FILE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "svg", "webp", "bmp", "ico", "tif", "tiff", "avif", "heic", "js", "css", "map"]);

/** Characters that end a candidate token around an @. */
const SEPARATOR = /[\s<>"'()[\]{},;|]/;

/** How many skipped examples to keep. */
const MAX_SKIPPED_EXAMPLES = 500;

/** Why a candidate was skipped. */
export type SkipReason = "missing-name" | "missing-domain" | "too-many-at" | "invalid-name" | "no-dot-in-domain" | "file-name" | "invalid-domain";

/** Something that looked like an address but isn't one. */
export interface SkippedCandidate {
    text: string;
    reason: SkipReason;
}

/** Result of {@link extractEmails}. */
export interface ExtractionResult {
    emails: string[];
    skipped: SkippedCandidate[];
    skippedCount: number;
}

const extensionOfDomain = (address: string) => address.slice(address.lastIndexOf(".") + 1).toLowerCase();

/** Returns the valid, non-file-name addresses in `text`, lowercased. */
function findValidEmails(text: string): string[] {
    const found: string[] = [];
    for (const match of text.matchAll(new RegExp(EMAIL_PATTERN, "g"))) {
        if (!FILE_EXTENSIONS.has(extensionOfDomain(match[0]))) found.push(match[0].toLowerCase());
    }
    return found;
}

/** Yields every "token containing an @": the text between separators around each @. */
function* candidatesAroundAt(text: string): Generator<string> {
    let at = text.indexOf("@");
    while (at !== -1) {
        let start = at;
        while (start > 0 && !SEPARATOR.test(text[start - 1])) start--;
        let end = at + 1;
        while (end < text.length && !SEPARATOR.test(text[end])) end++;
        yield text.slice(start, end);
        at = text.indexOf("@", end);
    }
}

/** Works out why a candidate containing @ is not a valid address. */
function explainSkip(candidate: string): SkipReason {
    const at = candidate.indexOf("@");
    const local = candidate.slice(0, at);
    const domain = candidate.slice(at + 1);
    if (!local) return "missing-name";
    if (!domain) return "missing-domain";
    if (domain.includes("@")) return "too-many-at";
    if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return "invalid-name";
    if (!domain.includes(".")) return "no-dot-in-domain";
    if (FILE_EXTENSIONS.has(extensionOfDomain(domain))) return "file-name";
    return "invalid-domain";
}

/** Extracts every email address from text, plus candidates that looked like addresses but aren't. */
export function extractEmails(text: string): ExtractionResult {
    const clean = normalizeText(text);
    const emails = findValidEmails(clean);

    const skipped: SkippedCandidate[] = [];
    let skippedCount = 0;
    for (const token of candidatesAroundAt(clean)) {
        const candidate = token.replace(/[.:!?]+$/, "");
        if (candidate === "@" || findValidEmails(candidate).length > 0) continue;
        skippedCount++;
        if (skipped.length < MAX_SKIPPED_EXAMPLES) skipped.push({ text: candidate, reason: explainSkip(candidate) });
    }

    return { emails, skipped, skippedCount };
}
