// Screen-reader announcements: a polite live region any component can post short messages to ("Copied 10,805 emails").
import { createContext, type ReactNode, useCallback, useContext, useState } from "react";

const AnnounceContext = createContext<(message: string) => void>(() => {});

/** Provides `useAnnounce()` and renders one visually hidden live region. */
export function AnnouncerProvider({ children }: { children: ReactNode }) {
    const [announcement, setAnnouncement] = useState({ message: "", key: 0 });
    const announce = useCallback((message: string) => setAnnouncement((prev) => ({ message, key: prev.key + 1 })), []);
    return (
        <AnnounceContext.Provider value={announce}>
            {children}
            <div aria-live="polite" role="status" className="sr-only">
                <span key={announcement.key}>{announcement.message}</span>
            </div>
        </AnnounceContext.Provider>
    );
}

/** Returns `announce(message)` for posting a message to screen readers. */
export function useAnnounce(): (message: string) => void {
    return useContext(AnnounceContext);
}
