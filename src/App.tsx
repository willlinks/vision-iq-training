import { useState } from "react";
import { ContrastDetection } from "./tasks/ContrastDetection";
import { MatrixReasoning } from "./tasks/MatrixReasoning";
import { GaborLab } from "./tasks/GaborLab";
import { useI18n } from "./i18n";

type Route = "home" | "contrast" | "matrix" | "lab";

export function App() {
  const [route, setRoute] = useState<Route>("home");
  const { t, lang, setLang } = useI18n();

  return (
    <>
      <div className="topbar">
        <h1>{t("nav.title")}</h1>
        <button
          className="topbar-btn"
          onClick={() => setLang(lang === "ja" ? "en" : "ja")}
          aria-label="switch language"
        >
          {t("lang.switchTo")}
        </button>
        <button
          className="topbar-btn"
          onClick={() => setRoute("home")}
          hidden={route === "home"}
        >
          {t("nav.home")}
        </button>
      </div>

      {route === "home" && (
        <div className="screen">
          <h2>{t("home.heading")}</h2>
          <p className="muted">{t("home.blurb")}</p>
          <button className="primary" onClick={() => setRoute("contrast")}>
            {t("home.contrast")}
          </button>
          <button className="primary" onClick={() => setRoute("matrix")}>
            {t("home.matrix")}
          </button>
          <button onClick={() => setRoute("lab")}>{t("home.lab")}</button>
        </div>
      )}

      {route === "contrast" && (
        <ContrastDetection onExit={() => setRoute("home")} />
      )}
      {route === "matrix" && (
        <MatrixReasoning onExit={() => setRoute("home")} />
      )}
      {route === "lab" && <GaborLab onExit={() => setRoute("home")} />}
    </>
  );
}
