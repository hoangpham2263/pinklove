import { Heart, HeartCrack } from "lucide-react";
import { GuestLinkButton } from "@/app/(guest)/_components/guest-ui";

type GuestAnimatedCtaButtonProps = {
  href: string;
  children: string;
};

export function GuestAnimatedCtaButton({ href, children }: GuestAnimatedCtaButtonProps) {
  return (
    <GuestLinkButton
      href={href}
      className="group relative inline-flex min-w-[220px] items-center justify-center overflow-visible rounded-full border border-white/30 bg-[linear-gradient(100deg,#ff6ff5_0%,#ff8be8_45%,#d94dce_100%)] px-8 py-4 text-lg font-bold text-white shadow-[0_16px_34px_rgba(255,111,245,0.34)] transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_20px_42px_rgba(255,111,245,0.46)]"
    >
      <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full border border-white/45" />
      <span className="pointer-events-none absolute inset-y-1 left-1 w-16 -translate-x-24 rounded-full bg-white/35 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[17rem]" />
      <span className="pointer-events-none absolute inset-x-5 bottom-1 h-px origin-left scale-x-0 bg-gradient-to-r from-transparent via-white to-transparent transition-transform duration-700 ease-out group-hover:scale-x-100" />

      <span className="pointer-events-none absolute -left-10 top-1/2 hidden -translate-y-1/2 cta-sparkle-float text-3xl text-guest-primary/80 transition-transform duration-500 group-hover:-translate-x-1 group-hover:-rotate-12 sm:block">✦</span>
      <span className="pointer-events-none absolute -left-3 top-0 hidden cta-sparkle-float text-xl text-[#ffb8fb] transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-12 sm:block">✦</span>
      <span className="pointer-events-none absolute -left-8 -top-4 hidden cta-heart-pop text-2xl text-[#d94dce] transition-transform duration-500 group-hover:-translate-y-1 sm:block">♥</span>
      <span className="pointer-events-none absolute left-8 -top-5 hidden cta-sparkle-float text-sm text-[#ffc8fb] transition-transform duration-500 group-hover:translate-y-1 group-hover:rotate-45 sm:block">✧</span>

      <span className="relative z-10">{children}</span>
      <span className="relative z-10 ml-3 inline-flex size-7 items-center justify-center overflow-hidden rounded-full bg-white/75" aria-hidden="true">
        <span className="absolute inset-x-0 bottom-0 h-0 bg-[linear-gradient(180deg,#ffd8fc_0%,var(--color-guest-primary)_62%,#ff8be8_100%)] opacity-25 transition-[height] duration-700 ease-out group-hover:h-full" />
        <span className="absolute inset-0 flex items-center justify-center [clip-path:inset(100%_0_0_0)] transition-[clip-path] duration-700 ease-out group-hover:[clip-path:inset(0_0_0_0)]">
          <svg viewBox="0 0 24 24" className="size-4.5" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="guest-cta-heart-gradient" x1="12" y1="3" x2="12" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#ffb8fb" />
                <stop offset="0.55" stopColor="var(--color-guest-primary)" />
                <stop offset="1" stopColor="#ff8be8" />
              </linearGradient>
            </defs>
            <Heart className="size-4.5 fill-[url(#guest-cta-heart-gradient)] text-[var(--color-guest-primary)]" strokeWidth={2.4} />
          </svg>
        </span>
        <HeartCrack className="absolute size-4.5 text-[var(--color-guest-primary)] transition-opacity duration-300 ease-out group-hover:opacity-0" strokeWidth={2.4} />
      </span>

      <span className="pointer-events-none absolute -right-10 top-1/2 hidden -translate-y-1/2 cta-sparkle-float text-3xl text-guest-primary/80 transition-transform duration-500 group-hover:translate-x-1 group-hover:rotate-12 sm:block">✦</span>
      <span className="pointer-events-none absolute -right-3 bottom-0 hidden cta-sparkle-float text-xl text-[#ffb8fb] transition-transform duration-500 group-hover:translate-y-1 group-hover:-rotate-12 sm:block">✦</span>
      <span className="pointer-events-none absolute -right-8 -bottom-4 hidden cta-heart-pop text-2xl text-[#d94dce] transition-transform duration-500 group-hover:translate-y-1 sm:block">♥</span>
      <span className="pointer-events-none absolute right-9 -bottom-5 hidden cta-sparkle-float text-sm text-[#ffc8fb] transition-transform duration-500 group-hover:-translate-y-1 group-hover:-rotate-45 sm:block">✧</span>
    </GuestLinkButton>
  );
}
