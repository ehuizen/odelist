// Small formatting helpers shared by the screens.

const countFormatter = new Intl.NumberFormat("en-US");

/** Formats a count with thousands separators: 12449 → "12,449". */
export function formatCount(n: number): string {
    return countFormatter.format(n);
}

/** "1 email" / "2 emails". */
export function pluralize(n: number, singular: string, plural = `${singular}s`): string {
    return `${formatCount(n)} ${n === 1 ? singular : plural}`;
}

/** Human file size: 2048 → "2 KB", 1572864 → "1.5 MB". */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}
