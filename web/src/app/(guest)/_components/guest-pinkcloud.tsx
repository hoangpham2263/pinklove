"use client";

import { CSSProperties, FocusEvent, MouseEvent, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ROUTES } from "@/lib/routes";

const pinkCloudStyles = `
  @keyframes pinkcloud-float {
    0%, 100% { transform: translate3d(0, 0, 0) rotate(-3deg); }
    35% { transform: translate3d(-0.5px, -3px, 0) rotate(2deg); }
    70% { transform: translate3d(0.5px, -1px, 0) rotate(-1deg); }
  }

  @keyframes pinkcloud-blink {
    0%, 32%, 35%, 72%, 75%, 77%, 100% { transform: translateY(-105%); }
    33.5%, 73.5%, 76% { transform: translateY(0); }
  }

  @keyframes pinkcloud-bubble-float {
    0%, 100% { transform: translateY(-50%); }
    50% { transform: translateY(calc(-50% - 2px)); }
  }

  @keyframes pinkcloud-heart-pop {
    0%, 100% { transform: scale(0.85); }
    50% { transform: scale(1); }
  }

  @keyframes pinkcloud-sparkle {
    0%, 100% {
      opacity: 0.38;
      transform: scale(0.7);
      filter: brightness(0.92) drop-shadow(0 0 0 rgba(255, 255, 255, 0));
    }
    50% {
      opacity: 1;
      transform: scale(1.28);
      filter: brightness(1.28) drop-shadow(0 0 10px rgba(255, 255, 255, 0.7));
    }
  }

  @keyframes pinkcloud-blush-float {
    0%, 100% {
      transform: translateY(0) scale(1);
      opacity: 0.9;
    }
    50% {
      transform: translateY(-0.6px) scale(1.05);
      opacity: 1;
    }
  }

  .pinkcloud .pinkcloud-bubble {
    animation: pinkcloud-bubble-float 3.4s ease-in-out infinite;
  }

  .pinkcloud .pinkcloud-bubble::before {
    content: "";
    position: absolute;
    right: -7px;
    top: 50%;
    width: 12px;
    height: 12px;
    transform: translateY(-50%) rotate(45deg);
    background: rgba(255, 255, 255, 0.98);
    border-top: 1px solid color-mix(in srgb, var(--pinkcloud-primary) 34%, white);
    border-right: 1px solid color-mix(in srgb, var(--pinkcloud-primary) 34%, white);
  }

  .pinkcloud:hover .pinkcloud-bubble,
  .pinkcloud:focus-visible .pinkcloud-bubble {
    box-shadow: 0 22px 50px color-mix(in srgb, var(--pinkcloud-primary) 38%, transparent);
  }

  .pinkcloud .pinkcloud-wrap {
    animation: pinkcloud-float 3.2s ease-in-out infinite;
  }

  .pinkcloud .pinkcloud-star {
    background: rgba(255, 255, 255, 0.88);
    box-shadow:
      0 0 10px rgba(255, 255, 255, 0.35),
      0 0 18px rgba(255, 255, 255, 0.28);
    animation: pinkcloud-sparkle 1.7s ease-in-out infinite;
  }

  .pinkcloud .pinkcloud-cross {
    color: rgba(255, 255, 255, 0.95);
    filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.3));
    transform: rotate(8deg);
    animation: pinkcloud-sparkle 2.1s ease-in-out infinite;
    animation-delay: 0.35s;
  }

  .pinkcloud .pinkcloud-puff {
    position: absolute;
    border-radius: 999px;
    background: linear-gradient(145deg, color-mix(in srgb, var(--pinkcloud-primary) 12%, white) 0%, color-mix(in srgb, var(--pinkcloud-primary) 58%, white) 46%, color-mix(in srgb, var(--pinkcloud-primary) 86%, white) 100%);
    box-shadow:
      0 14px 24px color-mix(in srgb, var(--pinkcloud-primary) 18%, transparent),
      inset 0 -7px 12px rgba(255, 255, 255, 0.24),
      inset 0 3px 6px rgba(255, 255, 255, 0.2);
  }

  .pinkcloud .pinkcloud-puff-left {
    left: 6%;
    top: 30%;
    width: 24px;
    height: 18px;
  }

  .pinkcloud .pinkcloud-puff-middle {
    left: 30%;
    top: 13%;
    width: 24px;
    height: 22px;
  }

  .pinkcloud .pinkcloud-puff-right {
    right: 7%;
    top: 31%;
    width: 23px;
    height: 17px;
  }

  .pinkcloud .pinkcloud-puff-bottom-left {
    left: 18%;
    top: 46%;
    width: 21px;
    height: 15px;
  }

  .pinkcloud .pinkcloud-puff-bottom-center {
    left: 50%;
    top: 43%;
    width: 26px;
    height: 18px;
    transform: translateX(-50%);
  }

  .pinkcloud .pinkcloud-puff-bottom-right {
    right: 18%;
    top: 47%;
    width: 20px;
    height: 14px;
  }

  .pinkcloud .pinkcloud-body {
    position: absolute;
    left: 22%;
    right: 22%;
    top: 34%;
    bottom: 23%;
    overflow: hidden;
    border-radius: 999px;
    background: linear-gradient(145deg, color-mix(in srgb, var(--pinkcloud-primary) 14%, white) 0%, color-mix(in srgb, var(--pinkcloud-primary) 62%, white) 50%, color-mix(in srgb, var(--pinkcloud-primary) 88%, white) 100%);
    box-shadow:
      0 20px 32px color-mix(in srgb, var(--pinkcloud-primary) 24%, transparent),
      inset 0 -10px 14px color-mix(in srgb, var(--pinkcloud-primary-deep) 8%, transparent);
  }

  .pinkcloud .pinkcloud-shadow {
    position: absolute;
    left: 20%;
    right: 20%;
    bottom: 14%;
    height: 8px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--pinkcloud-primary) 18%, transparent);
    filter: blur(5px);
  }

  .pinkcloud .pinkcloud-glow-top {
    position: absolute;
    left: 50%;
    top: 24%;
    width: 26px;
    height: 11px;
    transform: translateX(-50%);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
    filter: blur(8px);
  }

  .pinkcloud .pinkcloud-glow-side {
    position: absolute;
    left: 18%;
    top: 32%;
    width: 16px;
    height: 8px;
    border-radius: 999px;
    transform: rotate(-18deg);
    background: rgba(255, 255, 255, 0.3);
    filter: blur(5px);
  }

  .pinkcloud .pinkcloud-belly {
    position: absolute;
    left: 50%;
    top: 66%;
    width: 22px;
    height: 8px;
    transform: translateX(-50%);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.22);
    clip-path: ellipse(50% 44% at 50% 50%);
  }

  .pinkcloud .pinkcloud-pupil {
    transform: translate(-1.1px, 0.8px);
    transition:
      opacity 180ms ease,
      transform 260ms cubic-bezier(0.22, 1, 0.36, 1),
      filter 220ms ease;
  }

  .pinkcloud .pinkcloud-pupil::before {
    content: "";
    position: absolute;
    left: 18%;
    top: 16%;
    width: 1.3px;
    height: 1.3px;
    border-radius: 999px;
    background: white;
  }

  .pinkcloud .pinkcloud-eyelid {
    position: absolute;
    inset: 0;
    background: linear-gradient(145deg, var(--pinkcloud-primary-soft) 0%, var(--pinkcloud-primary) 52%, color-mix(in srgb, var(--pinkcloud-primary) 65%, #ffa27c) 100%);
    transform: translateY(-105%);
    animation: pinkcloud-blink 5.8s ease-in-out infinite;
    transition: opacity 180ms ease;
  }

  .pinkcloud .pinkcloud-eye-heart {
    color: color-mix(in srgb, var(--pinkcloud-primary) 72%, white);
    opacity: 0;
    transform: translateY(2px) scale(0.72) rotate(-6deg);
    filter: blur(0.3px);
    transition:
      opacity 180ms ease,
      transform 280ms cubic-bezier(0.22, 1, 0.36, 1),
      filter 220ms ease;
  }

  .pinkcloud .pinkcloud-art.is-love .pinkcloud-eye .pinkcloud-pupil {
    opacity: 0;
    transform: translate(-1.1px, 2.2px) scale(0.6);
    filter: blur(0.6px);
  }

  .pinkcloud .pinkcloud-art.is-love .pinkcloud-eye .pinkcloud-eyelid {
    opacity: 0;
    animation-play-state: paused;
  }

  .pinkcloud .pinkcloud-art.is-love .pinkcloud-eye .pinkcloud-eye-heart {
    opacity: 1;
    transform: translateY(0) scale(1) rotate(0deg);
    filter: blur(0);
    animation: pinkcloud-heart-pop 0.9s ease-in-out infinite;
  }

  .pinkcloud .pinkcloud-blush {
    position: absolute;
    top: 57%;
    width: 8px;
    height: 5px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--pinkcloud-primary) 34%, white);
    filter: blur(0.2px);
    animation: pinkcloud-blush-float 2.6s ease-in-out infinite;
  }

  .pinkcloud .pinkcloud-blush-left {
    left: 15%;
    transform: rotate(-10deg);
  }

  .pinkcloud .pinkcloud-blush-right {
    right: 15%;
    transform: rotate(10deg);
    animation-delay: 0.35s;
  }

  .pinkcloud .pinkcloud-mouth {
    position: absolute;
    left: 50%;
    top: 56%;
    width: 12px;
    height: 6px;
    transform: translateX(-50%);
  }

  .pinkcloud .pinkcloud-mouth-top {
    position: absolute;
    left: 50%;
    top: 58%;
    width: 10px;
    height: 1.5px;
    transform: translateX(-50%);
    border-radius: 999px;
    background: color-mix(in srgb, var(--pinkcloud-primary-deep) 56%, white);
    opacity: 0.72;
  }

  .pinkcloud .pinkcloud-mouth-bottom {
    position: absolute;
    left: 50%;
    top: 6%;
    width: 7px;
    height: 3px;
    transform: translateX(-50%);
    background: transparent;
    border-bottom: 1.5px solid color-mix(in srgb, var(--pinkcloud-primary-deep) 56%, white);
    border-radius: 0 0 999px 999px;
  }

  @media (max-width: 767px) {
    .pinkcloud .pinkcloud-bubble {
      right: calc(100% + 10px);
    }
  }
`;

const pinkCloudVars = {
  "--pinkcloud-primary": "var(--color-guest-primary)",
  "--pinkcloud-primary-soft": "color-mix(in srgb, var(--pinkcloud-primary) 78%, white)",
  "--pinkcloud-primary-deep": "color-mix(in srgb, var(--pinkcloud-primary) 72%, black)",
  "--pinkcloud-primary-shadow": "color-mix(in srgb, var(--pinkcloud-primary) 32%, transparent)",
} as CSSProperties;

function PinkCloudArt({ active = false, size = "sm" }: { active?: boolean; size?: "sm" | "lg" }) {
  const shellSize = size === "lg" ? "size-24" : "size-16";
  const starSize = size === "lg" ? "h-[4.5px] w-[4.5px]" : "h-[3px] w-[3px]";
  const crossSize = size === "lg" ? "h-[4.95px] w-[4.95px]" : "h-[3.3px] w-[3.3px]";
  const crossBar = size === "lg" ? "h-[4.95px] w-[1.08px]" : "h-[3.3px] w-px";
  const crossLine = size === "lg" ? "h-[1.08px] w-[4.95px]" : "h-px w-[3.3px]";
  const eyeClass = size === "lg"
    ? "h-[19px] w-[16px]"
    : "h-3 w-[10px]";
  const pupilClass = size === "lg"
    ? "h-[5.6px] w-[5.6px]"
    : "h-1 w-1";
  const heartEyeClass = size === "lg" ? "h-[9px] w-[9px]" : "h-[7px] w-[7px]";

  return (
    <div className={`pinkcloud-art relative ${shellSize} ${active ? "is-love" : ""}`}>
      <span className={`pinkcloud-star absolute left-[10%] top-[16%] ${starSize} rounded-full`} />
      <span className={`pinkcloud-cross absolute right-[12%] top-[10%] ${crossSize}`}>
        <span className={`absolute left-1/2 top-0 -translate-x-1/2 rounded-full bg-white/90 ${crossBar}`} />
        <span className={`absolute left-0 top-1/2 -translate-y-1/2 rounded-full bg-white/90 ${crossLine}`} />
      </span>
      <span className={`pinkcloud-star absolute left-[17%] top-[7%] ${size === "lg" ? "h-[3px] w-[3px]" : "h-[2px] w-[2px]"} rounded-full opacity-80`} style={{ animationDelay: "0.6s" }} />
      <span className={`pinkcloud-star absolute right-[23%] top-[22%] ${size === "lg" ? "h-[2.6px] w-[2.6px]" : "h-[1.8px] w-[1.8px]"} rounded-full opacity-70`} style={{ animationDelay: "1.1s" }} />
      <span className={`pinkcloud-star absolute left-[24%] top-[58%] ${size === "lg" ? "h-[2.4px] w-[2.4px]" : "h-[1.6px] w-[1.6px]"} rounded-full opacity-75`} style={{ animationDelay: "1.45s" }} />

      <div className="pinkcloud-wrap absolute inset-0">
        <span className="pinkcloud-shadow" />
        <span className="pinkcloud-puff pinkcloud-puff-left" />
        <span className="pinkcloud-puff pinkcloud-puff-middle" />
        <span className="pinkcloud-puff pinkcloud-puff-right" />
        <span className="pinkcloud-puff pinkcloud-puff-bottom-left" />
        <span className="pinkcloud-puff pinkcloud-puff-bottom-center" />
        <span className="pinkcloud-puff pinkcloud-puff-bottom-right" />

        <div className="pinkcloud-body">
          <span className="pinkcloud-glow-top" />
          <span className="pinkcloud-glow-side" />
          <span className="pinkcloud-belly" />
          <span className="pinkcloud-blush pinkcloud-blush-left" />
          <span className="pinkcloud-blush pinkcloud-blush-right" />

          <span className={`pinkcloud-eye absolute left-[21%] top-[31.5%] flex items-center justify-center overflow-hidden rounded-[48%] bg-white shadow-[inset_0_-2px_4px_rgba(0,0,0,0.08)] ${eyeClass}`}>
            <span className={`pinkcloud-pupil relative rounded-full bg-black ${pupilClass}`} />
            <span className="absolute left-[22%] top-[16%] h-[1px] w-[2px] rounded-full bg-white/70 blur-[0.4px]" />
            <span className="pinkcloud-eyelid" />
            <Heart className={`pinkcloud-eye-heart absolute ${heartEyeClass}`} strokeWidth={2} fill="currentColor" />
          </span>
          <span className={`pinkcloud-eye absolute right-[21%] top-[31.5%] flex items-center justify-center overflow-hidden rounded-[48%] bg-white shadow-[inset_0_-2px_4px_rgba(0,0,0,0.08)] ${eyeClass}`}>
            <span className={`pinkcloud-pupil relative rounded-full bg-black ${pupilClass}`} />
            <span className="absolute left-[22%] top-[16%] h-[1px] w-[2px] rounded-full bg-white/70 blur-[0.4px]" />
            <span className="pinkcloud-eyelid pinkcloud-eyelid-right" />
            <Heart className={`pinkcloud-eye-heart absolute ${heartEyeClass}`} strokeWidth={2} fill="currentColor" />
          </span>

          <span className="pinkcloud-mouth">
            <span className="pinkcloud-mouth-top" />
            <span className="pinkcloud-mouth-bottom" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function GuestPinkCloud() {
  const [isBubbleHidden, setIsBubbleHidden] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isFloatingBirdActive, setIsFloatingBirdActive] = useState(false);
  const [isDialogBirdActive, setIsDialogBirdActive] = useState(false);

  const activateDialogBird = () => setIsDialogBirdActive(true);
  const deactivateDialogBird = () => setIsDialogBirdActive(false);

  const handleBubbleClose = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsBubbleHidden(true);
  };

  const handleDialogActionBlur = (event: FocusEvent<HTMLElement>) => {
    const nextFocused = event.relatedTarget;

    if (nextFocused instanceof Node && event.currentTarget.parentElement?.contains(nextFocused)) {
      return;
    }

    deactivateDialogBird();
  };

  return (
    <div style={pinkCloudVars}>
      <style jsx global>{pinkCloudStyles}</style>
      <div className="pinkcloud group relative">
        {!isBubbleHidden ? (
          <div className="pinkcloud-bubble absolute right-[calc(100%+14px)] top-1/2 w-[180px] max-w-[calc(100vw-110px)] rounded-[14px] border border-[color:color-mix(in_srgb,var(--pinkcloud-primary)_34%,white)] bg-white/98 shadow-[0_18px_44px_var(--pinkcloud-primary-shadow)]">
            <button
              type="button"
              className="pointer-events-none absolute -right-2.5 -top-2.5 z-30 flex size-5 items-center justify-center rounded-full border border-[color:color-mix(in_srgb,var(--pinkcloud-primary)_34%,white)] bg-white text-[12px] leading-none text-[color:var(--pinkcloud-primary-deep)] opacity-0 shadow-[0_10px_24px_color-mix(in_srgb,var(--pinkcloud-primary)_22%,transparent)] transition-[opacity,color] group-hover:pointer-events-auto group-hover:opacity-100 hover:text-primary focus-visible:pointer-events-auto focus-visible:opacity-100"
              aria-label="Ẩn tạm thời PinkCloud"
              onClick={handleBubbleClose}
            >
              ×
            </button>
            <p className="px-3 py-3 text-center text-[14px] font-semibold text-[color:var(--pinkbird-primary-deep)]">PinkCloud ở đây để hỗ trợ bạn nè</p>
          </div>
        ) : null}

        <button
          type="button"
          className="relative block size-16 rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-400"
          aria-label="Mở hỗ trợ PinkCloud"
          onMouseEnter={() => setIsFloatingBirdActive(true)}
          onMouseLeave={() => setIsFloatingBirdActive(false)}
          onFocus={() => setIsFloatingBirdActive(true)}
          onBlur={() => setIsFloatingBirdActive(false)}
          onClick={() => setIsDialogOpen(true)}
        >
          <PinkCloudArt active={isFloatingBirdActive} />
        </button>
      </div>

      {isDialogOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/35 px-4 backdrop-blur-[2px]"
          onClick={() => setIsDialogOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Liên hệ PinkCloud"
            className="pinkcloud relative w-full max-w-[500px] rounded-[28px] bg-white p-5 shadow-[0_30px_80px_rgba(15,23,42,0.24)] sm:p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label="Close"
              className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
              onClick={() => setIsDialogOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" className="h-5 w-5" viewBox="0 0 12 12" fill="none">
                <path fill="currentColor" fillRule="evenodd" d="M4.28 3.22a.75.75 0 0 0-1.06 1.06L4.94 6L3.22 7.72a.75.75 0 0 0 1.06 1.06L6 7.06l1.72 1.72a.75.75 0 0 0 1.06-1.06L7.06 6l1.72-1.72a.75.75 0 0 0-1.06-1.06L6 4.94z" clipRule="evenodd" />
              </svg>
            </button>

            <div className="space-y-5 pt-2">
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  className="rounded-full"
                  aria-label="PinkCloud hỗ trợ"
                  onMouseEnter={activateDialogBird}
                  onMouseLeave={deactivateDialogBird}
                  onFocus={activateDialogBird}
                  onBlur={deactivateDialogBird}
                >
                  <PinkCloudArt active={isDialogBirdActive} size="lg" />
                </button>
              </div>

              <div className="space-y-4 text-center">
                <h1 className="font-heading text-lg leading-relaxed text-primary">
                  Ban khong co thoi gian
                  <br />
                  hoac gap kho khan trong viec tao thiep?
                </h1>
                <p className="m-0 leading-relaxed text-slate-600">
                  Lien he voi chung toi ngay.
                </p>
                <Link
                  href={ROUTES.CONTACT}
                  className="inline-flex items-center justify-center rounded-xl border border-[color:color-mix(in_srgb,var(--pinkcloud-primary)_34%,white)] px-4 py-2 font-medium text-[color:var(--pinkcloud-primary-deep)] transition hover:bg-rose-50"
                  onMouseEnter={activateDialogBird}
                  onMouseLeave={deactivateDialogBird}
                  onFocus={activateDialogBird}
                  onBlur={handleDialogActionBlur}
                >
                  Facebook
                </Link>
              </div>

              <div className="border-t border-slate-200" />

              <div className="space-y-4 text-center">
                <p className="m-0 leading-relaxed text-slate-600">
                  Ban dang ban ron va can giai phap nhanh chong? Chung toi da chuan bi san nhung mau thiep dep, de ban co the chon va tuy chinh de dang.
                </p>
                <Link
                  href={ROUTES.CONTACT}
                  className="inline-flex w-full items-center justify-center rounded-xl bg-guest-primary px-4 py-3 font-semibold text-white transition hover:opacity-90"
                  onMouseEnter={activateDialogBird}
                  onMouseLeave={deactivateDialogBird}
                  onFocus={activateDialogBird}
                  onBlur={handleDialogActionBlur}
                >
                  Lien he ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
