"use client";
/**
 * Coreografía del Home con el mismo stack que los sitios MATHEUS:
 *  - Lenis 1.3 para scroll suave (solo en el Home; los paneles usan scroll nativo).
 *  - GSAP ScrollTrigger para revelar secciones ([data-reveal], [data-stagger]).
 *  - GSAP SplitText para el titular del hero ([data-split]).
 * Respeta prefers-reduced-motion y limpia todo al salir de la página.
 */
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import Lenis from "lenis";

export function HomeMotion() {
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger, SplitText);

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (t: number) => lenis.raf(t * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Anclas internas con Lenis
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"], a[href^="/#"]');
      if (!a) return;
      const id = a.getAttribute("href")!.replace(/^\//, "");
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: -72 });
      }
    };
    document.addEventListener("click", onClick);

    const ctx = gsap.context(() => {
      document.querySelectorAll<HTMLElement>("[data-split]").forEach((el) => {
        const split = SplitText.create(el, { type: "words", mask: "words" });
        gsap.from(split.words, { yPercent: 110, duration: 0.9, ease: "power4.out", stagger: 0.045, delay: 0.1 });
      });
      gsap.from("[data-hero-fade]", { y: 18, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.1, delay: 0.45 });
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { y: 36, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%" } });
      });
      gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
        gsap.from(group.children, {
          y: 28, opacity: 0, duration: 0.7, ease: "power3.out", stagger: 0.08,
          scrollTrigger: { trigger: group, start: "top 85%" },
        });
      });
    });

    return () => {
      ctx.revert();
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(tick);
      lenis.destroy();
    };
  }, []);
  return null;
}
