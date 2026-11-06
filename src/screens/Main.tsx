// Screen 1, Main: the dark hero with the dropzone. Files or pasted text go in; while extraction runs, the loader shows in the dropzone.
import { type Dispatch, useEffect, useRef, useState } from "react";
import { Button as AriaButton, DropZone, FileTrigger, isFileDropItem } from "react-aria-components";
import { formatBytes, formatCount } from "@/app/format";
import type { FlowAction, FlowState } from "@/app/flow-reducer";
import { Button, buttonClass, Loader, SiteHeader } from "@/components/ui";
import { ACCEPT_ATTRIBUTE, checkFile, MAX_EMAILS } from "@/core/limits";
import { ExtractionCancelledError, runExtraction, withMinimumDuration } from "@/files/run-extraction";
import { cx } from "@/utils/cx";

export interface MainProps {
    state: FlowState;
    dispatch: Dispatch<FlowAction>;
    minimumMs: number;
}

/** Scattered dots above the dropzone. */
const NOISE = Array.from({ length: 16 }, (_, i) => ({ left: 8 + ((i * 53) % 84), top: (i * 37) % 70, size: 5 + ((i * 5) % 8), sky: i % 4 === 0 }));

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

    const stop = () => {
        controllerRef.current?.abort();
        dispatch({ type: "extraction-stopped" });
    };

    return (
        <div className="flex min-h-dvh flex-col bg-basalt text-bone">
            <SiteHeader tone="dark">
                <span className="flex items-center gap-2.5 rounded-full border border-line-dark bg-raised px-3.5 py-2 font-mono text-[13px] text-bone">
                    <span className="size-2 rounded-full bg-sky" aria-hidden="true" />
                    <span className="hidden sm:inline">Private: files never leave your browser</span>
                    <span className="sm:hidden">Private</span>
                </span>
            </SiteHeader>

            <main className="mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-12 px-6 py-12 md:px-24 lg:grid-cols-[1fr_560px] lg:gap-16">
                <section className="flex flex-col gap-8">
                    <h1 className="text-[56px] leading-[0.94] font-bold tracking-[-0.04em] md:text-[clamp(64px,6.6vw,112px)]">
                        Find emails{" "}
                        <br />
                        in the mess.
                    </h1>
                    <p className="max-w-[560px] font-mono text-lg leading-[1.5] text-mid">
                        Drop a spreadsheet, an export or a wall of text. Odelist pulls out every address, bins the duplicates and junk, and hands you a clean list.
                    </p>
                    <p className="font-mono text-sm text-ash">Runs locally · No sign-up · Free</p>
                </section>

                <DropZone
                    aria-label="Drop files here"
                    isDisabled={processing}
                    onDrop={async (event) => addFiles(await Promise.all(event.items.filter(isFileDropItem).map((item) => item.getFile())))}
                    className={({ isDropTarget, isFocusVisible }) =>
                        cx(
                            "relative flex min-h-[440px] flex-col md:min-h-[600px] items-center justify-center gap-6 rounded-3xl border-[1.5px] border-dashed border-ash bg-raised p-8 text-center transition-colors",
                            isDropTarget && "border-sky bg-[#1b1f21]",
                            isFocusVisible && "outline-2 outline-offset-4 outline-sky",
                        )
                    }
                >
                    {processing ? (
                        <div className="flex flex-col items-center gap-6">
                            <Loader label="Finding emails" />
                            <p className="text-[32px] font-bold tracking-[-0.03em]">Sieving the mess…</p>
                            <p className="max-w-[420px] truncate font-mono text-sm text-ash">{progress ? `Reading ${progress === "Pasted text" ? "your pasted text" : progress}` : "Starting…"}</p>
                            <Button variant="ghost" className="text-mid hover:text-bone" onClick={stop}>
                                Stop
                            </Button>
                        </div>
                    ) : (
                        <>
                            {!hasInput && (
                                <div className="relative h-24 w-[300px]" aria-hidden="true">
                                    {NOISE.map((d, i) => (
                                        <span key={i} className={cx("absolute rounded-full opacity-75", d.sky ? "bg-sky" : "bg-ash")} style={{ left: `${d.left}%`, top: d.top, width: d.size, height: d.size }} />
                                    ))}
                                </div>
                            )}

                            {!hasInput && (
                                <span className="flex size-14 items-center justify-center rounded-full border-[1.5px] border-bone text-2xl" aria-hidden="true">
                                    ↑
                                </span>
                            )}

                            <div className="flex flex-col items-center gap-3">
                                <p className="text-[40px] font-bold tracking-[-0.04em]">Drop the mess.</p>
                                <p className="font-mono text-[15px] text-ash">
                                    CSV · XLSX · TXT ·{" "}
                                    <button type="button" className="cursor-pointer text-mid underline-offset-4 hover:text-bone hover:underline" onClick={() => dispatch({ type: "open-paste", open: !pasteOpen })}>
                                        {pasteOpen ? "hide paste box" : "or paste text"}
                                    </button>
                                </p>
                            </div>

                            {files.length > 0 && (
                                <ul className="flex w-full flex-col gap-2" aria-label="Added files">
                                    {files.map((file, index) => {
                                        const note = FILE_NOTE[checkFile(file)];
                                        return (
                                            <li key={`${file.name}-${index}`} className="flex items-center gap-3 rounded-[10px] border border-line-dark bg-basalt px-4 py-3 text-left">
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate font-mono text-[15px] text-bone">{file.name}</span>
                                                    <span className={cx("block font-mono text-[13px]", note && checkFile(file) !== "warn" ? "text-[#e5a497]" : "text-ash")}>
                                                        {formatBytes(file.size)}
                                                        {note ? ` · ${note}` : ""}
                                                    </span>
                                                </span>
                                                <button type="button" aria-label={`Remove ${file.name}`} className="cursor-pointer px-1 text-lg text-ash hover:text-bone" onClick={() => dispatch({ type: "remove-file", index })}>
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
                                        className="w-full resize-y rounded-[10px] border border-line-dark bg-basalt p-4 font-mono text-[15px] leading-relaxed text-bone placeholder:text-ash focus:border-sky focus:outline-none"
                                    />
                                </label>
                            )}

                            <div className="flex flex-wrap items-center justify-center gap-3">
                                <FileTrigger acceptedFileTypes={ACCEPT_ATTRIBUTE.split(",")} allowsMultiple onSelect={(list) => list && addFiles(Array.from(list))}>
                                    <AriaButton className={buttonClass(canFind ? "secondary" : "light", canFind ? "border-line-dark bg-transparent text-bone hover:bg-line-dark" : undefined)}>
                                        {files.length ? "Add another file" : "Choose a file"}
                                    </AriaButton>
                                </FileTrigger>
                                {canFind && (
                                    <Button variant="light" onClick={() => dispatch({ type: "start-processing" })}>
                                        Find emails →
                                    </Button>
                                )}
                            </div>

                            {state.overLimitTotal !== null && (
                                <div role="alert" className="w-full rounded-xl border border-line-dark bg-basalt p-5 text-left">
                                    <p className="text-xl font-bold">That’s a big one.</p>
                                    <p className="mt-2 font-mono text-sm leading-relaxed text-mid">
                                        We found {formatCount(state.overLimitTotal)} addresses. Odelist handles up to {formatCount(MAX_EMAILS)} at a time so everything stays fast in your
                                        browser. Split the file and run each part.
                                    </p>
                                    <Button variant="ghost" className="mt-3 px-0 text-bone" onClick={() => dispatch({ type: "dismiss-over-limit" })}>
                                        OK, I’ll split it
                                    </Button>
                                </div>
                            )}

                            {state.extractionError && (
                                <p role="alert" className="font-mono text-sm text-[#e5a497]">
                                    Something went wrong while reading your files ({state.extractionError}). Try again, or paste the text instead.
                                </p>
                            )}
                        </>
                    )}
                </DropZone>
            </main>
        </div>
    );
}
