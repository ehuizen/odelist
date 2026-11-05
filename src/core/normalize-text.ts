// Cleans pasted text before extraction: removes invisible characters and odd spaces.

/** Zero-width characters, word joiner, byte-order mark and soft hyphen. */
const INVISIBLE_CHARACTERS = /[\u200B-\u200D\u2060\uFEFF\u00AD]/g;

/** Non-breaking, figure and narrow non-breaking spaces. */
const UNUSUAL_SPACES = /[\u00A0\u2007\u202F]/g;

/** Normalises text so that addresses that look identical also compare identical. */
export function normalizeText(text: string): string {
    return text.normalize("NFC").replace(INVISIBLE_CHARACTERS, "").replace(UNUSUAL_SPACES, " ");
}
