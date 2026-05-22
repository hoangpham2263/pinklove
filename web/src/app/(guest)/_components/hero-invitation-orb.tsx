import Image from "next/image";
import type { Offering } from "@/features/offerings/types";

export function HeroInvitationOrb({
  offerings,
}: {
  offerings: Offering[];
}) {
  const reverseOfferings = [...offerings].reverse();
  const cardClassName =
    "group relative shrink-0 overflow-hidden rounded-lg bg-transparent p-0 shadow-[0_10px_20px_rgba(255,111,245,0.035)] ring-1 ring-white/10";
  const imageClassName =
    "object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]";

  return (
    <div className="relative mx-auto max-w-[44rem]">
      <svg className="relative z-10 aspect-square w-full" width="815" height="815" viewBox="0 0 815 815" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M407.5 815C632.556 815 815 632.556 815 407.5C815 182.444 632.556 0 407.5 0C182.444 0 0 182.444 0 407.5C0 632.556 182.444 815 407.5 815Z" fill="url(#hero-orb-paint0)" />
        <path d="M407.5 0C396.745 0 386.07 0.431471 375.523 1.24647L375.525 1.25446C388.824 1.96559 392.079 20.1673 380.014 25.4088C375.297 27.4619 370.456 29.2178 365.52 30.6664C349.843 35.2686 335.229 42.9203 322.516 53.1827C309.791 63.4376 299.212 76.1013 291.387 90.449L287.184 98.1675C271.376 127.135 244.71 148.639 213.051 157.95L208.464 159.293C192.789 163.901 178.175 171.553 165.458 181.81C152.741 192.068 142.169 204.731 134.347 219.075L111.527 260.896C107.276 268.694 117.024 276.557 123.752 270.772C134.044 261.919 145.214 254.2 157.071 247.744C168.929 241.288 181.473 236.094 194.497 232.259L273.536 209.024C285.7 205.448 297.04 199.51 306.909 191.55C316.777 183.59 324.98 173.764 331.05 162.632C337.126 151.507 345.33 141.684 355.196 133.724C365.062 125.765 376.401 119.83 388.563 116.257L465.988 93.4853C490.438 85.9266 505.508 72.8706 514.409 61.924C522.799 51.5847 537.485 48.8041 548.974 55.5159C549.15 55.6278 549.342 55.7236 549.518 55.8355C564.891 64.8484 567.735 85.8626 555.127 98.4712L510.029 143.569C498.79 154.808 481.686 157.164 467.471 150.051C458.289 145.457 447.807 143.076 436.725 143.608C404.739 145.144 378.871 171.455 377.839 203.461C377.641 209.392 378.294 215.322 379.777 221.068C385.695 243.938 370.344 266.876 347.145 271.325C338.2 273.04 329.112 273.898 320.004 273.888C281.41 273.843 244.55 289.964 217.26 317.254L184.773 349.74C157.807 376.706 121.233 391.855 83.098 391.855H0.335588C0.127843 397.049 0 402.258 0 407.5C0 437.687 3.30794 467.075 9.54029 495.392H48.9C68.8617 495.392 88.6279 491.461 107.07 483.822C125.512 476.183 142.269 464.986 156.384 450.871L159.229 448.026C173.344 433.911 190.101 422.715 208.543 415.076C226.985 407.437 246.751 403.505 266.713 403.505H357.32C377.282 403.505 397.048 399.574 415.49 391.935C433.932 384.296 450.689 373.099 464.804 358.984L494.352 329.436C534.543 286.049 607.749 281.479 610.897 281.015C683.416 270.436 749.798 327.438 750.997 400.708C751.029 402.978 751.045 405.231 751.045 407.5V408.216C750.989 440.659 730.264 469.325 699.766 480.39C690.283 483.83 680.739 488.923 671.709 495.645C642.369 517.483 627.911 549.457 634.888 572.873C637.463 581.514 633.87 590.818 625.829 594.894C625.279 595.174 624.742 595.423 624.225 595.637C601.988 604.849 581.783 618.348 564.761 635.364L545.873 654.253C511.329 688.797 464.424 707.743 415.572 707.933C367.216 708.123 320.894 727.417 286.701 761.61L260.605 787.706C296.721 801.656 335.297 810.637 375.52 813.754H375.552C386.099 814.569 396.742 815 407.497 815C632.549 815 814.997 632.552 814.997 407.5C814.997 182.448 632.552 0 407.5 0ZM661.492 247.137C638.497 247.137 619.848 228.504 619.848 205.508C619.848 182.512 638.497 163.879 661.492 163.879C684.488 163.879 703.121 182.512 703.121 205.508C703.121 228.504 684.488 247.137 661.492 247.137Z" fill="url(#hero-orb-paint1)" />
        <defs>
          <linearGradient id="hero-orb-paint0" x1="196" y1="44" x2="377.5" y2="815" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF6FF5" />
            <stop offset="0.240339" stopColor="#FF6FF5" stopOpacity="0.35" />
            <stop offset="0.502204" stopColor="#FF6FF5" stopOpacity="0" />
            <stop offset="0.998" stopColor="#FF6FF5" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="hero-orb-paint1" x1="453" y1="767" x2="279.5" y2="-1.76497e-05" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FF6FF5" stopOpacity="0" />
            <stop offset="0.468654" stopColor="#FF6FF5" stopOpacity="0" />
            <stop offset="0.762383" stopColor="#FF6FF5" stopOpacity="0.35" />
            <stop offset="0.998" stopColor="#FF6FF5" />
          </linearGradient>
        </defs>
      </svg>

      {offerings.length ? (
        <>
          <div className="pointer-events-none absolute left-[24%] top-[50%] z-[18] h-22 w-[42%] rounded-full bg-[radial-gradient(circle,rgba(255,111,245,0.08),rgba(255,111,245,0.025)_45%,rgba(255,111,245,0)_78%)] blur-2xl" />
          <div className="pointer-events-none absolute left-[27%] top-[70%] z-[18] h-18 w-[36%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.14),rgba(255,255,255,0)_72%)] blur-2xl" />

          <div className="absolute left-[14%] right-[6%] top-[52%] z-[19] -rotate-[8deg] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_7%,black_93%,transparent)]">
            <div
              className="hero-invitation-marquee relative flex w-max items-center gap-3 py-2.5"
              style={{ animationDuration: "34s" }}
            >
              {offerings.map((offering, index) => (
                <article key={`${offering.id}-${index}`} className={cardClassName}>
                  <div className="relative h-[120px] w-[70px] overflow-hidden rounded-lg">
                    <Image
                      src={offering.thumbnailUrl || ""}
                      alt={offering.name}
                      fill
                      className={imageClassName}
                      sizes="70px"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0)_36%,rgba(35,31,39,0.04))]" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/12" />
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="absolute inset-x-[9%] top-[69%] z-20 rotate-[5deg] overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_93%,transparent)]">
            <div
              className="hero-invitation-marquee-reverse relative flex w-max items-center gap-3 py-2.5 opacity-82"
              style={{ animationDuration: "36s" }}
            >
              {reverseOfferings.map((offering, index) => (
                <article key={`${offering.id}-reverse-${index}`} className={cardClassName}>
                  <div className="relative h-[120px] w-[70px] overflow-hidden rounded-lg">
                    <Image
                      src={offering.thumbnailUrl || ""}
                      alt={offering.name}
                      fill
                      className={imageClassName}
                      sizes="70px"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0)_36%,rgba(35,31,39,0.04))]" />
                    <div className="absolute inset-0 ring-1 ring-inset ring-white/10" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
