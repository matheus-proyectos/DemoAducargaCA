import type { Config } from "tailwindcss";

// Los colores salen de variables CSS (canales RGB) inyectadas desde src/lib/brand.ts.
// Así, cambiar la paleta oficial de ADUCARGA requiere editar un solo archivo.
const rgb = (v: string) => `rgb(var(${v}) / <alpha-value>)`;

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: rgb("--brand"), dark: rgb("--brand-dark"), soft: rgb("--brand-soft") },
        accent: { DEFAULT: rgb("--accent"), dark: rgb("--accent-dark") },
      },
      fontFamily: { sans: ["var(--font-sans)", "system-ui", "sans-serif"] },
      keyframes: {
        rise: { "0%": { opacity: "0", transform: "translateY(8px)" }, "100%": { opacity: "1", transform: "none" } },
        pulseRing: {
          "0%": { boxShadow: "0 0 0 0 rgb(var(--accent) / .55)" },
          "100%": { boxShadow: "0 0 0 12px rgb(var(--accent) / 0)" },
        },
        grow: { "0%": { transform: "scaleY(0)" }, "100%": { transform: "scaleY(1)" } },
      },
      animation: {
        rise: "rise .45s ease both",
        pulseRing: "pulseRing 1.8s ease-out infinite",
        grow: "grow .6s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
