// Small shared UI pieces: buttons, loader, stag and site header.
import { type ButtonHTMLAttributes, type ReactNode, useEffect, useState } from "react";
import { cx } from "@/utils/cx";
import { Wordmark } from "./Wordmark";

/** Where "Report a bug or feature" goes. */
export const REPORT_URL = "https://github.com/ehuizen/odelist/issues";

type Variant = "primary" | "secondary" | "ghost" | "light";

const VARIANTS: Record<Variant, string> = {
    primary: "bg-basalt text-bone hover:bg-black",
    secondary: "bg-paper text-basalt border border-bone-line hover:bg-hover",
    ghost: "text-ash hover:text-basalt",
    light: "bg-bone text-basalt hover:bg-white",
};

/** Class names for a button-looking element. */
export function buttonClass(variant: Variant = "primary", className?: string): string {
    return cx(
        "inline-flex cursor-pointer items-center justify-center gap-2 rounded-[10px] px-[22px] py-[13px] text-base font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky disabled:cursor-not-allowed disabled:opacity-40",
        VARIANTS[variant],
        className,
    );
}

export function Button({ variant = "primary", className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
    return <button type="button" className={buttonClass(variant, className)} {...props} />;
}

/** Three dots that take turns growing. */
export function Loader({ label = "Loading", tone = "light" }: { label?: string; tone?: "light" | "dark" }) {
    const dot = tone === "light" ? "bg-bone" : "bg-basalt";
    return (
        <span role="status" aria-label={label} className="inline-flex items-center gap-2.5">
            <span className={cx("loader-dot size-[22px] rounded-full", dot)} />
            <span className={cx("loader-dot size-[22px] rounded-full", dot)} />
            <span className={cx("loader-dot size-[22px] rounded-full", dot)} />
        </span>
    );
}

/** The stag, shown on the home, empty and 404 pages, with a body fill that turns brand blue while a file is dragged over the parent `group` dropzone. `tone` is the page background. */
export function HeroStag({ tone, className }: { tone: "light" | "dark"; className?: string }) {
    const base = import.meta.env.BASE_URL;
    return (
        <span
            aria-hidden="true"
            className={cx(
                "relative inline-block aspect-[184/232] overflow-hidden transition-transform duration-300 group-data-[drop-target]:scale-110",
                className,
            )}
        >
            <img
                src={`${base}stag-fill.svg`}
                alt=""
                className="absolute inset-0 size-full opacity-0 transition-opacity duration-300 group-data-[drop-target]:opacity-100"
            />
            {tone === "dark" ? (
                <img src={`${base}stag-light.svg`} alt="" className="absolute inset-0 size-full" />
            ) : (
                // The dark stag is a full 300x300 canvas; crop it to the same frame as the fill.
                <img src={`${base}stag.svg`} alt="" className="absolute max-w-none" style={{ width: "163.04%", left: "-31.52%", top: "-14.66%" }} />
            )}
        </span>
    );
}

/** Top bar with the wordmark and screen-specific actions. */
export function SiteHeader({ tone, children }: { tone: "dark" | "light"; children?: ReactNode }) {
    return (
        <header
            className={cx(
                "sticky top-0 z-20 flex h-[100px] items-center justify-between border-b px-6 md:px-12",
                tone === "dark" ? "border-line-dark bg-basalt text-bone" : "border-bone-line bg-bone text-basalt",
            )}
        >
            <a href={import.meta.env.BASE_URL} aria-label="Odelist home" className="rounded focus-visible:outline-2 focus-visible:outline-sky">
                <Wordmark className="h-8 w-auto" />
            </a>
            <div className="flex items-center gap-3 md:gap-5">{children}</div>
        </header>
    );
}

/** Link to report problems. */
export function ReportLink() {
    return (
        <a href={REPORT_URL} target="_blank" rel="noreferrer" className="hidden text-sm text-ash hover:text-basalt sm:inline">
            Report a bug or feature
        </a>
    );
}

/** Bottom-left thank-you note that appears shortly after it mounts and can be dismissed. */
export function FeedbackToast({ delayMs = 1200 }: { delayMs?: number }) {
    const [visible, setVisible] = useState(false);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delayMs);
        return () => clearTimeout(timer);
    }, [delayMs]);

    if (!visible || dismissed) return null;
    return (
        <aside
            role="status"
            className="fixed bottom-6 left-6 z-10 flex max-w-[360px] items-start gap-4 rounded-[14px] border border-bone-line bg-paper p-5 shadow-lg transition duration-300 starting:translate-y-2 starting:opacity-0"
        >
            <p className="text-[15px] leading-snug">
                <strong className="font-bold">Hey! Thanks for using Odelist.</strong> If you spot any errors or bugs, please{" "}
                <a href={REPORT_URL} target="_blank" rel="noreferrer" className="font-medium underline underline-offset-4 hover:text-ash">
                    let us know on GitHub
                </a>
                .
            </p>
            <button
                type="button"
                aria-label="Dismiss"
                className="cursor-pointer px-1 text-lg leading-none text-ash hover:text-basalt"
                onClick={() => setDismissed(true)}
            >
                ×
            </button>
        </aside>
    );
}
