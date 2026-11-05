// The two stag pages: "Nothing found" (extraction found zero addresses) and the 404 page for unknown URLs.
import type { Dispatch } from "react";
import { formatCount } from "@/app/format";
import type { FlowAction } from "@/app/flow-reducer";
import type { ExtractionSummary } from "@/files/extract-sources";
import { Button, buttonClass, ReportLink, SiteHeader, Stag } from "@/components/ui";

function StagPage({ header, title, body, actions }: { header: React.ReactNode; title: string; body: React.ReactNode; actions: React.ReactNode }) {
    return (
        <div className="flex min-h-dvh flex-col bg-bone text-basalt">
            {header}
            <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
                <Stag className="h-[300px] w-auto" />
                <h1 className="text-5xl font-bold tracking-[-0.04em] md:text-[72px]">{title}</h1>
                <div className="max-w-[760px] font-mono text-base leading-[1.6] text-ash">{body}</div>
                <div className="mt-2 flex flex-wrap justify-center gap-3">{actions}</div>
            </main>
        </div>
    );
}

/** Shown when extraction finished but found zero addresses. */
export function NothingFound({ extraction, dispatch }: { extraction: ExtractionSummary | null; dispatch: Dispatch<FlowAction> }) {
    const lines = extraction?.sources.length ?? 0;
    return (
        <StagPage
            header={
                <SiteHeader tone="light">
                    <Button variant="ghost" className="px-2 text-sm text-basalt" onClick={() => dispatch({ type: "start-over" })}>
                        Start over
                    </Button>
                    <ReportLink />
                </SiteHeader>
            }
            title="Nothing in here but noise."
            body={
                <p>
                    We read {lines === 1 ? "it all" : `all ${formatCount(lines)} sources`} and didn’t find a single email address.
                    <br />
                    Check the file has addresses in it, or paste the text in directly.
                </p>
            }
            actions={
                <>
                    <Button onClick={() => dispatch({ type: "start-over" })}>Try another file</Button>
                    <Button variant="secondary" onClick={() => dispatch({ type: "start-over", openPaste: true })}>
                        Paste text
                    </Button>
                </>
            }
        />
    );
}

/** Shown for any URL other than the app's root. */
export function NotFound() {
    const home = import.meta.env.BASE_URL;
    return (
        <StagPage
            header={
                <SiteHeader tone="light">
                    <a href={home} className={buttonClass("primary", "px-4 py-2.5 text-sm")}>
                        Find emails
                    </a>
                    <ReportLink />
                </SiteHeader>
            }
            title="Error 404"
            body={<p>We’re good at finding emails, but we can’t find that.</p>}
            actions={
                <a href={home} className={buttonClass("primary")}>
                    Back to Odelist
                </a>
            }
        />
    );
}
