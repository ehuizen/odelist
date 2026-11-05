// End-to-end tests of Odelist in jsdom: real screens, real reducer and core, with extraction running inline (no Worker in jsdom).
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App, isAppPath } from "./App";

function setup(pathname = "/") {
    const user = userEvent.setup();
    render(<App processingMinimumMs={0} pathname={pathname} />);
    return user;
}

async function pasteAndFind(user: ReturnType<typeof userEvent.setup>, text: string) {
    await user.click(screen.getByRole("button", { name: /or paste text/i }));
    await user.click(screen.getByLabelText(/paste text/i, { selector: "textarea" }));
    await user.paste(text);
    await user.click(screen.getByRole("button", { name: /find emails/i }));
}

describe("Odelist app", () => {
    it("goes from paste to results, removing duplicates and keeping role addresses", async () => {
        const user = setup();
        expect(screen.getByRole("heading", { level: 1, name: /find emails in the mess/i })).toBeInTheDocument();
        expect(screen.queryByRole("button", { name: /find emails/i })).not.toBeInTheDocument();

        await pasteAndFind(user, "Jo <a@x.example>, A@X.example; info@x.example | b@y.example and asdf@asdf");

        expect(await screen.findByRole("heading", { level: 1, name: /clean list: 3/i })).toBeInTheDocument();
        expect(screen.getByText(/from 4 found/)).toBeInTheDocument();

        const list = screen.getByRole("tabpanel");
        expect(within(list).getAllByText("a@x.example")).toHaveLength(2);
        expect(within(list).getByText("Duplicate")).toBeInTheDocument();
        expect(within(list).queryByText("Role")).not.toBeInTheDocument();
    });

    it("removes and restores an address by hand", async () => {
        const user = setup();
        await pasteAndFind(user, "a@x.example b@y.example");
        await screen.findByRole("heading", { level: 1, name: /clean list: 2/i });

        await user.click(screen.getByRole("button", { name: "Remove b@y.example" }));
        expect(screen.getByRole("heading", { level: 1, name: /clean list: 1/i })).toBeInTheDocument();
        expect(screen.getByText("Removed by you", { selector: "span" })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Restore b@y.example" }));
        expect(screen.getByRole("heading", { level: 1, name: /clean list: 2/i })).toBeInTheDocument();
    });

    it("filters with the Kept and Removed tabs", async () => {
        const user = setup();
        await pasteAndFind(user, "a@x.example a@x.example info@x.example");
        await screen.findByRole("heading", { level: 1, name: /clean list: 2/i });

        await user.click(screen.getByRole("tab", { name: /kept/i }));
        expect(within(screen.getByRole("tabpanel")).getAllByRole("listitem")).toHaveLength(2);
        await user.click(screen.getByRole("tab", { name: /removed/i }));
        expect(within(screen.getByRole("tabpanel")).getAllByRole("listitem")).toHaveLength(1);
    });

    it("has no role-based option", async () => {
        const user = setup();
        await pasteAndFind(user, "a@x.example info@x.example");
        await screen.findByRole("heading", { level: 1, name: /clean list: 2/i });
        expect(screen.queryByText(/role/i)).not.toBeInTheDocument();
    });

    it("shows the stag page when nothing is found, and Paste text reopens the paste box", async () => {
        const user = setup();
        await pasteAndFind(user, "no addresses here, just asdf@asdf and @handle");
        expect(await screen.findByRole("heading", { level: 1, name: /nothing in here but noise/i })).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /paste text/i }));
        expect(screen.getByLabelText(/paste text/i, { selector: "textarea" })).toBeInTheDocument();
    });

    it("refuses more than 50,000 emails with a clear notice", async () => {
        const user = setup();
        await pasteAndFind(user, Array.from({ length: 50_001 }, (_, i) => `u${i}@x.example`).join("\n"));
        const alert = await screen.findByRole("alert");
        expect(within(alert).getByText(/that’s a big one/i)).toBeInTheDocument();
        await user.click(within(alert).getByRole("button", { name: /split it/i }));
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("starts over from Results", async () => {
        const user = setup();
        await pasteAndFind(user, "a@x.example");
        await screen.findByRole("heading", { level: 1, name: /clean list: 1/i });
        await user.click(screen.getByRole("button", { name: /start over/i }));
        expect(screen.getByRole("heading", { level: 1, name: /find emails in the mess/i })).toBeInTheDocument();
    });

    it("shows the 404 page for unknown paths", () => {
        setup("/nope");
        expect(screen.getByRole("heading", { level: 1, name: "Error 404" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /back to odelist/i })).toHaveAttribute("href", "/");
    });
});

describe("isAppPath", () => {
    it("accepts the root and index.html, with or without a base path", () => {
        expect(isAppPath("/", "/")).toBe(true);
        expect(isAppPath("/index.html", "/")).toBe(true);
        expect(isAppPath("/app/", "/app/")).toBe(true);
        expect(isAppPath("/other", "/")).toBe(false);
    });
});
