import { PROCESS } from "@/lib/content";
import { Reveal } from "@/components/ui/reveal";
import { PillButton } from "@/components/ui/button";
import { getTranslator } from "@/lib/i18n/store";
import type { Locale } from "@/lib/i18n/config";
import { translateContent } from "@/lib/i18n/translate-content";

/**
 * How the process works — an ascending path with a node per stage.
 *
 * The rising curve is the argument: a screened listing becomes a matched one,
 * then an engaged one, then a closed one. A row of equal tiles said none of
 * that; a line that climbs left to right says it without a caption.
 *
 * Two layouts from ONE list, not two copies of the markup:
 *   • below lg — a plain vertical list against a rule, which is what a narrow
 *     column can actually show.
 *   • lg and up — each step is absolutely placed on the curve. Coordinates ride
 *     in as `--x` / `--y` custom properties and are only read by `lg:` classes,
 *     so the mobile stack is never touched by them.
 *
 * The SVG stretches with `preserveAspectRatio="none"` so the nodes stay on the
 * line at any width; `vector-effect="non-scaling-stroke"` keeps the stroke an
 * even weight despite that non-uniform scale.
 */

/** Node positions in the 1000×560 viewBox, and the same points as percentages. */
const NODES = [
  { vx: 90, vy: 400 },
  { vx: 350, vy: 290 },
  { vx: 600, vy: 170 },
  // Lifted from 60 so the last step's title lands level with the headline on
  // the left, which is the whole point of floating the heading.
  { vx: 830, vy: 25 },
];

const VIEW_W = 1000;
const VIEW_H = 560;

/**
 * The path threaded through every node.
 *
 * Each segment's two control points sit at the SAME height as the nodes they
 * leave and arrive at — (x1+k, y1) then (x2−k, y2). That forces a horizontal
 * tangent at both ends, so the line settles flat at every marker and does all
 * its climbing in the middle. Pushing k out to half the span is what makes the
 * rise steep; a smaller k gives the lazy, even diagonal this replaced.
 *
 * The entry dips slightly into the first node so the line arrives rather than
 * simply starting, and both ends run off-canvas so it never looks clipped.
 */
const CURVE = [
  "M -40,372",
  "C 15,372 45,400 90,400",
  "C 220,400 220,290 350,290",
  "C 475,290 475,170 600,170",
  "C 715,170 715,25 830,25",
  "C 905,25 960,16 1040,8",
].join(" ");

export async function Process({ locale }: { locale: Locale }) {
  const t = await getTranslator(locale);
  const process = translateContent(PROCESS, t);
  return (
    <section className="overflow-hidden py-14 md:py-20 lg:pt-28">
      {/* On lg the heading is lifted out of the flow and pinned top-left, so the
          curve occupies the whole band instead of starting underneath it. That
          is what puts the last step level with the headline and reclaims the
          empty corner the stacked version left above the line. Below lg it
          returns to normal flow ahead of the list. */}
      <div className="container-x relative">
        <Reveal>
          <div className="max-w-md lg:absolute lg:left-0 lg:top-0 lg:z-10 lg:max-w-sm lg:pr-8">
            <span className="kicker text-brand-600">{t.tl("The investment process")}</span>
            <h2 className="mt-3 font-display text-3xl leading-tight text-navy-700 sm:text-4xl">
              {t.tl("How we work")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-ink/65">
              {t.tl("A disciplined pipeline that turns capital–opportunity fit into closed allocations, with expert support at every stage.")}
            </p>
            <PillButton href="/register/investor" tone="brand" className="mt-7">
              {t.tl("Start with a mandate")}
            </PillButton>
          </div>
        </Reveal>

        {/* Height is tuned so the lowest step's copy lands near the bottom edge.
            Node offsets are percentages and the SVG stretches, so both scale
            together — changing this compresses the curve without knocking any
            marker off the line. */}
        <div className="relative mt-14 lg:mt-0 lg:h-[500px]">
          {/* The curve is clipped on its OWN wrapper, not on the box. Drawn
              with preserveAspectRatio="none" and a non-scaling stroke, its
              painted bounds run about 17px past the content column on each
              side; clipping the box instead would also cut the oversized step
              numerals, which sit above it deliberately. */}
          <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            preserveAspectRatio="none"
            fill="none"
            aria-hidden
          >
            <path
              d={CURVE}
              stroke="var(--color-brand-600)"
              strokeWidth={2.5}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          </div>

          <ol className="relative lg:h-full">
            {process.map((step, i) => {
              const node = NODES[i] ?? NODES[NODES.length - 1];
              return (
                <li
                  key={step.title}
                  style={
                    {
                      "--x": `${(node.vx / VIEW_W) * 100}%`,
                      "--y": `${(node.vy / VIEW_H) * 100}%`,
                    } as React.CSSProperties
                  }
                  className="relative border-l border-ink/10 pb-10 pl-8 last:pb-0 lg:absolute lg:left-[var(--x)] lg:top-[var(--y)] lg:w-52 lg:border-0 lg:pb-0 lg:pl-0"
                >
                  <Reveal delay={i * 0.08}>
                    {/* Ghost numeral — sits behind the text, and is decorative:
                        the step's position is already carried by list order. */}
                    <span
                      className="pointer-events-none absolute -top-6 right-2 select-none font-display text-[6rem] leading-none text-ink/[0.055] lg:-top-14 lg:right-0"
                      aria-hidden
                    >
                      {i + 1}
                    </span>

                    {/* Node marker. On mobile it caps the vertical rule; on
                        desktop it centres on the curve. */}
                    <span
                      className="absolute -left-[7px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-white ring-4 ring-white lg:-left-2 lg:-top-2"
                      aria-hidden
                    >
                      <span className="h-3.5 w-3.5 rounded-full bg-ink/25" />
                    </span>

                    <div className="relative lg:pt-6">
                      <h3 className="text-[0.95rem] text-navy-700">{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-ink/60">{step.body}</p>
                    </div>
                  </Reveal>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
