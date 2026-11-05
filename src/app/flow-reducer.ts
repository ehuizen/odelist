// The app's state machine for Odelist v1: two screens (Main, Results) plus the "nothing found" state.
import type { ExtractionSummary } from "@/files/extract-sources";

/** Every screen. */
export type Screen = "main" | "results" | "nothing-found";

/** All app state, kept in memory only. */
export interface FlowState {
    screen: Screen;
    pastedText: string;
    files: File[];
    pasteOpen: boolean;
    processing: boolean;
    extraction: ExtractionSummary | null;
    overLimitTotal: number | null;
    extractionError: string | null;
    manuallyRemoved: ReadonlySet<string>;
}

/** Everything that can happen. */
export type FlowAction =
    | { type: "set-pasted-text"; text: string }
    | { type: "open-paste"; open: boolean }
    | { type: "add-files"; files: File[] }
    | { type: "remove-file"; index: number }
    | { type: "start-processing" }
    | { type: "extraction-finished"; summary: ExtractionSummary }
    | { type: "extraction-stopped" }
    | { type: "extraction-failed"; message: string }
    | { type: "dismiss-over-limit" }
    | { type: "remove-email"; email: string }
    | { type: "restore-email"; email: string }
    | { type: "start-over"; openPaste?: boolean };

/** Starting state: Main, nothing added. */
export const initialFlowState: FlowState = {
    screen: "main",
    pastedText: "",
    files: [],
    pasteOpen: false,
    processing: false,
    extraction: null,
    overLimitTotal: null,
    extractionError: null,
    manuallyRemoved: new Set(),
};

/** Pure reducer for the whole flow. */
export function flowReducer(state: FlowState, action: FlowAction): FlowState {
    switch (action.type) {
        case "set-pasted-text":
            return { ...state, pastedText: action.text };
        case "open-paste":
            return { ...state, pasteOpen: action.open };
        case "add-files":
            return { ...state, files: [...state.files, ...action.files] };
        case "remove-file":
            return { ...state, files: state.files.filter((_, i) => i !== action.index) };
        case "start-processing":
            return { ...state, processing: true, overLimitTotal: null, extractionError: null };
        case "extraction-finished": {
            const { summary } = action;
            if (summary.overLimit) return { ...state, processing: false, extraction: null, overLimitTotal: summary.totalFound };
            return {
                ...state,
                processing: false,
                extraction: summary,
                manuallyRemoved: new Set(),
                screen: summary.emails.length === 0 ? "nothing-found" : "results",
            };
        }
        case "extraction-stopped":
            return { ...state, processing: false };
        case "extraction-failed":
            return { ...state, processing: false, extractionError: action.message };
        case "dismiss-over-limit":
            return { ...state, overLimitTotal: null };
        case "remove-email":
            return { ...state, manuallyRemoved: new Set([...state.manuallyRemoved, action.email]) };
        case "restore-email": {
            const next = new Set(state.manuallyRemoved);
            next.delete(action.email);
            return { ...state, manuallyRemoved: next };
        }
        case "start-over":
            return { ...initialFlowState, pasteOpen: action.openPaste ?? false };
    }
}
