import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./ScrollStory.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * <ScrollStory />
 *
 * Props:
 *   stages: Array of {
 *     background: string (CSS gradient / color / image url),
 *     label: string (stage name),
 *     items: Array of { id, label, x, y }
 *       x, y → the SPREAD target position in px (e.g. x:-300, y:-150)
 *   }
 */
const ScrollStory = ({ stages = [] }) => {
  const wrapperRef = useRef(null);   // The tall 300vh+ wrapper
  const cameraRef = useRef(null);    // The pinned 100vh camera
  const bgRefs = useRef([]);         // One background div per stage
  const cardGroupRefs = useRef([]);  // One card-group div per stage
  const cardRefs = useRef([]);       // Flat array of all card divs

  useEffect(() => {
    if (!stages.length) return;

    const ctx = gsap.context(() => {
      const totalStages = stages.length;

      // ─── PIN the camera once for the entire wrapper ──────────────────
      ScrollTrigger.create({
        trigger: wrapperRef.current,
        start: "top top",
        end: () => `+=${totalStages * 100}vh`,
        pin: cameraRef.current,
        pinSpacing: false,
        id: "master-pin",
      });

      // ─── PER-STAGE timelines ──────────────────────────────────────────
      stages.forEach((stage, stageIdx) => {
        const isLast = stageIdx === totalStages - 1;

        // start / end expressed as scroll offsets into wrapperRef
        const stageStart = `top+=${stageIdx * 100}vh`;
        const stageEnd   = `top+=${(stageIdx + 1) * 100}vh`;

        // ── 1. SPREAD timeline (scrubbed to scroll = feels physical) ──
        const spreadTl = gsap.timeline({
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: stageStart,
            end: stageEnd,
            scrub: 1.2,
            id: `spread-${stageIdx}`,
          },
        });

        // Grab card elements for this stage
        const group = cardGroupRefs.current[stageIdx];
        if (group) {
          const cards = group.querySelectorAll(".story-card");

          // Phase 0→40%  : cards spread apart to their x/y targets
          cards.forEach((card, i) => {
            const item = stage.items[i] || {};
            spreadTl.to(
              card,
              {
                x: item.x ?? 0,
                y: item.y ?? 0,
                scale: 1.05,
                duration: 0.5,
                ease: "power2.out",
              },
              0   // all start together at position 0 in timeline
            );
          });

          // Phase 60→100%: entire group fades + scales out (exit)
          if (!isLast) {
            spreadTl.to(
              group,
              { opacity: 0, scale: 0.8, duration: 0.4, ease: "power1.in" },
              0.6
            );
          }
        }

        // ── 2. BACKGROUND crossfade (lower scrub = silkier transition) ──
        const bgCurrent  = bgRefs.current[stageIdx];
        const bgNext     = bgRefs.current[stageIdx + 1];

        if (bgCurrent && !isLast) {
          const bgTl = gsap.timeline({
            scrollTrigger: {
              trigger: wrapperRef.current,
              start: `top+=${stageIdx * 100 + 70}vh`,   // starts at 70% through stage
              end: stageEnd,
              scrub: 2,                                  // smooth/slow for crossfade
              id: `bg-${stageIdx}`,
            },
          });

          bgTl
            .to(bgCurrent, { opacity: 0, duration: 1 }, 0)
            .fromTo(
              bgNext,
              { opacity: 0 },
              { opacity: 1, duration: 1 },
              0
            );
        }

        // ── 3. ENTER animation for the NEXT stage's cards ──
        //    runs at the very end of this stage's scroll range
        if (!isLast) {
          const nextGroup = cardGroupRefs.current[stageIdx + 1];
          if (nextGroup) {
            // Reset next group to stacked/center before it appears
            gsap.set(nextGroup, { opacity: 0, scale: 0.9 });
            const nextCards = nextGroup.querySelectorAll(".story-card");
            gsap.set(nextCards, { x: 0, y: 0 });

            ScrollTrigger.create({
              trigger: wrapperRef.current,
              start: `top+=${stageIdx * 100 + 85}vh`,
              id: `enter-${stageIdx}`,
              onEnter: () => {
                gsap.to(nextGroup, {
                  opacity: 1,
                  scale: 1,
                  duration: 0.6,
                  ease: "back.out(1.4)",
                });
              },
              onLeaveBack: () => {
                gsap.to(nextGroup, { opacity: 0, scale: 0.9, duration: 0.3 });
              },
            });
          }
        }
      });
    }, wrapperRef); // scoped context

    // ─── CLEANUP ──────────────────────────────────────────────────────
    return () => ctx.revert();
  }, [stages]);

  return (
    // ── TALL WRAPPER — gives scroll distance ──
    <div
      ref={wrapperRef}
      className="scroll-story-wrapper"
      style={{ height: `${stages.length * 100}vh` }}
    >
      {/* ── CAMERA — pinned, 100vh ── */}
      <div ref={cameraRef} className="scroll-story-camera">

        {/* ── BACKGROUND LAYERS (all stacked, opacity controlled by GSAP) ── */}
        <div className="scroll-story-backgrounds">
          {stages.map((stage, i) => (
            <div
              key={`bg-${i}`}
              ref={(el) => (bgRefs.current[i] = el)}
              className="story-bg"
              style={{
                background: stage.background,
                opacity: i === 0 ? 1 : 0, // only first visible initially
              }}
            />
          ))}
        </div>

        {/* ── CARD GROUPS (all stacked at center, opacity controlled by GSAP) ── */}
        {stages.map((stage, stageIdx) => (
          <div
            key={`group-${stageIdx}`}
            ref={(el) => (cardGroupRefs.current[stageIdx] = el)}
            className="story-card-group"
            style={{ opacity: stageIdx === 0 ? 1 : 0 }}
          >
            {/* Stage label */}
            <p className="story-stage-label">{stage.label}</p>

            {/* Cards — all start at center (x:0, y:0) */}
            {stage.items.map((item, itemIdx) => (
              <div
                key={item.id}
                ref={(el) => {
                  if (!cardRefs.current[stageIdx])
                    cardRefs.current[stageIdx] = [];
                  cardRefs.current[stageIdx][itemIdx] = el;
                }}
                className="story-card"
                data-label={item.label}
                style={{
                  // Hue shift per card for visual variety
                  "--card-hue": `${(itemIdx * 60) % 360}deg`,
                }}
              >
                <span className="card-id">0{itemIdx + 1}</span>
                <span className="card-label">{item.label}</span>
              </div>
            ))}
          </div>
        ))}

      </div>
    </div>
  );
};

export default ScrollStory;
