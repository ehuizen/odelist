// The extraction worker's logic as a plain async function.
import { extractEmails, type SkippedCandidate } from "@/core/extract-emails";
import { MAX_EMAILS } from "@/core/limits";
import { FileReadError, type ReadableFile, readFileAsText } from "./read-file";

/** What happened to one input (a file or the pasted text). */
export interface SourceReport {
    name: string;
    kind: "file" | "pasted";
    status: "ok" | "unsupported" | "too-big" | "unreadable";
    emailCount: number;
}

/** Everything the UI needs after extraction. */
export interface ExtractionSummary {
    emails: string[];
    totalFound: number;
    overLimit: boolean;
    skipped: SkippedCandidate[];
    skippedCount: number;
    sources: SourceReport[];
}

/** Progress callback for extraction. */
export type ProgressHandler = (progress: { done: number; total: number; current: string }) => void;

const MAX_SKIPPED_EXAMPLES = 500;

/** Reads each file and the pasted text, extracts addresses from each, and combines the results. */
export async function extractFromSources(files: readonly ReadableFile[], pastedText: string, onProgress?: ProgressHandler): Promise<ExtractionSummary> {
    const sources: SourceReport[] = [];
    const emails: string[] = [];
    const skipped: SkippedCandidate[] = [];
    let skippedCount = 0;
    const total = files.length + (pastedText.trim() ? 1 : 0);
    let done = 0;

    const collect = (text: string) => {
        const result = extractEmails(text);
        for (const email of result.emails) emails.push(email);
        for (const item of result.skipped) if (skipped.length < MAX_SKIPPED_EXAMPLES) skipped.push(item);
        skippedCount += result.skippedCount;
        return result.emails.length;
    };

    if (pastedText.trim()) {
        onProgress?.({ done, total, current: "Pasted text" });
        sources.push({ name: "Pasted text", kind: "pasted", status: "ok", emailCount: collect(pastedText) });
        onProgress?.({ done: ++done, total, current: "Pasted text" });
    }

    for (const file of files) {
        onProgress?.({ done, total, current: file.name });
        try {
            const text = await readFileAsText(file);
            sources.push({ name: file.name, kind: "file", status: "ok", emailCount: collect(text) });
        } catch (error) {
            const status = error instanceof FileReadError ? error.reason : "unreadable";
            sources.push({ name: file.name, kind: "file", status, emailCount: 0 });
        }
        onProgress?.({ done: ++done, total, current: file.name });
    }

    const overLimit = emails.length > MAX_EMAILS;
    return { emails: overLimit ? [] : emails, totalFound: emails.length, overLimit, skipped, skippedCount, sources };
}
