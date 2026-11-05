// "Keep anyone off": parses what the user types (a domain or a person) and decides which addresses are blocked.

/** A blocked domain, optionally including its subdomains, or a single blocked person. */
export type BlockEntry = { kind: "domain"; domain: string; includeSubdomains: boolean } | { kind: "email"; email: string };

/** Why an entry was refused. */
export type BlockEntryError = "empty" | "invalid" | "public-suffix";

/** Result of {@link parseBlockEntry}. */
export type ParseBlockResult = { ok: true; entry: BlockEntry } | { ok: false; error: BlockEntryError };

/** Two-level public endings where anyone can register a name (acme.co.za). */
const SECOND_LEVEL_SUFFIXES = new Set([
    "co.za", "org.za", "gov.za", "ac.za", "net.za", "web.za", "edu.za", "nom.za",
    "co.uk", "org.uk", "ac.uk", "gov.uk", "me.uk", "ltd.uk", "plc.uk", "net.uk",
    "com.au", "net.au", "org.au", "edu.au", "gov.au", "co.nz", "org.nz", "net.nz", "govt.nz",
    "co.in", "net.in", "org.in", "com.br", "net.br", "org.br", "co.jp", "ne.jp", "or.jp",
    "com.cn", "net.cn", "org.cn", "com.mx", "com.ar", "com.tr", "com.sg", "com.my", "com.ng",
    "com.hk", "co.ke", "co.il", "co.kr", "com.na", "co.bw", "co.zw",
]);

const DOMAIN_PATTERN = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const EMAIL_PATTERN = /^[a-z0-9_%+'-](?:[a-z0-9_%+'-]|\.(?!\.)){0,63}(?<!\.)@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.){1,8}[a-z]{2,24}$/;

/** Is this a public ending that many unrelated organisations share (com, co.za…)? */
export function isPublicSuffix(domain: string): boolean {
    return !domain.includes(".") || SECOND_LEVEL_SUFFIXES.has(domain);
}

/** Turns what the user typed into a block entry, or explains why it can't be used. */
export function parseBlockEntry(input: string): ParseBlockResult {
    const value = input.trim().toLowerCase();
    if (!value) return { ok: false, error: "empty" };

    if (value.indexOf("@") > 0) {
        return EMAIL_PATTERN.test(value) ? { ok: true, entry: { kind: "email", email: value } } : { ok: false, error: "invalid" };
    }

    const domain = value
        .replace(/^@/, "")
        .replace(/^[a-z]+:\/\//, "")
        .replace(/[/?#].*$/, "")
        .replace(/^\.+|\.+$/g, "");
    if (!DOMAIN_PATTERN.test(domain)) return { ok: false, error: "invalid" };
    if (isPublicSuffix(domain)) return { ok: false, error: "public-suffix" };
    return { ok: true, entry: { kind: "domain", domain, includeSubdomains: false } };
}

/** The part after the last @. */
export function domainOf(email: string): string {
    return email.slice(email.lastIndexOf("@") + 1);
}

/** Builds a fast "is this address blocked?" check for a set of entries. */
export function createBlocker(entries: readonly BlockEntry[]): (email: string) => boolean {
    const people = new Set<string>();
    const exactDomains = new Set<string>();
    const parentDomains = new Set<string>();
    for (const entry of entries) {
        if (entry.kind === "email") people.add(entry.email);
        else (entry.includeSubdomains ? parentDomains : exactDomains).add(entry.domain);
    }
    return (email) => {
        if (people.has(email)) return true;
        const domain = domainOf(email);
        if (exactDomains.has(domain) || parentDomains.has(domain)) return true;
        if (parentDomains.size === 0) return false;
        for (let dot = domain.indexOf("."); dot !== -1; dot = domain.indexOf(".", dot + 1)) {
            if (parentDomains.has(domain.slice(dot + 1))) return true;
        }
        return false;
    };
}

/** Is this address blocked by any of the entries? */
export function isBlocked(email: string, entries: readonly BlockEntry[]): boolean {
    return createBlocker(entries)(email);
}

/** Counts how many addresses a domain would remove: exactly, and additionally via subdomains. */
export function countDomainMatches(emails: readonly string[], domain: string): { exact: number; subdomains: number } {
    let exact = 0;
    let subdomains = 0;
    const suffix = `.${domain}`;
    for (const email of emails) {
        const d = domainOf(email);
        if (d === domain) exact++;
        else if (d.endsWith(suffix)) subdomains++;
    }
    return { exact, subdomains };
}
