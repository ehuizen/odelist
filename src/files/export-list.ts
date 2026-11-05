// Gets the final list out of the browser: copy to clipboard, or download as CSV or Excel. Nothing is uploaded.
import { toCsv, toPlainText } from "@/core/to-csv";

/** Base name for downloads, e.g. "odelist-clean-list-2026-10-29". */
export function exportFileName(now: Date = new Date()): string {
    return `odelist-clean-list-${now.toISOString().slice(0, 10)}`;
}

/** Triggers a browser download of `blob`. */
function downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** Downloads the list as a one-column CSV. */
export function downloadCsv(emails: readonly string[]): void {
    downloadBlob(new Blob(["﻿", toCsv(emails)], { type: "text/csv;charset=utf-8" }), `${exportFileName()}.csv`);
}

/** Downloads the list as an Excel workbook with a single "Email" column. */
export async function downloadXlsx(emails: readonly string[]): Promise<void> {
    const XLSX = await import("xlsx");
    const sheet = XLSX.utils.aoa_to_sheet([["Email"], ...emails.map((email) => [email])]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "Clean list");
    const data: ArrayBuffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
    downloadBlob(new Blob([data], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${exportFileName()}.xlsx`);
}

/** Copies the list to the clipboard, one address per line. */
export async function copyList(emails: readonly string[]): Promise<boolean> {
    const text = toPlainText(emails);
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        const area = document.createElement("textarea");
        area.value = text;
        area.setAttribute("readonly", "");
        area.style.position = "fixed";
        area.style.opacity = "0";
        document.body.appendChild(area);
        area.select();
        const copied = document.execCommand("copy");
        area.remove();
        return copied;
    }
}
