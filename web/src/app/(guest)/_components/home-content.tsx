import Image from "next/image";
import { GuestLinkButton } from "@/app/(guest)/_components/guest-ui";
import type { ManagedPage } from "@/lib/managed-pages";
import { resolveMediaUrl } from "@/lib/media-resolver";
import { getPageFields } from "@/lib/page-fields";
import { createRichTextMarkup, RICH_TEXT_CONTENT_CLASSNAME } from "@/lib/rich-text";
import { ROUTES } from "@/lib/routes";

export async function HomeContent({ page }: { page: ManagedPage }) {
  const fields = getPageFields<{
    bannerTitle?: string;
    bannerShortDescription?: string;
    bannerDescription?: string;
    heroTitle?: string;
    heroDescription?: string;
    heroButtonText?: string;
    heroButtonLink?: string;
    aboutTitle?: string;
    aboutDescription?: string;
    aboutImage?: string;
    aboutText1?: string;
    aboutText2?: string;
    aboutText3?: string;
    aboutItems?: Array<{
      label?: string;
      content?: string;
    }>;
    servicesTitle?: string;
    servicesDescription?: string;
    serviceItems?: Array<{
      title?: string;
      description?: string;
    }>;
  }>(page);

  const serviceItems = (Array.isArray(fields.serviceItems) ? fields.serviceItems : []).filter(
    (item) => item.title?.trim() && item.description?.trim()
  );

  const resolvedServiceItems = serviceItems.length > 0
    ? serviceItems
    : [
      { title: "Design Consultation", description: "Our professional team is always ready to help." },
      { title: "Turnkey Solutions", description: "Ensuring high quality and timely completion." },
      { title: "Maintenance", description: "Always by your side throughout the journey." },
    ];

  const bannerTitle = fields.bannerTitle || fields.heroTitle || page.title;
  const bannerShortDescription = fields.bannerShortDescription || page.excerpt;
  const bannerDescription = fields.bannerDescription || fields.heroDescription;
  const aboutImage = await resolveMediaUrl(fields.aboutImage);
  const hasAboutTexts = Boolean(
    fields.aboutText1?.trim() ||
    fields.aboutText2?.trim() ||
    fields.aboutText3?.trim()
  );
  const aboutItems = (Array.isArray(fields.aboutItems) ? fields.aboutItems : []).filter(
    (item) => item.label?.trim() && item.content?.trim()
  );
  const hasAboutContent = Boolean(
    fields.aboutTitle?.trim() ||
    fields.aboutDescription?.trim() ||
    aboutImage ||
    hasAboutTexts ||
    aboutItems.length
  );
  const scrollDots = [
    { id: "hero", href: "#home-hero", label: "Đi đến banner", className: "size-4 bg-[#FF6FF5]" },
    { id: "about", href: hasAboutContent ? "#home-about" : "#home-services", label: "Đi đến giới thiệu", className: "size-3.5 bg-[#FF6FF5]/80" },
    { id: "services", href: "#home-services", label: "Đi đến dịch vụ", className: "size-3 bg-[#FF6FF5]/60" },
    { id: "service-items", href: "#home-service-items", label: "Đi đến danh sách dịch vụ", className: "size-3 bg-[#FF6FF5]/60" },
  ];

  return (
    <div>
      <section id="home-hero" className="h-screen bg-gradient-to-b from-[#FFD1F7] to-[#F9F1FF] overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="pl-20 relative grid grid-cols-12 gap-5 lg:gap-10">
            <div className="col-start-12 lg:col-span-6 flex flex-col justify-center space-y-5">
              <h1 className="inline-block text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-semibold bg-[linear-gradient(90deg,#000_0%,#FF61AF_50.09%,#000_100%)] bg-clip-text text-transparent">{bannerTitle}</h1>
              {bannerShortDescription && (<p className="text-sm md:text-base lg:text-lg font-semibold">{bannerShortDescription}</p>)}
              {bannerDescription ? (<p className="text-sm md:text-base lg:text-lg">{bannerDescription}</p>) : null}
              <div className="mt-5 lg:mt-7.5">
                <GuestLinkButton href={fields.heroButtonLink || ROUTES.ABOUT} className="inline-flex items-center justify-center gap-2.5 uppercase font-semibold bg-[linear-gradient(90deg,#FF95F8_0%,#FF6FF5_50%,#FF95F8_100%)] hover:bg-[linear-gradient(90deg,#FF95F8_0%,#FF6FF5_50%,#FF95F8_100%)]">
                  {fields.heroButtonText}
                  <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" className="size-5 animate-phone-ring" width="20" height="20" viewBox="0 0 24 24">
                    <g fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M11.811 6.727C12.825 4.909 13.331 4 14.09 4c.757 0 1.264.909 2.277 2.727l.262.47c.288.517.432.775.657.945c.224.17.504.234 1.063.36l.51.116c1.967.445 2.95.667 3.185 1.42s-.437 1.537-1.778 3.106l-.347.406c-.381.445-.572.668-.658.944s-.057.573 0 1.168l.053.541c.203 2.094.305 3.14-.308 3.605s-1.534.041-3.377-.807l-.476-.22c-.524-.24-.786-.361-1.063-.361c-.278 0-.54.12-1.063.361l-.477.22c-1.842.848-2.763 1.272-3.376.807s-.511-1.511-.309-3.605l.053-.541c.057-.595.086-.892 0-1.168s-.276-.498-.657-.944l-.347-.406C6.57 11.575 5.9 10.79 6.135 10.038s1.218-.975 3.185-1.42l.51-.116c.559-.126.838-.19 1.063-.36s.368-.428.656-.945z" />
                      <path strokeLinecap="round" d="M2.089 16a4.74 4.74 0 0 1 4-.874m-4-4.626c1-.5 1.29-.44 2-.5M2 5.609l.208-.122c2.206-1.292 4.542-1.64 6.745-1.005l.208.06" opacity=".5" />
                    </g>
                  </svg>
                </GuestLinkButton>
              </div>
            </div>
            <div className="col-start-12 lg:col-span-6">
              <svg className="w-full aspect-square" width="815" height="815" viewBox="0 0 815 815" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M407.5 815C632.556 815 815 632.556 815 407.5C815 182.444 632.556 0 407.5 0C182.444 0 0 182.444 0 407.5C0 632.556 182.444 815 407.5 815Z" fill="url(#paint0_linear_1_22)" />
                <path d="M407.5 0C396.745 0 386.07 0.431471 375.523 1.24647L375.525 1.25446C388.824 1.96559 392.079 20.1673 380.014 25.4088C375.297 27.4619 370.456 29.2178 365.52 30.6664C349.843 35.2686 335.229 42.9203 322.516 53.1827C309.791 63.4376 299.212 76.1013 291.387 90.449L287.184 98.1675C271.376 127.135 244.71 148.639 213.051 157.95L208.464 159.293C192.789 163.901 178.175 171.553 165.458 181.81C152.741 192.068 142.169 204.731 134.347 219.075L111.527 260.896C107.276 268.694 117.024 276.557 123.752 270.772C134.044 261.919 145.214 254.2 157.071 247.744C168.929 241.288 181.473 236.094 194.497 232.259L273.536 209.024C285.7 205.448 297.04 199.51 306.909 191.55C316.777 183.59 324.98 173.764 331.05 162.632C337.126 151.507 345.33 141.684 355.196 133.724C365.062 125.765 376.401 119.83 388.563 116.257L465.988 93.4853C490.438 85.9266 505.508 72.8706 514.409 61.924C522.799 51.5847 537.485 48.8041 548.974 55.5159C549.15 55.6278 549.342 55.7236 549.518 55.8355C564.891 64.8484 567.735 85.8626 555.127 98.4712L510.029 143.569C498.79 154.808 481.686 157.164 467.471 150.051C458.289 145.457 447.807 143.076 436.725 143.608C404.739 145.144 378.871 171.455 377.839 203.461C377.641 209.392 378.294 215.322 379.777 221.068C385.695 243.938 370.344 266.876 347.145 271.325C338.2 273.04 329.112 273.898 320.004 273.888C281.41 273.843 244.55 289.964 217.26 317.254L184.773 349.74C157.807 376.706 121.233 391.855 83.098 391.855H0.335588C0.127843 397.049 0 402.258 0 407.5C0 437.687 3.30794 467.075 9.54029 495.392H48.9C68.8617 495.392 88.6279 491.461 107.07 483.822C125.512 476.183 142.269 464.986 156.384 450.871L159.229 448.026C173.344 433.911 190.101 422.715 208.543 415.076C226.985 407.437 246.751 403.505 266.713 403.505H357.32C377.282 403.505 397.048 399.574 415.49 391.935C433.932 384.296 450.689 373.099 464.804 358.984L494.352 329.436C534.543 286.049 607.749 281.479 610.897 281.015C683.416 270.436 749.798 327.438 750.997 400.708C751.029 402.978 751.045 405.231 751.045 407.5V408.216C750.989 440.659 730.264 469.325 699.766 480.39C690.283 483.83 680.739 488.923 671.709 495.645C642.369 517.483 627.911 549.457 634.888 572.873C637.463 581.514 633.87 590.818 625.829 594.894C625.279 595.174 624.742 595.423 624.225 595.637C601.988 604.849 581.783 618.348 564.761 635.364L545.873 654.253C511.329 688.797 464.424 707.743 415.572 707.933C367.216 708.123 320.894 727.417 286.701 761.61L260.605 787.706C296.721 801.656 335.297 810.637 375.52 813.754H375.552C386.099 814.569 396.742 815 407.497 815C632.549 815 814.997 632.552 814.997 407.5C814.997 182.448 632.552 0 407.5 0ZM661.492 247.137C638.497 247.137 619.848 228.504 619.848 205.508C619.848 182.512 638.497 163.879 661.492 163.879C684.488 163.879 703.121 182.512 703.121 205.508C703.121 228.504 684.488 247.137 661.492 247.137Z" fill="url(#paint1_linear_1_22)" />
                <defs>
                  <linearGradient id="paint0_linear_1_22" x1="196" y1="44" x2="377.5" y2="815" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF6FF5" />
                    <stop offset="0.240339" stopColor="#FF6FF5" stopOpacity="0.35" />
                    <stop offset="0.502204" stopColor="#FF6FF5" stopOpacity="0" />
                    <stop offset="0.998" stopColor="#FF6FF5" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="paint1_linear_1_22" x1="453" y1="767" x2="279.5" y2="-1.76497e-05" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#FF6FF5" stopOpacity="0" />
                    <stop offset="0.468654" stopColor="#FF6FF5" stopOpacity="0" />
                    <stop offset="0.762383" stopColor="#FF6FF5" stopOpacity="0.35" />
                    <stop offset="0.998" stopColor="#FF6FF5" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            {/* Dots */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-y-7.5 z-10">
              <div className="flex flex-col items-center gap-y-5">
                {scrollDots.map((dot) => (
                  <a
                    key={dot.id}
                    href={dot.href}
                    aria-label={dot.label}
                    className={`${dot.className} block rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#FF6FF5]`}
                  />
                ))}
              </div>
              <div className="breathe-element flex justify-center whitespace-nowrap text-sm lg:text-base uppercase font-medium [--puramu-animation-length:3s]" style={{ writingMode: "sideways-lr" }}>cuộn xuống</div>

              <div className="flex flex-col items-center gap-y-5 [--puramu-length:100px] animate-[fade-in-and-slide-down_2s_linear_forwards_infinite]">
                <svg width="17" height="28" viewBox="0 0 17 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8.08963 0C3.62895 0 0 3.62895 0 8.08963V19.4126C0 23.8733 3.62895 27.5022 8.08963 27.5022C12.5503 27.5022 16.1792 23.8733 16.1792 19.4126V8.08963C16.1792 3.62895 12.5503 0 8.08963 0ZM14.5291 19.4126C14.5291 22.9633 11.6403 25.8522 8.08963 25.8522C4.53895 25.8522 1.65008 22.9633 1.65008 19.4126V8.08963C1.65008 4.53895 4.53895 1.65008 8.08963 1.65008C11.6403 1.65008 14.5291 4.53895 14.5291 8.08963V19.4126Z" fill="#FF6FF5" />
                  <path d="M8.08966 5.471C7.63394 5.471 7.26465 5.84029 7.26465 6.29601V10.0934C7.26465 10.5489 7.63394 10.9185 8.08972 10.9185C8.54522 10.9185 8.91473 10.5489 8.91473 10.0934V6.29601C8.91473 5.84029 8.54544 5.471 8.08966 5.471Z" fill="#FF6FF5" />
                </svg>
                <div className="h-25 w-[2px] bg-gradient-to-b from-[#FF6FF5] to-black/60 [clip-path:polygon(0_0,100%_0,50%_100%)]"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="home-about" className="py-10 lg:py-15 2xl:py-20 bg-gradient-to-b from-[#FF6FF5] to-[#3A5172] ">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-12 gap-10 lg:gap-15 2xl:gap-20">
            <div className="col-span-12 lg:col-span-6 space-y-5 lg:space-y-7.5">
              {fields.aboutTitle ? (<h2 className="inline-block text-2xl sm:text-3xl lg:text-4xl 2xl:text-5xl font-semibold bg-[linear-gradient(90deg,#ADD3C1_0%,#FFFFFF_50%,#ADD3C1_100%)] bg-no-repeat bg-clip-text text-transparent">{fields.aboutTitle}</h2>) : null}
              {fields.aboutDescription ? (<div className={`${RICH_TEXT_CONTENT_CLASSNAME} text-white`} dangerouslySetInnerHTML={createRichTextMarkup(fields.aboutDescription)} />) : null}
              <div className="overflow-hidden rounded-xl max-w-lg">
                {aboutImage ? (
                  <Image src={aboutImage} alt={fields.aboutTitle || "About us"} fill className="!relative object-cover" sizes="(min-width: 1024px) 50vw, 100vw" />
                ) : null}
              </div>
            </div>

            <div className="col-span-12 lg:col-span-6 flex flex-col justify-center space-y-5 lg:space-y-7.5">
              {hasAboutTexts ? (
                <div className="space-y-7.5">
                  {fields.aboutText1?.trim() ? (
                    <p className="text-sm md:text-base lg:text-lg text-white">{fields.aboutText1}</p>
                  ) : null}
                  {fields.aboutText2?.trim() ? (
                    <p className="text-sm md:text-base lg:text-lg text-white">{fields.aboutText2}</p>
                  ) : null}
                  {fields.aboutText3?.trim() ? (
                    <p className="text-sm md:text-base lg:text-lg text-white">{fields.aboutText3}</p>
                  ) : null}
                </div>
              ) : null}

              {aboutItems.length ? (
                <div className="space-y-5 lg:space-y-7.5">
                  {aboutItems.map((item) => (
                    <div key={`${item.label}-${item.content}`} className="flex items-center gap-x-5 px-5 lg:px-7.5 py-5 lg:py-7.5 bg-gradient-to-r from-[#111111] to-[#111111]/35 rounded-full">
                      <h3 className="text-base md:text-lg lg:text-xl font-semibold uppercase text-guest-primary">{item.label}</h3>
                      <p className="text-sm md:text-base text-white">{item.content}</p>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {page.body ? (
        <section id="home-body" className="pt-10 lg:pt-15 2 xl:pt-20">
          <div className="container mx-auto px-4">
            <div
              className={`mx-auto max-w-5xl ${RICH_TEXT_CONTENT_CLASSNAME}`}
              dangerouslySetInnerHTML={createRichTextMarkup(page.body)}
            />
          </div>
        </section>
      ) : null}

      <section id="home-services" className="pt-10 lg:pt-15 2 xl:pt-20">
        <div className="container mx-auto px-4 pb-16">
          <div className="mb-12 text-center">
            <h2 className="text-xl font-semibold sm:text-2xl lg:text-3xl 2 xl:text-4xl">
              {fields.servicesTitle || "Our Services"}
            </h2>
            {fields.servicesDescription ? (
              <p className="mx-auto mt-4 max-w-2xl text-sm md:text-base lg:text-lg">
                {fields.servicesDescription}
              </p>
            ) : null}
          </div>
          <div id="home-service-items" className="grid gap-8 md:grid-cols-3">
            {resolvedServiceItems.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-stone-200 bg-white p-8 lg:rounded-2xl">
                <h3 className="mb-3 text-xl font-semibold">{feature.title}</h3>
                <p className="text-sm md:text-base lg:text-lg text-stone-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
