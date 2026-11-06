// Screen 1, Main: the dark hero with the dropzone. Files or pasted text go in; while extraction runs, the loader shows in the dropzone.
import { type Dispatch, useEffect, useRef, useState } from "react";
import { Button as AriaButton, DropZone, FileTrigger, isFileDropItem } from "react-aria-components";
import type { FlowAction, FlowState } from "@/app/flow-reducer";
import { formatBytes, formatCount } from "@/app/format";
import { Button, HeroStag, Loader, SiteHeader, buttonClass } from "@/components/ui";
import { ACCEPT_ATTRIBUTE, MAX_EMAILS, checkFile } from "@/core/limits";
import { ExtractionCancelledError, runExtraction, withMinimumDuration } from "@/files/run-extraction";
import { cx } from "@/utils/cx";

export interface MainProps {
    state: FlowState;
    dispatch: Dispatch<FlowAction>;
    minimumMs: number;
}

/** Demo file in public/, for visitors who have no export to drop. */
const SAMPLE_URL = `${import.meta.env.BASE_URL}sample-crm-export.txt`;

const FILE_NOTE: Record<ReturnType<typeof checkFile>, string | null> = {
    ok: null,
    warn: "Large file: this may take a moment",
    "too-big": "Too big to read in a browser",
    unsupported: "Can't read this type. Save as CSV or TXT, or paste the text.",
};

/** Main screen. */
export function Main({ state, dispatch, minimumMs }: MainProps) {
    const { files, pastedText, processing, pasteOpen } = state;
    const [progress, setProgress] = useState("");
    const controllerRef = useRef<AbortController | null>(null);

    useEffect(() => {
        if (!processing) return;
        const controller = new AbortController();
        controllerRef.current = controller;
        withMinimumDuration(runExtraction(files, pastedText, { onProgress: (p) => setProgress(p.current), signal: controller.signal }), minimumMs)
            .then((summary) => {
                if (!controller.signal.aborted) dispatch({ type: "extraction-finished", summary });
            })
            .catch((error: unknown) => {
                if (error instanceof ExtractionCancelledError || controller.signal.aborted) return;
                dispatch({ type: "extraction-failed", message: error instanceof Error ? error.message : String(error) });
            });
        return () => controller.abort();
    }, [processing, files, pastedText, minimumMs, dispatch]);

    const usable = files.filter((f) => ["ok", "warn"].includes(checkFile(f)));
    const canFind = pastedText.trim().length > 0 || usable.length > 0;
    const hasInput = files.length > 0 || pasteOpen;
    const addFiles = (list: File[]) => list.length && dispatch({ type: "add-files", files: list });

    const trySample = async () => {
        try {
            const response = await fetch(SAMPLE_URL);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            addFiles([new File([await response.blob()], "sample-crm-export.txt", { type: "text/plain" })]);
            dispatch({ type: "start-processing" });
        } catch (error) {
            dispatch({ type: "extraction-failed", message: error instanceof Error ? error.message : String(error) });
        }
    };

    const stop = () => {
        controllerRef.current?.abort();
        dispatch({ type: "extraction-stopped" });
    };

    return (
        <div className="flex min-h-dvh flex-col bg-bone text-basalt lg:h-dvh lg:overflow-hidden">
            <SiteHeader tone="light">
                <span className="max-w-[200px] text-right font-mono text-[13px] text-ash sm:max-w-none">
                    Heads up, your files and emails never leave your computer
                </span>
            </SiteHeader>

            <main className="mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-12 px-6 py-8 md:px-24 lg:min-h-0 lg:grid-cols-[1fr_560px] lg:grid-rows-[minmax(0,1fr)] lg:gap-16">
                <section className="flex flex-col gap-8">
                    <h1 className="text-[56px] leading-[0.94] font-bold tracking-[-0.04em] md:text-[clamp(48px,min(6.6vw,11vh),112px)]">
                        Find emails <br />
                        in the mess.
                    </h1>
                    <p className="max-w-[560px] font-mono text-lg leading-[1.5] text-ash">
                        Drop a spreadsheet, an export or a wall of text. Odelist pulls out every address, bins the duplicates and junk, and hands you a clean
                        list.
                    </p>
                    <p className="font-mono text-sm text-ash">Runs locally · No sign-up · Free</p>
                </section>

                <DropZone
                    aria-label="Drop files here"
                    isDisabled={processing}
                    onDrop={async (event) => addFiles(await Promise.all(event.items.filter(isFileDropItem).map((item) => item.getFile())))}
                    className={({ isDropTarget, isFocusVisible }) =>
                        cx(
                            "group relative flex min-h-[440px] flex-col rounded-3xl border-[1.5px] border-dashed border-ash/60 bg-paper p-8 text-center transition-colors lg:h-full lg:max-h-[600px] lg:min-h-0 lg:overflow-y-auto",
                            isDropTarget && "border-sky bg-sky-tint",
                            isFocusVisible && "outline-2 outline-offset-4 outline-sky",
                        )
                    }
                >
                    <div className="my-auto flex w-full flex-col items-center gap-6">
                        {processing ? (
                            <div className="flex flex-col items-center gap-6">
                                <Loader label="Finding emails" tone="dark" />
                                <p className="text-[32px] font-bold tracking-[-0.03em]">Sieving the mess…</p>
                                <p className="max-w-[420px] truncate font-mono text-sm text-ash">
                                    {progress ? `Reading ${progress === "Pasted text" ? "your pasted text" : progress}` : "Starting…"}
                                </p>
                                <Button variant="ghost" className="text-ash hover:text-basalt" onClick={stop}>
                                    Stop
                                </Button>
                            </div>
                        ) : (
                            <>
                                {!hasInput && <HeroStag tone="light" className="h-[180px]" />}

                                <div className="flex flex-col items-center gap-3">
                                    <p className="text-[40px] font-bold tracking-[-0.04em]">Drop the mess.</p>
                                    <p className="font-mono text-[15px] text-ash">
                                        CSV · XLSX · TXT ·{" "}
                                        <button
                                            type="button"
                                            className="cursor-pointer text-basalt underline-offset-4 hover:underline"
                                            onClick={() => dispatch({ type: "open-paste", open: !pasteOpen })}
                                        >
                                            {pasteOpen ? "hide paste box" : "or paste text"}
                                        </button>
                                    </p>
                                </div>

                                {files.length > 0 && (
                                    <ul className="flex w-full flex-col gap-2" aria-label="Added files">
                                        {files.map((file, index) => {
                                            const note = FILE_NOTE[checkFile(file)];
                                            return (
                                                <li
                                                    key={`${file.name}-${index}`}
                                                    className="flex items-center gap-3 rounded-[10px] border border-bone-line bg-bone px-4 py-3 text-left"
                                                >
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate font-mono text-[15px] text-basalt">{file.name}</span>
                                                        <span
                                                            className={cx(
                                                                "block font-mono text-[13px]",
                                                                note && checkFile(file) !== "warn" ? "text-rust" : "text-ash",
                                                            )}
                                                        >
                                                            {formatBytes(file.size)}
                                                            {note ? ` · ${note}` : ""}
                                                        </span>
                                                    </span>
                                                    <button
                                                        type="button"
                                                        aria-label={`Remove ${file.name}`}
                                                        className="cursor-pointer px-1 text-lg text-ash hover:text-basalt"
                                                        onClick={() => dispatch({ type: "remove-file", index })}
                                                    >
                                                        ×
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}

                                {pasteOpen && (
                                    <label className="flex w-full flex-col gap-2 text-left">
                                        <span className="font-mono text-xs tracking-[0.08em] text-ash">PASTE TEXT</span>
                                        <textarea
                                            rows={6}
                                            value={pastedText}
                                            onChange={(e) => dispatch({ type: "set-pasted-text", text: e.target.value })}
                                            placeholder="A CRM export, an email thread, a spreadsheet column… anything with addresses in it."
                                            className="w-full resize-y rounded-[10px] border border-bone-line bg-bone p-4 font-mono text-[15px] leading-relaxed text-basalt placeholder:text-mid focus:border-sky focus:outline-none"
                                        />
                                    </label>
                                )}

                                <div className="flex flex-wrap items-center justify-center gap-3">
                                    <FileTrigger
                                        acceptedFileTypes={ACCEPT_ATTRIBUTE.split(",")}
                                        allowsMultiple
                                        onSelect={(list) => list && addFiles(Array.from(list))}
                                    >
                                        <AriaButton className={buttonClass(canFind ? "secondary" : "primary")}>
                                            {files.length ? "Add another file" : "Choose a file"}
                                        </AriaButton>
                                    </FileTrigger>
                                    {canFind && <Button onClick={() => dispatch({ type: "start-processing" })}>Find emails →</Button>}
                                </div>

                                {!hasInput && (
                                    <p className="font-mono text-sm text-ash">
                                        No file handy?{" "}
                                        <button type="button" className="cursor-pointer text-basalt underline-offset-4 hover:underline" onClick={trySample}>
                                            Try a sample
                                        </button>{" "}
                                        or{" "}
                                        <a className="text-basalt underline-offset-4 hover:underline" href={SAMPLE_URL} download="sample-crm-export.txt">
                                            download it
                                        </a>
                                    </p>
                                )}

                                {state.overLimitTotal !== null && (
                                    <div role="alert" className="w-full rounded-xl border border-bone-line bg-bone p-5 text-left">
                                        <p className="text-xl font-bold">That’s a big one.</p>
                                        <p className="mt-2 font-mono text-sm leading-relaxed text-ash">
                                            We found {formatCount(state.overLimitTotal)} addresses. Odelist handles up to {formatCount(MAX_EMAILS)} at a time so
                                            everything stays fast in your browser. Split the file and run each part.
                                        </p>
                                        <Button variant="ghost" className="mt-3 px-0 text-basalt" onClick={() => dispatch({ type: "dismiss-over-limit" })}>
                                            OK, I’ll split it
                                        </Button>
                                    </div>
                                )}

                                {state.extractionError && (
                                    <p role="alert" className="font-mono text-sm text-rust">
                                        Something went wrong while reading your files ({state.extractionError}). Try again, or paste the text instead.
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </DropZone>
            </main>
        </div>
    );
}
