// Connects the flow state to the core pipeline: the cleaned list plus one labelled row per address for the Results screen.
import { useMemo } from "react";
import { type CleanResult, cleanList, DEFAULT_CLEAN_OPTIONS } from "@/core/clean-list";
import { explainList, type ListEntry } from "@/core/explain-list";
import type { FlowState } from "./flow-reducer";

/** Everything the Results screen shows. */
export interface ResultsView {
    result: CleanResult;
    entries: ListEntry[];
    invalidCount: number;
    foundCount: number;
}

/** The cleaned list for the current state, memoised; `null` before anything has been extracted. */
export function useCleanResult(state: Pick<FlowState, "extraction" | "manuallyRemoved">): ResultsView | null {
    const { extraction, manuallyRemoved } = state;
    return useMemo(() => {
        if (!extraction) return null;
        const result = cleanList(extraction.emails, { ...DEFAULT_CLEAN_OPTIONS, removeRoleAddresses: false, manuallyRemoved });
        const entries = explainList(extraction.emails, { manuallyRemoved });
        for (const item of extraction.skipped) entries.push({ email: item.text, status: "invalid" });
        return { result, entries, invalidCount: extraction.skippedCount, foundCount: extraction.emails.length };
    }, [extraction, manuallyRemoved]);
}
