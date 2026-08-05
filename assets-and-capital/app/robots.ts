import type { MetadataRoute } from "next";
import { SITE } from "@/lib/content";

// Read at request time, not build time: the lock is toggled by editing the
// server's .env and restarting, with no rebuild, and a statically baked
// robots.txt would keep advertising the wrong policy afterwards.
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // While the pre-launch gate is on, disallow everything. A crawl during this
  // window can leave "Coming soon" as the brand's search result for weeks after
  // launch, and no sitemap should be advertised for pages nobody can reach.
  if (process.env.SITE_UNLOCK_CODE?.trim()) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard", "/admin", "/login"],
    },
    sitemap: `https://${SITE.domain}/sitemap.xml`,
  };
}
