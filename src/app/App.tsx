// Root component: holds the flow state, derives the cleaned list, and renders Main, Results, Nothing found or the 404 page.
import { useReducer } from "react";
import { AnnouncerProvider } from "@/components/Announcer";
import { NotFound, NothingFound } from "@/screens/EmptyStates";
import { Main } from "@/screens/Main";
import { Results } from "@/screens/Results";
import { flowReducer, initialFlowState } from "./flow-reducer";
import { useCleanResult } from "./use-clean-result";

export interface AppProps {
    processingMinimumMs?: number;
    pathname?: string;
}

/** True for the app's root; anything else is a 404. */
export function isAppPath(pathname: string, base: string = import.meta.env.BASE_URL): boolean {
    const rest = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\//, "");
    return rest === "" || rest === "index.html";
}

/** The whole app. */
export function App({ processingMinimumMs = 1200, pathname = typeof window === "undefined" ? "/" : window.location.pathname }: AppProps) {
    const [state, dispatch] = useReducer(flowReducer, initialFlowState);
    const view = useCleanResult(state);

    if (!isAppPath(pathname)) return <NotFound />;

    return (
        <AnnouncerProvider>
            {state.screen === "main" && <Main state={state} dispatch={dispatch} minimumMs={processingMinimumMs} />}
            {state.screen === "results" && view && <Results view={view} dispatch={dispatch} />}
            {state.screen === "nothing-found" && <NothingFound extraction={state.extraction} dispatch={dispatch} />}
        </AnnouncerProvider>
    );
}
