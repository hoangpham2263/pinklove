import type { ReactNode } from "react";

type GuestMarketingPageShellProps = {
  ambientGlowDensity?: GuestMarketingAmbientGlowDensity;
  children: ReactNode;
  className?: string;
};

type GuestMarketingSoftGlowProps = {
  className?: string;
  reverse?: boolean;
};

type GuestMarketingAmbientGlowDensity = "compact" | "regular" | "extended";

const AMBIENT_GLOW_POINTS = [
  {
    pink: "absolute -right-16 top-[8%] h-64 w-64 rounded-full bg-[#ff6ff5]/12 blur-3xl",
    gold: "absolute left-[18%] top-[16%] h-72 w-72 rounded-full bg-[#ffd66f]/12 blur-3xl",
  },
  {
    pink: "absolute left-[2%] top-[6%] h-44 w-44 rounded-full bg-[#ff6ff5]/7 blur-3xl",
    gold: "absolute right-[28%] top-[10%] h-48 w-48 rounded-full bg-[#ffd66f]/7 blur-3xl",
  },
  {
    pink: "absolute -left-28 top-[14%] h-56 w-56 rounded-full bg-[#ff6ff5]/9 blur-3xl",
    gold: "absolute right-[4%] top-[18%] h-52 w-52 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute right-[12%] top-[22%] h-44 w-44 rounded-full bg-[#ff6ff5]/7 blur-3xl",
    gold: "absolute left-[4%] top-[26%] h-52 w-52 rounded-full bg-[#ffd66f]/7 blur-3xl",
  },
  {
    pink: "absolute left-[44%] top-[24%] h-56 w-56 rounded-full bg-[#ff6ff5]/8 blur-3xl",
    gold: "absolute -right-20 top-[30%] h-60 w-60 rounded-full bg-[#ffd66f]/9 blur-3xl",
  },
  {
    pink: "absolute right-[2%] top-[34%] h-48 w-48 rounded-full bg-[#ff6ff5]/8 blur-3xl",
    gold: "absolute -left-24 top-[30%] h-60 w-60 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute -left-20 top-[36%] h-64 w-64 rounded-full bg-[#ff6ff5]/10 blur-3xl",
    gold: "absolute right-[16%] top-[42%] h-72 w-72 rounded-full bg-[#ffd66f]/10 blur-3xl",
  },
  {
    pink: "absolute left-[34%] top-[44%] h-44 w-44 rounded-full bg-[#ff6ff5]/7 blur-3xl",
    gold: "absolute -right-16 top-[46%] h-48 w-48 rounded-full bg-[#ffd66f]/7 blur-3xl",
  },
  {
    pink: "absolute right-[28%] top-[50%] h-52 w-52 rounded-full bg-[#ff6ff5]/8 blur-3xl",
    gold: "absolute left-[8%] top-[56%] h-60 w-60 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute -left-16 top-[58%] h-44 w-44 rounded-full bg-[#ff6ff5]/7 blur-3xl",
    gold: "absolute right-[36%] top-[60%] h-50 w-50 rounded-full bg-[#ffd66f]/7 blur-3xl",
  },
  {
    pink: "absolute -right-24 top-[54%] h-64 w-64 rounded-full bg-[#ff6ff5]/9 blur-3xl",
    gold: "absolute left-[2%] top-[62%] h-52 w-52 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute right-[8%] top-[64%] h-56 w-56 rounded-full bg-[#ff6ff5]/10 blur-3xl",
    gold: "absolute left-[28%] top-[70%] h-64 w-64 rounded-full bg-[#ffd66f]/10 blur-3xl",
  },
  {
    pink: "absolute left-[52%] top-[76%] h-48 w-48 rounded-full bg-[#ff6ff5]/7 blur-3xl",
    gold: "absolute -left-16 top-[80%] h-64 w-64 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute -left-28 top-[72%] h-48 w-48 rounded-full bg-[#ff6ff5]/8 blur-3xl",
    gold: "absolute right-[1%] top-[82%] h-56 w-56 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute right-[20%] top-[84%] h-44 w-44 rounded-full bg-[#ff6ff5]/7 blur-3xl",
    gold: "absolute left-[16%] top-[90%] h-48 w-48 rounded-full bg-[#ffd66f]/7 blur-3xl",
  },
  {
    pink: "absolute left-[8%] top-[86%] h-52 w-52 rounded-full bg-[#ff6ff5]/8 blur-3xl",
    gold: "absolute -right-14 top-[90%] h-64 w-64 rounded-full bg-[#ffd66f]/9 blur-3xl",
  },
  {
    pink: "absolute right-[34%] top-[94%] h-48 w-48 rounded-full bg-[#ff6ff5]/7 blur-3xl",
    gold: "absolute left-[42%] top-[98%] h-56 w-56 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute -left-24 top-[100%] h-52 w-52 rounded-full bg-[#ff6ff5]/8 blur-3xl",
    gold: "absolute right-[6%] top-[102%] h-56 w-56 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute -right-28 top-[104%] h-56 w-56 rounded-full bg-[#ff6ff5]/8 blur-3xl",
    gold: "absolute -left-20 top-[108%] h-56 w-56 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute left-[24%] top-[112%] h-44 w-44 rounded-full bg-[#ff6ff5]/7 blur-3xl",
    gold: "absolute right-[22%] top-[116%] h-48 w-48 rounded-full bg-[#ffd66f]/7 blur-3xl",
  },
  {
    pink: "absolute right-[44%] top-[122%] h-48 w-48 rounded-full bg-[#ff6ff5]/7 blur-3xl",
    gold: "absolute -right-24 top-[126%] h-60 w-60 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute left-[4%] top-[132%] h-52 w-52 rounded-full bg-[#ff6ff5]/8 blur-3xl",
    gold: "absolute right-[30%] top-[136%] h-50 w-50 rounded-full bg-[#ffd66f]/7 blur-3xl",
  },
  {
    pink: "absolute -left-20 top-[144%] h-56 w-56 rounded-full bg-[#ff6ff5]/8 blur-3xl",
    gold: "absolute right-[4%] top-[148%] h-56 w-56 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute left-[36%] top-[156%] h-44 w-44 rounded-full bg-[#ff6ff5]/7 blur-3xl",
    gold: "absolute -right-16 top-[160%] h-52 w-52 rounded-full bg-[#ffd66f]/7 blur-3xl",
  },
  {
    pink: "absolute -right-28 top-[170%] h-60 w-60 rounded-full bg-[#ff6ff5]/8 blur-3xl",
    gold: "absolute left-[12%] top-[174%] h-56 w-56 rounded-full bg-[#ffd66f]/8 blur-3xl",
  },
  {
    pink: "absolute -left-24 top-[184%] h-56 w-56 rounded-full bg-[#ff6ff5]/8 blur-3xl",
    gold: "absolute right-[18%] top-[188%] h-52 w-52 rounded-full bg-[#ffd66f]/7 blur-3xl",
  },
] as const;

const AMBIENT_GLOW_DENSITY_LIMITS: Record<GuestMarketingAmbientGlowDensity, number> = {
  compact: 8,
  regular: 14,
  extended: AMBIENT_GLOW_POINTS.length,
};

export function GuestMarketingPageShell({ ambientGlowDensity = "regular", children, className = "" }: GuestMarketingPageShellProps) {
  return (
    <main className={`guest-soft-top-bg contact-wave-bg relative isolate min-h-screen overflow-hidden pt-[74px] ${className}`.trim()}>
      <GuestMarketingPageDecor ambientGlowDensity={ambientGlowDensity} />
      {children}
    </main>
  );
}

export function GuestMarketingPageDecor({ ambientGlowDensity = "regular" }: { ambientGlowDensity?: GuestMarketingAmbientGlowDensity }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <GuestMarketingAmbientGlows density={ambientGlowDensity} />
      <span className="contact-cloud-decor contact-cloud-decor-one opacity-85" />
      <span className="contact-cloud-decor contact-cloud-decor-two opacity-85" />
      <span className="contact-cloud-decor contact-cloud-decor-three opacity-65" />
      <span className="contact-cloud-decor contact-cloud-decor-four opacity-65" />
      <span className="contact-cloud-decor contact-cloud-decor-five opacity-55" />
      <span className="contact-cloud-decor contact-cloud-decor-six opacity-55" />
      <span className="contact-cloud-decor contact-cloud-decor-nine opacity-60" />
      <div className="absolute left-[12%] top-[8%] size-24 rounded-full bg-[#ffb8fb]/5 blur-3xl" />
      <div className="absolute right-[18%] top-[14%] size-28 rounded-full bg-[#ff6ff5]/4 blur-3xl" />
      <div className="absolute left-[16%] top-[48%] size-22 rounded-full bg-[#ffb8fb]/4 blur-3xl" />
      <div className="absolute right-[17%] top-[66%] size-24 rounded-full bg-[#ff6ff5]/4 blur-3xl" />
      <div className="absolute bottom-[10%] left-[42%] size-20 rounded-full bg-white/45 blur-3xl" />
      <span
        className="guest-decor-sparkle-muted cta-sparkle-float absolute left-[22%] top-[18%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent"
        style={{ animationDelay: "-0.2s" }}
      >
        ✦
      </span>
      <span
        className="guest-decor-heart-muted cta-heart-pop absolute left-[12%] top-[40%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent"
        style={{ animationDelay: "-0.7s" }}
      >
        ♥
      </span>
      <span
        className="guest-decor-sparkle-muted cta-sparkle-float absolute right-[24%] top-[12%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent"
        style={{ animationDelay: "-1.7s" }}
      >
        ✦
      </span>
      <span
        className="guest-decor-heart-muted cta-heart-pop absolute right-[10%] top-[44%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent"
        style={{ animationDelay: "-1.4s" }}
      >
        ♥
      </span>
      <span
        className="guest-decor-heart-muted cta-heart-pop absolute right-[34%] top-[76%] bg-[linear-gradient(180deg,#ffd8fc_0%,#ff8be8_45%,#d94dce_100%)] bg-clip-text text-2xl text-transparent"
        style={{ animationDelay: "-2.4s" }}
      >
        ♥
      </span>
      <span
        className="guest-decor-sparkle-muted cta-sparkle-float absolute left-[52%] bottom-[12%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent"
        style={{ animationDelay: "-1.8s" }}
      >
        ✦
      </span>
    </div>
  );
}

export function GuestMarketingAmbientGlows({ density = "regular" }: { density?: GuestMarketingAmbientGlowDensity }) {
  const visiblePoints = AMBIENT_GLOW_POINTS.slice(0, AMBIENT_GLOW_DENSITY_LIMITS[density]);

  return (
    <div className="pointer-events-none absolute inset-0">
      {visiblePoints.map((point, index) => (
        <div key={index} className="absolute inset-0">
          <div className={point.pink} />
          <div className={point.gold} />
        </div>
      ))}
    </div>
  );
}

export function GuestMarketingSoftGlow({ className = "", reverse = false }: GuestMarketingSoftGlowProps) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`.trim()}>
      <div
        className={
          reverse
            ? "absolute -left-16 -top-20 h-64 w-64 rounded-full bg-[#ff6ff5]/12 blur-3xl"
            : "absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#ff6ff5]/12 blur-3xl"
        }
      />
      <div
        className={
          reverse
            ? "absolute -bottom-24 right-1/4 h-72 w-72 rounded-full bg-[#ffd66f]/12 blur-3xl"
            : "absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-[#ffd66f]/12 blur-3xl"
        }
      />
    </div>
  );
}

export function GuestMarketingHeroDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <span className="contact-cloud-decor contact-banner-cloud-one" />
      <span className="contact-cloud-decor contact-banner-cloud-two" />
      <span
        className="guest-decor-sparkle-muted cta-sparkle-float absolute left-[7%] top-[33%] bg-[linear-gradient(180deg,#ffffff_0%,#ffb8fb_42%,#ff6ff5_100%)] bg-clip-text text-3xl text-transparent"
        style={{ animationDelay: "-0.45s" }}
      >
        ✦
      </span>
      <span
        className="guest-decor-sparkle-muted cta-sparkle-float absolute right-[10%] top-[18%] bg-[linear-gradient(180deg,#ffffff_0%,#ffd8fc_48%,#ff95f8_100%)] bg-clip-text text-2xl text-transparent"
        style={{ animationDelay: "-1.35s" }}
      >
        ✦
      </span>
    </div>
  );
}
