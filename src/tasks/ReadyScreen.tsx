import { useEffect } from "react";
import { useT } from "../i18n";

const READY_MS = 2000;

/**
 * A short "hold the device back, get set" beat shown after Start and before the
 * first trial of a task. Auto-advances via `onReady` — which must be stable
 * (wrap it in useCallback) or the timer restarts on every render.
 */
export function ReadyScreen({ onReady }: { onReady: () => void }) {
  const t = useT();
  useEffect(() => {
    const id = window.setTimeout(onReady, READY_MS);
    return () => window.clearTimeout(id);
  }, [onReady]);

  return (
    <div className="screen ready-screen">
      <p className="ready-text">{t("common.ready")}</p>
    </div>
  );
}
