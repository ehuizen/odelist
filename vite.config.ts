// Vite build and Vitest config.
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

/** Content-Security-Policy for production builds. */
const CONTENT_SECURITY_POLICY = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "worker-src 'self' blob:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'none'",
].join("; ");

/** Adds the CSP `<meta>` tag to index.html during `vite build` only. */
function contentSecurityPolicy(): Plugin {
    return {
        name: "odelist-csp",
        apply: "build",
        transformIndexHtml: (html) => html.replace("<head>", `<head>\n        <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`),
    };
}

export default defineConfig({
    base: process.env.BASE_PATH ?? "/",
    plugins: [react(), tailwindcss(), contentSecurityPolicy()],
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "./src"),
        },
    },
    worker: {
        format: "es",
    },
    test: {
        environment: "node",
        setupFiles: ["./src/test/setup.ts"],
        include: ["src/**/*.test.{ts,tsx}"],
    },
});
