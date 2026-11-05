// Role addresses: shared inboxes (info@, noreply@…) rather than a person. Removed by default in "Keep anyone off".

/** Local parts that belong to a role, not a person. */
export const ROLE_LOCAL_PARTS: ReadonlySet<string> = new Set([
    "info", "noreply", "no-reply", "donotreply", "do-not-reply", "support", "admin", "administrator", "sales", "hello",
    "contact", "office", "enquiries", "inquiries", "help", "team", "billing", "accounts", "marketing", "webmaster",
    "postmaster", "hostmaster", "abuse", "mailer-daemon", "newsletter", "careers", "jobs", "hr", "privacy", "security",
    "press", "media", "reception", "notifications", "orders", "feedback",
]);

/** Is this a role address (a shared inbox like `info@` or `noreply@`)? */
export function isRoleAddress(email: string): boolean {
    const local = email.slice(0, email.lastIndexOf("@")).split("+")[0].toLowerCase();
    return ROLE_LOCAL_PARTS.has(local);
}
