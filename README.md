# Odelist

Extract email addresses from pasted text or files and clean the list before you use it.

## Features

- **Extract** addresses from pasted text or uploaded files: CSV, Excel, HTML, JSON, logs and CRM exports. Handles addresses in pipes, brackets, `mailto:` links and JSON.
- **Deduplicate** case-insensitively. Gmail look-alikes (`j.doe+news@gmail.com` and `jdoe@gmail.com`) are flagged so you can choose whether to merge them.
- **Suppress** addresses found in an unsubscribe or bounce list (Excel, CSV or pasted).
- **Exclude** whole domains (optionally including subdomains), individual addresses, and role addresses such as `info@`.
- **Export** the result by copying it or downloading CSV or Excel. The result can be searched first.
- **Quick mode**: "Just remove duplicates" skips the other steps.

## Privacy

All processing happens in the browser. Pasted text and uploaded files are never sent to a server or stored. Closing the tab discards them.

The production build sets a Content-Security-Policy with `connect-src 'self'`, so the browser blocks requests to other origins.

## Development

Requires Node 20 or later.

```bash
npm install
npm run dev        # dev server at http://localhost:5173
npm test           # unit and component tests (Vitest)
npm run typecheck  # TypeScript (strict)
npm run lint       # ESLint
npm run build      # production build to dist/
npm run preview    # serve the production build
```

### Project layout

- `src/core/`: email extraction, deduplication, suppression and exclusion as pure functions.
- `src/screens/`, `src/components/`, `src/app/`: UI.
- File parsing runs in a Web Worker so large files don't block the UI.
- `test/fixtures/`: sample inputs used by tests.
- `legacy/`: the original single-page version, kept for reference.

More detail: [architecture](docs/architecture.md), [core functions](docs/core.md), [screens](docs/screens.md).

### Stack

React, Vite, TypeScript, Tailwind CSS v4, [Untitled UI React](https://www.untitledui.com/react) components, SheetJS (Excel), Vitest and React Testing Library.

## Deployment

CI (`.github/workflows/ci.yml`) runs typecheck, lint, tests and a build on every push and pull request.

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the site and rsyncs `dist/` to a VPS over SSH. The server serves it with Caddy. The SSH key is restricted to writing the site directory (rrsync).

Required repository secrets: `SSH_PRIVATE_KEY`, `SSH_HOST`, `SSH_PORT`, `SSH_KNOWN_HOSTS`.

## Third-party software

- [Untitled UI React](https://github.com/untitleduico/react): UI components and icons (MIT).
- [SheetJS Community Edition](https://sheetjs.com): Excel parsing (Apache-2.0).

## License

[MIT](LICENSE) © Eugene Esterhuizen
