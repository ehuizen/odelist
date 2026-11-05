// Turns the final list into CSV or plain text for download and copying.

/** Characters that make spreadsheet apps treat a cell as a formula. */
const FORMULA_START = /^[=+\-@]/;

/** Formats one value as a safe CSV cell. */
function csvCell(value: string): string {
    const safe = FORMULA_START.test(value) ? `'${value}` : value;
    return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** Builds a one-column CSV (header `email`) with Windows line endings. */
export function toCsv(emails: readonly string[]): string {
    return ["email", ...emails.map(csvCell)].join("\r\n") + "\r\n";
}

/** One address per line. */
export function toPlainText(emails: readonly string[]): string {
    return emails.join("\n");
}
