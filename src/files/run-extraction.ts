// Starts extraction in a Web Worker and wraps it in a Promise with progress, cancellation and a minimum display time.
import { type ExtractionSummary, extractFromSources, type ProgressHandler } from "./extract-sources";
import type { WorkerRequest, WorkerResponse } from "./worker-messages";

/** Options for `runExtraction`. */
export interface RunExtractionOptions {
    onProgress?: ProgressHandler;
    signal?: AbortSignal;
}

/** Thrown when the user cancels. */
export class ExtractionCancelledError extends Error {
    constructor() {
        super("Extraction cancelled");
        this.name = "ExtractionCancelledError";
    }
}

/** Extracts addresses from files and pasted text in a background thread. */
export function runExtraction(files: File[], pastedText: string, options: RunExtractionOptions = {}): Promise<ExtractionSummary> {
    const { onProgress, signal } = options;
    if (signal?.aborted) return Promise.reject(new ExtractionCancelledError());

    if (typeof Worker === "undefined") {
        return extractFromSources(files, pastedText, onProgress).then((summary) => {
            if (signal?.aborted) throw new ExtractionCancelledError();
            return summary;
        });
    }

    return new Promise((resolve, reject) => {
        const worker = new Worker(new URL("./extract.worker.ts", import.meta.url), { type: "module" });
        const finish = () => {
            worker.terminate();
            signal?.removeEventListener("abort", onAbort);
        };
        const onAbort = () => {
            finish();
            reject(new ExtractionCancelledError());
        };
        signal?.addEventListener("abort", onAbort);

        worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
            const message = event.data;
            if (message.type === "progress") onProgress?.(message);
            else if (message.type === "result") {
                finish();
                resolve(message.summary);
            } else {
                finish();
                reject(new Error(message.message));
            }
        };
        worker.onerror = (event) => {
            finish();
            reject(new Error(event.message || "The extraction worker crashed"));
        };
        worker.postMessage({ files, pastedText } satisfies WorkerRequest);
    });
}

/** Resolves no sooner than `minimumMs` after it was called, with the promise's value. */
export async function withMinimumDuration<T>(promise: Promise<T>, minimumMs: number): Promise<T> {
    const [value] = await Promise.all([promise, new Promise((resolve) => setTimeout(resolve, minimumMs))]);
    return value;
}
