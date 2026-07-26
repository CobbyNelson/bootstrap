/**
 * Mood & design imagery.
 *
 * These are art-directed, non-documentary images: architectural abstracts,
 * editorial still lifes and sector mood shots. They illustrate sections — they
 * never stand in for a real business, person or event.
 *
 * Deliberately NOT used for marketplace listings. Those cards represent real
 * businesses, so a synthetic photo there would misrepresent them; they keep
 * their gradient/initial treatment until a business supplies its own asset.
 *
 * Files live in /public/img (see docs/IMAGERY.md for the source list).
 */
export const IMAGERY = {
  heroTower: {
    src: "/img/hero-tower.png",
    alt: "Abstract upward view of a glass office tower at blue hour",
  },
  ctaTexture: {
    src: "/img/cta-texture.png",
    alt: "",
  },
  deskReport: {
    src: "/img/desk-report.png",
    alt: "A printed financial report, pen and reading glasses on a desk",
  },
  forum: {
    src: "/img/forum.png",
    alt: "A business forum auditorium seen from the back of the room",
  },
  solar: {
    src: "/img/solar-farm.png",
    alt: "Aerial view of rows of solar panels across open landscape",
  },
  factory: {
    src: "/img/factory.png",
    alt: "Interior of a modern manufacturing facility",
  },
  skylineFigure: {
    src: "/img/skyline-figure.png",
    alt: "A person in business dress looking out over a city skyline at dusk",
  },
  handshake: {
    src: "/img/handshake.png",
    alt: "Two people shaking hands across a boardroom table",
  },
} as const;

export type ImageryKey = keyof typeof IMAGERY;
