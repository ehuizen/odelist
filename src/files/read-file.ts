// Reads an uploaded file into plain text: text-like files directly, Excel workbooks via SheetJS (every sheet, as CSV).
import { checkFile, isExcelFile } from "@/core/limits";

/** Why a file couldn't be read. */
export type ReadFailure = "unsupported" | "too-big" | "unreadable";

/** Thrown by `readFileAsText` with a machine-readable reason. */
export class FileReadError extends Error {
    readonly reason: ReadFailure;

    constructor(reason: ReadFailure, fileName: string, cause?: unknown) {
        super(`Could not read ${fileName}: ${reason}`, { cause });
        this.name = "FileReadError";
        this.reason = reason;
    }
}

/** The minimum a reader needs: a browser `File` or a test double. */
export interface ReadableFile {
    name: string;
    size: number;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
}

/** True when the bytes start like a zip but have no end-of-central-directory record (truncated or corrupt). */
export function isTruncatedZip(data: ArrayBuffer): boolean {
    const bytes = new Uint8Array(data);
    const startsLikeZip = bytes.length >= 4 && bytes[0] === 0x50 && bytes[1] === 0x4b && bytes[2] === 0x03 && bytes[3] === 0x04;
    if (!startsLikeZip) return false;
    const from = Math.max(0, bytes.length - 65_557);
    for (let i = bytes.length - 22; i >= from; i--) {
        if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x05 && bytes[i + 3] === 0x06) return false;
    }
    return true;
}

/** Converts an Excel workbook to text: every sheet, as CSV. */
async function excelToText(data: ArrayBuffer): Promise<string> {
    if (isTruncatedZip(data)) throw new Error("Truncated or corrupt zip data");
    const XLSX = await import("xlsx");
    const workbook = XLSX.read(data, { type: "array", dense: true });
    return workbook.SheetNames.map((name) => XLSX.utils.sheet_to_csv(workbook.Sheets[name])).join("\n");
}

/** Reads a file as text so emails can be extracted from it. */
export async function readFileAsText(file: ReadableFile): Promise<string> {
    const verdict = checkFile(file);
    if (verdict === "unsupported" || verdict === "too-big") throw new FileReadError(verdict, file.name);
    try {
        return isExcelFile(file.name) ? await excelToText(await file.arrayBuffer()) : await file.text();
    } catch (error) {
        throw new FileReadError("unreadable", file.name, error);
    }
}
