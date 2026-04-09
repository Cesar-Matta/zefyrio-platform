"use client";
import { useEffect } from "react";

export default function PwaRegistry() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("/sw.js").then(
          (reg) => console.log("SW enlazado: ", reg.scope),
          (err) => console.log("Fallo SW: ", err)
        );
      });
    }
  }, []);
  
  return null;
}
