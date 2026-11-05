// Tests for the v1 flow reducer: processing, results, nothing found, limits, manual removals and starting over.
import { describe, expect, it } from "vitest";
import type { ExtractionSummary } from "@/files/extract-sources";
import { flowReducer, initialFlowState } from "./flow-reducer";

const summary = (emails: string[], extra: Partial<ExtractionSummary> = {}): ExtractionSummary => ({
    emails,
    totalFound: emails.length,
    overLimit: false,
    skipped: [],
    skippedCount: 0,
    sources: [],
    ...extra,
});

describe("flowReducer", () => {
    it("starts on Main with nothing added", () => {
        expect(initialFlowState.screen).toBe("main");
        expect(initialFlowState.processing).toBe(false);
    });

    it("goes to Results when addresses are found", () => {
        const processing = flowReducer(initialFlowState, { type: "start-processing" });
        expect(processing.processing).toBe(true);
        const done = flowReducer(processing, { type: "extraction-finished", summary: summary(["a@x.example"]) });
        expect(done.screen).toBe("results");
        expect(done.processing).toBe(false);
    });

    it("goes to Nothing found when no addresses are found", () => {
        const done = flowReducer({ ...initialFlowState, processing: true }, { type: "extraction-finished", summary: summary([]) });
        expect(done.screen).toBe("nothing-found");
    });

    it("stays on Main with a notice when over the limit", () => {
        const done = flowReducer({ ...initialFlowState, processing: true }, { type: "extraction-finished", summary: summary([], { overLimit: true, totalFound: 60_000 }) });
        expect(done.screen).toBe("main");
        expect(done.overLimitTotal).toBe(60_000);
        expect(flowReducer(done, { type: "dismiss-over-limit" }).overLimitTotal).toBeNull();
    });

    it("keeps added input when stopped or when extraction fails", () => {
        const withText = { ...initialFlowState, pastedText: "a@x.example", processing: true };
        expect(flowReducer(withText, { type: "extraction-stopped" })).toMatchObject({ processing: false, pastedText: "a@x.example" });
        expect(flowReducer(withText, { type: "extraction-failed", message: "boom" })).toMatchObject({ processing: false, extractionError: "boom" });
    });

    it("removes and restores single addresses", () => {
        const removed = flowReducer(initialFlowState, { type: "remove-email", email: "a@x.example" });
        expect(removed.manuallyRemoved.has("a@x.example")).toBe(true);
        expect(flowReducer(removed, { type: "restore-email", email: "a@x.example" }).manuallyRemoved.size).toBe(0);
    });

    it("clears manual removals when a new list is extracted", () => {
        const removed = flowReducer(initialFlowState, { type: "remove-email", email: "a@x.example" });
        const done = flowReducer(removed, { type: "extraction-finished", summary: summary(["a@x.example"]) });
        expect(done.manuallyRemoved.size).toBe(0);
    });

    it("starts over, optionally with the paste box open", () => {
        const busy = { ...initialFlowState, screen: "results" as const, pastedText: "x" };
        expect(flowReducer(busy, { type: "start-over" })).toEqual(initialFlowState);
        expect(flowReducer(busy, { type: "start-over", openPaste: true }).pasteOpen).toBe(true);
    });
});
