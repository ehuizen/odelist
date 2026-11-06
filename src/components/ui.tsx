// Small shared UI pieces: buttons, loader, stag and site header.
import type { ButtonHTMLAttributes, ReactNode } from "react";
import stagUrl from "@/assets/stag.svg";
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

/** The stag, used on empty and error pages. */
export function Stag({ className }: { className?: string }) {
    return <img src={stagUrl} alt="" aria-hidden="true" className={cx("mix-blend-multiply", className)} />;
}

/** The stag as a single-colour line drawing; takes its colour from `currentColor`. */
export function StagLines({ className }: { className?: string }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="42 10 120 172"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cx("transition-transform duration-300 group-data-[drop-target]:scale-110", className)}
        >
            <path d="M78 52 C70 40 66 28 70 16 M70 30 L58 26 M74 40 L62 40" />
            <path d="M112 52 C120 40 124 28 120 16 M120 30 L132 26 M116 40 L128 40" />
            <path
                d="M74 58 C74 48 116 48 116 58 L116 92 C116 96 150 98 150 120 C150 138 132 146 112 146 L84 146 C76 146 74 138 74 128 Z"
                className="fill-transparent transition-[fill] duration-300 group-data-[drop-target]:fill-sky"
            />
            <path d="M86 146 V176 M98 146 V176 M120 146 V176 M132 144 V176" />
            <circle
                cx="86"
                cy="70"
                r="1.5"
                className="fill-current stroke-current transition-colors duration-300 group-data-[drop-target]:fill-basalt group-data-[drop-target]:stroke-basalt"
            />
            <circle
                cx="104"
                cy="70"
                r="1.5"
                className="fill-current stroke-current transition-colors duration-300 group-data-[drop-target]:fill-basalt group-data-[drop-target]:stroke-basalt"
            />
            <path d="M92 80 L95 83 L98 80" strokeWidth="3" className="transition-colors duration-300 group-data-[drop-target]:stroke-basalt" />
        </svg>
    );
}

/** Top bar with the wordmark and screen-specific actions. */
export function SiteHeader({ tone, children }: { tone: "dark" | "light"; children?: ReactNode }) {
    return (
        <header
            className={cx(
                "flex h-[100px] items-center justify-between border-b px-6 md:px-12",
                tone === "dark" ? "border-line-dark text-bone" : "border-bone-line text-basalt",
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
