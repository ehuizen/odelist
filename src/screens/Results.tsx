// Screen 2, Results: the clean count, what was removed and why, the list with Kept/Removed tabs, and Copy/Export.
import { type Dispatch, useState } from "react";
import { formatCount, pluralize } from "@/app/format";
import type { FlowAction } from "@/app/flow-reducer";
import type { ResultsView } from "@/app/use-clean-result";
import { useAnnounce } from "@/components/Announcer";
import { Button, SiteHeader } from "@/components/ui";
import type { EntryStatus } from "@/core/explain-list";
import { copyList, downloadCsv } from "@/files/export-list";
import { cx } from "@/utils/cx";

/** Rows rendered at once. */
export const VISIBLE_ROWS = 200;

type Tab = "all" | "kept" | "removed";

const TAG: Record<EntryStatus, string> = { kept: "Kept", duplicate: "Duplicate", manual: "Removed by you", invalid: "Invalid" };

export interface ResultsProps {
    view: ResultsView;
    dispatch: Dispatch<FlowAction>;
}

/** Results screen. */
export function Results({ view, dispatch }: ResultsProps) {
    const { result, entries, invalidCount, foundCount } = view;
    const [tab, setTab] = useState<Tab>("all");
    const [copied, setCopied] = useState(false);
    const announce = useAnnounce();

    const removedTotal = entries.length - result.kept.length;
    const tabs: [Tab, string, number][] = [
        ["all", "All", entries.length],
        ["kept", "Kept", result.kept.length],
        ["removed", "Removed", removedTotal],
    ];
    const rows = entries.filter((e) => (tab === "all" ? true : tab === "kept" ? e.status === "kept" : e.status !== "kept"));
    const shown = rows.slice(0, VISIBLE_ROWS);

    const breakdown: [string, number][] = [
        ["Duplicates", result.removed.duplicates],
        ["Invalid", invalidCount],
        ...(result.removed.manual ? ([["Removed by you", result.removed.manual]] as [string, number][]) : []),
    ];

    const copy = async () => {
        const ok = await copyList(result.kept);
        setCopied(ok);
        announce(ok ? `Copied ${pluralize(result.kept.length, "email")}` : "Couldn't copy. Try Export CSV instead.");
        if (ok) setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex min-h-dvh flex-col bg-bone text-basalt">
            <SiteHeader tone="light">
                <Button variant="ghost" className="px-2" onClick={() => dispatch({ type: "start-over" })}>
                    Start over
                </Button>
                <Button variant="secondary" onClick={copy}>
                    {copied ? "Copied" : "Copy all"}
                </Button>
                <Button
                    onClick={() => {
                        downloadCsv(result.kept);
                        announce(`Downloading ${pluralize(result.kept.length, "email")} as CSV`);
                    }}
                >
                    Export CSV
                </Button>
            </SiteHeader>

            <main className="mx-auto grid w-full max-w-[1440px] flex-1 gap-10 px-6 py-10 md:px-12 lg:grid-cols-[420px_1fr] lg:gap-16">
                <section aria-labelledby="result-heading" className="flex flex-col self-start lg:sticky lg:top-10">
                    <p className="font-mono text-[13px] tracking-[0.06em] text-ash">RESULT</p>
                    <h1
                        id="result-heading"
                        aria-label={`Clean list: ${formatCount(result.kept.length)} ${result.kept.length === 1 ? "email" : "emails"}`}
                        className="mt-2 text-[96px] leading-none font-bold tracking-[-0.035em] md:text-[150px]"
                    >
                        {formatCount(result.kept.length)}
                    </h1>
                    <p className="mt-4 font-mono text-[17px] text-ash">
                        clean {result.kept.length === 1 ? "email" : "emails"}, from {formatCount(foundCount)} found
                    </p>
                    <p className="mt-10 mb-3 font-mono text-[13px] tracking-[0.06em] text-ash">EMAILS REMOVED:</p>
                    <dl className="flex flex-col">
                        {breakdown.map(([label, value]) => (
                            <div key={label} className="flex items-center justify-between border-t border-bone-line py-5">
                                <dt className="flex items-center gap-3 text-xl font-medium">
                                    <CheckIcon />
                                    {label}
                                </dt>
                                <dd className="font-mono text-xl">{formatCount(value)}</dd>
                            </div>
                        ))}
                    </dl>
                    <p className="mt-8 font-mono text-sm leading-relaxed text-mid">
                        Removed items stay visible.
                        <br />
                        Nothing disappears without a reason.
                    </p>
                </section>

                <section aria-label="Addresses" className="flex flex-col self-start overflow-hidden rounded-[14px] border border-bone-line bg-paper">
                    <div role="tablist" aria-label="Filter addresses" className="flex gap-8 border-b border-bone-line px-6">
                        {tabs.map(([id, label, count]) => (
                            <button
                                key={id}
                                role="tab"
                                type="button"
                                aria-selected={tab === id}
                                onClick={() => setTab(id)}
                                className={cx("-mb-px cursor-pointer border-b-2 py-4 font-mono text-[15px]", tab === id ? "border-sky font-medium text-basalt" : "border-transparent text-ash hover:text-basalt")}
                            >
                                {label} <span className="ml-1.5">{formatCount(count)}</span>
                            </button>
                        ))}
                    </div>

                    <ul role="tabpanel" aria-label={`${tabs.find((t) => t[0] === tab)?.[1]} addresses`}>
                        {shown.map((entry, i) => (
                            <Row key={`${entry.email}-${i}`} email={entry.email} status={entry.status} dispatch={dispatch} />
                        ))}
                    </ul>

                    {rows.length > VISIBLE_ROWS && (
                        <p className="px-6 py-4 font-mono text-[13px] text-mid">
                            Showing {formatCount(VISIBLE_ROWS)} of {formatCount(rows.length)}. Export to get them all.
                        </p>
                    )}
                    {rows.length === 0 && <p className="px-6 py-10 text-center font-mono text-sm text-mid">Nothing here.</p>}
                </section>
            </main>
        </div>
    );
}

/** Check mark shown next to a removal that has been applied. */
function CheckIcon() {
    return (
        <svg aria-hidden="true" viewBox="0 0 20 20" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="10" cy="10" r="9" className="fill-sky stroke-sky" />
            <path d="M6 10.5l2.8 2.8L14 7.8" className="stroke-basalt" />
        </svg>
    );
}

function Row({ email, status, dispatch }: { email: string; status: EntryStatus; dispatch: Dispatch<FlowAction> }) {
    const kept = status === "kept";
    return (
        <li className="group flex min-h-14 items-center gap-4 border-b border-bone-line px-6 last:border-b-0 hover:bg-hover">
            <span aria-hidden="true" className={cx("size-2.5 shrink-0 rounded-full", kept ? "bg-sky" : "border-[1.5px] border-ash")} />
            <span className={cx("min-w-0 flex-1 truncate font-mono text-[17px]", kept ? "text-basalt" : "text-ash line-through")}>{email}</span>
            {kept && (
                <button
                    type="button"
                    aria-label={`Remove ${email}`}
                    className="cursor-pointer rounded-md border border-bone-line bg-paper px-3 py-1 text-sm font-medium opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    onClick={() => dispatch({ type: "remove-email", email })}
                >
                    Remove
                </button>
            )}
            {status === "manual" && (
                <button type="button" aria-label={`Restore ${email}`} className="cursor-pointer text-sm font-medium text-basalt hover:underline" onClick={() => dispatch({ type: "restore-email", email })}>
                    Restore
                </button>
            )}
            <span className={cx("shrink-0 rounded-full px-2.5 py-1 font-mono text-xs font-medium", kept ? "bg-sky-tint text-sky-ink" : "border border-bone-line text-ash")}>{TAG[status]}</span>
        </li>
    );
}
