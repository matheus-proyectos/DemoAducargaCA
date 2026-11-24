"use client";
// Carga diferida: three.js solo se descarga en las páginas que muestran el globo
// y nunca se ejecuta en el servidor.
import dynamic from "next/dynamic";
import type { RouteGlobeProps } from "./RouteGlobe";

const RouteGlobe = dynamic(() => import("./RouteGlobe"), { ssr: false });

export function Globe(props: RouteGlobeProps) {
  return <RouteGlobe {...props} />;
}
