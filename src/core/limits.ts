// Size and count limits that keep Odelist fast on an ordinary laptop, plus which file types we can read.

const MB = 1024 * 1024;

/** Most addresses one run may contain. */
export const MAX_EMAILS = 50_000;

/** Text files above this size get a "this may take a moment" warning. */
export const TEXT_WARN_BYTES = 25 * MB;
/** Text files above this size are refused. */
export const TEXT_MAX_BYTES = 100 * MB;
/** Excel files above this size get a warning. */
export const EXCEL_WARN_BYTES = 10 * MB;
/** Excel files above this size are refused. */
export const EXCEL_MAX_BYTES = 30 * MB;

/** File types we can read as text, plus Excel. */
export const SUPPORTED_EXTENSIONS = ["txt", "csv", "tsv", "html", "htm", "json", "log", "md", "xml", "vcf", "eml", "xlsx", "xls"] as const;

/** Value for an `<input type="file" accept="…">`. */
export const ACCEPT_ATTRIBUTE = SUPPORTED_EXTENSIONS.map((ext) => `.${ext}`).join(",");

/** Verdict for a file before reading it. */
export type FileVerdict = "ok" | "warn" | "too-big" | "unsupported";

/** Lowercased extension without the dot ("" when there is none). */
export function extensionOf(fileName: string): string {
    const dot = fileName.lastIndexOf(".");
    return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

/** Is this an Excel workbook (.xlsx or .xls)? */
export function isExcelFile(fileName: string): boolean {
    const ext = extensionOf(fileName);
    return ext === "xlsx" || ext === "xls";
}

/** Decides whether a file can be read, before reading it. */
export function checkFile(file: { name: string; size: number }): FileVerdict {
    const ext = extensionOf(file.name);
    if (!(SUPPORTED_EXTENSIONS as readonly string[]).includes(ext)) return "unsupported";
    const [warn, max] = isExcelFile(file.name) ? [EXCEL_WARN_BYTES, EXCEL_MAX_BYTES] : [TEXT_WARN_BYTES, TEXT_MAX_BYTES];
    if (file.size > max) return "too-big";
    if (file.size > warn) return "warn";
    return "ok";
}
