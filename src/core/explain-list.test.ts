// Tests for explainList: labels match cleanList's counts and order for the v1 rules.
import { describe, expect, it } from "vitest";
import { cleanList, DEFAULT_CLEAN_OPTIONS } from "./clean-list";
import { explainList } from "./explain-list";

const count = (entries: ReturnType<typeof explainList>, status: string) => entries.filter((e) => e.status === status).length;

describe("explainList", () => {
    it("keeps the first occurrence and labels later ones as duplicates", () => {
        const entries = explainList(["a@x.example", "b@x.example", "a@x.example"], { manuallyRemoved: new Set() });
        expect(entries).toEqual([
            { email: "a@x.example", status: "kept" },
            { email: "b@x.example", status: "kept" },
            { email: "a@x.example", status: "duplicate" },
        ]);
    });

    it("labels manual removals", () => {
        const entries = explainList(["info@x.example", "a@x.example", "b@x.example"], { manuallyRemoved: new Set(["b@x.example"]) });
        expect(entries.map((e) => e.status)).toEqual(["kept", "kept", "manual"]);
    });

    it("agrees with cleanList on every count", () => {
        const found = ["a@x.example", "a@x.example", "info@x.example", "sales@y.example", "b@y.example", "c@z.example", "b@y.example", "noreply@z.example"];
        const manuallyRemoved = new Set(["c@z.example", "sales@y.example"]);
        const entries = explainList(found, { manuallyRemoved });
        const result = cleanList(found, { ...DEFAULT_CLEAN_OPTIONS, removeRoleAddresses: false, manuallyRemoved });

        expect(entries.filter((e) => e.status === "kept").map((e) => e.email)).toEqual(result.kept);
        expect(count(entries, "duplicate")).toBe(result.removed.duplicates);
        expect(count(entries, "manual")).toBe(result.removed.manual);
    });
});
