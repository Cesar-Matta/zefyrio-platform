"use client";
import { useEffect } from "react";

// Registers /sw.js and aggressively activates updates so mobile users
// who had the v2 (broken) service worker get the v3 shell on next page load
// instead of being pinned to a stale cache.
export default function PwaRegistry() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let reloadedForNewSw = false;

    const onLoad = async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" });
        console.log("SW enlazado:", reg.scope);

        // If a worker is already waiting at registration time (returning user
        // who had v2 cached), tell it to skip waiting immediately.
        if (reg.waiting) reg.waiting.postMessage("SKIP_WAITING");

        // When a new worker is found later, send SKIP_WAITING once it's installed.
        reg.addEventListener("updatefound", () => {
          const installing = reg.installing;
          if (!installing) return;
          installing.addEventListener("statechange", () => {
            if (installing.state === "installed" && navigator.serviceWorker.controller) {
              installing.postMessage("SKIP_WAITING");
            }
          });
        });
      } catch (err) {
        console.log("Fallo SW:", err);
      }
    };

    // When the active SW changes (after SKIP_WAITING + clients.claim()), reload
    // once so the page is rendered by the new shell.
    const onControllerChange = () => {
      if (reloadedForNewSw) return;
      reloadedForNewSw = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  return null;
}
