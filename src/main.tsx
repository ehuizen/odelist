// Browser entry point: loads the Geist fonts and global styles, then mounts Odelist into #root.
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import "@/styles/globals.css";

const root = document.getElementById("root");
if (!root) throw new Error("Odelist: #root element missing from index.html");

createRoot(root).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
