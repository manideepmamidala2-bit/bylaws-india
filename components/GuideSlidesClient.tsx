"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { GuideSection, GuideSlideItem } from "@/lib/guide";

interface GuideSlidesClientProps {
  slides: GuideSlideItem[];
  sections: Array<
    Pick<GuideSection, "id" | "number" | "title" | "firstSlideIndex">
  >;
  releaseVersion: string;
  currentAsOfDate: string;
}

function resolveSlideIndexFromHash(
  hash: string,
  slides: ReadonlyArray<GuideSlideItem>,
  sections: ReadonlyArray<
    Pick<GuideSection, "id" | "number" | "title" | "firstSlideIndex">
  >
): number | null {
  const cleaned = hash.replace(/^#/, "").trim();
  if (!cleaned) return null;

  // Match #slide-<id> or #<section-id>
  const exactSlideIdx = slides.findIndex(
    (s) => s.slideId === cleaned || `slide-${s.sectionId}` === cleaned
  );
  if (exactSlideIdx !== -1) return exactSlideIdx;

  const secMatch = sections.find(
    (sec) => sec.id === cleaned || `section-${sec.id}` === cleaned
  );
  if (secMatch) return secMatch.firstSlideIndex;

  // Match #/<index> (reveal.js convention)
  const numMatch = /^\/?(\d+)$/.exec(cleaned);
  if (numMatch) {
    const idx = Number(numMatch[1]);
    if (idx >= 0 && idx < slides.length) return idx;
  }
  return null;
}

export function GuideSlidesClient({
  slides,
  sections,
  releaseVersion,
  currentAsOfDate,
}: GuideSlidesClientProps) {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [speakerViewOpen, setSpeakerViewOpen] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const revealDeckElRef = useRef<HTMLDivElement | null>(null);
  const revealInstanceRef = useRef<{
    slide: (h: number) => void;
    destroy?: () => void;
  } | null>(null);

  const goToSlide = useCallback(
    (nextIndex: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, nextIndex));
      setCurrentIndex(clamped);
      try {
        revealInstanceRef.current?.slide(clamped);
      } catch {
        // Ignore in JSDOM or before reveal initialize completes
      }
      if (typeof window !== "undefined") {
        const targetSlide = slides[clamped];
        if (targetSlide) {
          window.history.replaceState(
            null,
            "",
            `#${targetSlide.slideId}`
          );
        }
      }
    },
    [slides]
  );

  // Sync initial URL hash and hashchange events
  useEffect(() => {
    if (typeof window === "undefined") return;
    const applyHash = () => {
      const idx = resolveSlideIndexFromHash(
        window.location.hash,
        slides,
        sections
      );
      if (idx !== null) {
        goToSlide(idx);
      }
    };
    applyHash();
    window.addEventListener("hashchange", applyHash);
    return () => window.removeEventListener("hashchange", applyHash);
  }, [slides, sections, goToSlide]);

  // Initialize reveal.js on the client
  useEffect(() => {
    let cancelled = false;
    async function initReveal() {
      if (!revealDeckElRef.current || typeof window === "undefined") return;
      try {
        const [{ default: Reveal }, { default: RevealNotes }] =
          await Promise.all([
            import("reveal.js"),
            import("reveal.js/plugin/notes"),
          ]);
        if (cancelled || !revealDeckElRef.current) return;
        const deck = new Reveal(revealDeckElRef.current, {
          embedded: true,
          controls: false,
          progress: false,
          slideNumber: false,
          hash: false,
          keyboard: false,
          overview: false,
          transition: "none",
          backgroundTransition: "none",
          plugins: [RevealNotes],
        });
        await deck.initialize();
        if (cancelled) {
          deck.destroy?.();
          return;
        }
        revealInstanceRef.current = deck;
        const initialIdx = resolveSlideIndexFromHash(
          window.location.hash,
          slides,
          sections
        );
        if (initialIdx !== null) {
          deck.slide(initialIdx);
        }
        deck.on("slidechanged", (event: unknown) => {
          const ev = event as { indexh?: number };
          if (typeof ev.indexh === "number") {
            setCurrentIndex(ev.indexh);
          }
        });
      } catch {
        // Fallback cleanly in headless test environments without full layout APIs
      }
    }
    void initReveal();
    return () => {
      cancelled = true;
      try {
        revealInstanceRef.current?.destroy?.();
      } catch {
        // ignore
      }
      revealInstanceRef.current = null;
    };
  }, [slides, sections]);

  // Speaker view timer
  useEffect(() => {
    if (!speakerViewOpen) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [speakerViewOpen]);

  const toggleFullscreen = useCallback(async () => {
    if (typeof document === "undefined") return;
    try {
      if (!document.fullscreenElement && containerRef.current?.requestFullscreen) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((prev) => !prev);
    }
  }, []);

  // Keyboard shortcuts (ArrowRight, ArrowLeft, Space, Home, End, S for speaker view, F for fullscreen)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goToSlide(currentIndex + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goToSlide(currentIndex - 1);
      } else if (e.key === "Home") {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === "End") {
        e.preventDefault();
        goToSlide(slides.length - 1);
      } else if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        setSpeakerViewOpen((prev) => !prev);
      } else if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        void toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIndex, slides.length, goToSlide, toggleFullscreen]);

  const currentSlide = slides[currentIndex] ?? slides[0];
  const nextSlide = slides[currentIndex + 1] ?? null;
  const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, "0");
  const secs = String(elapsedSeconds % 60).padStart(2, "0");

  return (
    <div
      ref={containerRef}
      data-testid="guide-slides-deck"
      className="space-y-6 bg-[#f5f3ed] text-[#080909]"
    >
      {/* Top presentation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#c8ccc0] pb-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/guide#section-${currentSlide.sectionId}`}
            data-testid="slides-back-to-reading"
            className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#080909] no-underline hover:bg-[#efeee8]"
          >
            ← Reading mode
          </Link>
          <span
            data-testid="slides-counter"
            className="font-mono text-xs uppercase tracking-[0.12em] text-[#5b5e56]"
          >
            Slide {currentIndex + 1} / {slides.length} · Release v{releaseVersion}{" "}
            · Current as of {currentAsOfDate}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            data-testid="slides-prev-btn"
            disabled={currentIndex === 0}
            onClick={() => goToSlide(currentIndex - 1)}
            className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#080909] disabled:opacity-40"
          >
            ← Prev
          </button>
          <button
            type="button"
            data-testid="slides-next-btn"
            disabled={currentIndex >= slides.length - 1}
            onClick={() => goToSlide(currentIndex + 1)}
            className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#080909] px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#f5f3ed] disabled:opacity-40"
          >
            Next →
          </button>
          <button
            type="button"
            data-testid="slides-speaker-view-btn"
            aria-pressed={speakerViewOpen}
            onClick={() => setSpeakerViewOpen((prev) => !prev)}
            className={`inline-flex min-h-[44px] items-center border px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.12em] ${
              speakerViewOpen
                ? "border-[#080909] border-b-2 border-b-[#ff6b52] bg-[#efeee8] font-semibold text-[#080909]"
                : "border-[#080909] bg-[#f5f3ed] text-[#080909] hover:bg-[#efeee8]"
            }`}
          >
            Speaker view (S)
          </button>
          <button
            type="button"
            data-testid="slides-fullscreen-btn"
            aria-pressed={isFullscreen}
            onClick={() => void toggleFullscreen()}
            className="inline-flex min-h-[44px] items-center border border-[#080909] bg-[#f5f3ed] px-3.5 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-[#080909] hover:bg-[#efeee8]"
          >
            {isFullscreen ? "Exit full screen" : "Full screen (F)"}
          </button>
        </div>
      </div>

      {/* Section jumper strip — coral accent (#ff6b52) strictly for the current item only */}
      <nav
        aria-label="Slide sections"
        data-testid="slides-section-strip"
        className="flex flex-wrap gap-1.5"
      >
        {sections.map((sec) => {
          const isCurrentSec = currentSlide.sectionId === sec.id;
          return (
            <button
              key={sec.id}
              type="button"
              data-testid={`slides-jump-section-${sec.id}`}
              aria-current={isCurrentSec ? "step" : undefined}
              onClick={() => goToSlide(sec.firstSlideIndex)}
              className={`inline-flex min-h-[36px] items-center border px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.08em] ${
                isCurrentSec
                  ? "border-[#080909] border-b-2 border-b-[#ff6b52] bg-[#efeee8] font-semibold text-[#080909]"
                  : "border-[#c8ccc0] bg-[#f5f3ed] text-[#5b5e56] hover:text-[#080909]"
              }`}
            >
              {sec.number} · {sec.title}
            </button>
          );
        })}
      </nav>

      {/* Active slide canvas + reveal.js deck */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-1">
        <div
          ref={revealDeckElRef}
          className="reveal border-2 border-[#080909] bg-[#f5f3ed] p-6 md:p-12"
        >
          <div className="slides">
            {slides.map((slide, idx) => {
              const isActive = idx === currentIndex;
              return (
                <section
                  key={slide.slideId}
                  id={slide.slideId}
                  data-testid={`guide-slide-${slide.slideId}`}
                  aria-hidden={!isActive}
                  className={isActive ? "block space-y-6" : "hidden"}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#c8ccc0] pb-3">
                    <span className="dg-mono text-[#5b5e56]">
                      {slide.kicker}
                    </span>
                    <span className="font-mono text-xs text-[#5b5e56]">
                      {idx + 1} / {slides.length}
                    </span>
                  </div>

                  <h2
                    data-testid="active-slide-heading"
                    className="max-w-3xl text-3xl font-semibold tracking-tight text-[#080909] md:text-4xl"
                  >
                    {slide.heading}
                  </h2>

                  <p
                    data-testid="active-slide-summary"
                    className="dg-serif max-w-3xl border-l-4 border-[#ff6b52] pl-5 text-xl leading-relaxed text-[#080909] md:text-2xl"
                  >
                    {slide.summaryText}
                  </p>

                  {slide.kind === "diagram" && slide.diagram && (
                    <figure className="mt-6 border border-[#080909] bg-[#efeee8] p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`/guide/diagrams/${slide.diagram.id}.svg`}
                        alt={slide.diagram.title}
                        className="max-h-[420px] w-full bg-[#f5f3ed] object-contain p-3"
                      />
                      <figcaption className="dg-serif mt-2 text-xs text-[#171917]">
                        {slide.diagram.caption}
                      </figcaption>
                    </figure>
                  )}

                  {slide.kind === "screenshot" && slide.screenshot && (
                    <figure className="mt-6 border border-[#080909] bg-[#efeee8] p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={slide.screenshot.desktopSrc}
                        alt={slide.screenshot.title}
                        className="max-h-[420px] w-full border border-[#c8ccc0] bg-[#f5f3ed] object-contain object-top"
                      />
                      <figcaption className="dg-serif mt-2 text-xs text-[#171917]">
                        {slide.screenshot.caption}
                      </figcaption>
                    </figure>
                  )}

                  {/* reveal.js native speaker notes element */}
                  <aside className="notes hidden">{slide.presenterNotes}</aside>
                </section>
              );
            })}
          </div>
        </div>

        {/* Speaker view / presenter notes panel */}
        {speakerViewOpen && (
          <aside
            aria-label="Speaker view and presenter notes"
            data-testid="guide-speaker-view-panel"
            className="grid grid-cols-1 gap-6 border-2 border-[#080909] bg-[#efeee8] p-6 md:grid-cols-[2fr_1fr]"
          >
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c8ccc0] pb-2">
                <span className="dg-mono text-[#080909]">
                  Presenter notes · Slide {currentIndex + 1} of {slides.length}
                </span>
                <div className="flex items-center gap-3 font-mono text-xs text-[#5b5e56]">
                  <span data-testid="speaker-timer">
                    Elapsed: {mins}:{secs}
                  </span>
                  <button
                    type="button"
                    onClick={() => setElapsedSeconds(0)}
                    className="underline hover:text-[#080909]"
                  >
                    Reset
                  </button>
                </div>
              </div>
              <p
                data-testid="speaker-view-notes-text"
                className="dg-serif text-base leading-relaxed text-[#080909]"
              >
                {currentSlide.presenterNotes}
              </p>
            </div>

            <div className="space-y-2 border-t border-[#c8ccc0] pt-4 md:border-l md:border-t-0 md:pl-6 md:pt-0">
              <div className="dg-mono text-[#5b5e56]">Next slide</div>
              {nextSlide ? (
                <div className="space-y-1">
                  <div className="font-semibold text-[#080909]">
                    {nextSlide.heading}
                  </div>
                  <p className="dg-serif text-xs leading-relaxed text-[#171917]">
                    {nextSlide.summaryText}
                  </p>
                </div>
              ) : (
                <p className="dg-serif text-xs text-[#5b5e56]">
                  End of slide deck.
                </p>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
