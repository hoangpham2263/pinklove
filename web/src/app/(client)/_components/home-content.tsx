import { ClientLinkButton } from "@/app/(client)/_components/client-ui";
import type { CmsPage } from "@/lib/cms";
import { getFields } from "@/lib/cms-fields";

export function HomeContent({ page }: { page: CmsPage }) {
  const fields = getFields<{
    heroTitle?: string;
    heroDescription?: string;
    heroButtonText?: string;
    heroButtonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
  }>(page);

  return (
    <div className="w-full bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.12),_transparent_38%),linear-gradient(180deg,_#fff7fb_0%,_#ffffff_48%,_#fffaf2_100%)]">
      <section className="overflow-hidden border-b border-stone-200 pt-10 lg:pt-15 2xl:pt-20">
        <div className="container mx-auto px-4 pb-16 pt-12 text-center lg:pb-24 lg:pt-20">
          <div className="mx-auto max-w-4xl space-y-6">
          <p className="text-sm uppercase tracking-[0.4em] text-stone-500">pinklove client</p>
          <h1 className="text-2xl font-semibold text-stone-950 sm:text-3xl lg:text-4xl 2xl:text-5xl">
            {fields.heroTitle || page.title}
          </h1>
          {(fields.heroDescription || page.excerpt) && (
            <p className="mx-auto max-w-2xl text-sm leading-7 text-stone-600 md:text-base lg:text-lg">
              {fields.heroDescription || page.excerpt}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <ClientLinkButton href={fields.heroButtonLink || "/about-us"}>
              {fields.heroButtonText || "Learn more"}
            </ClientLinkButton>
            {fields.secondaryButtonText ? (
              <ClientLinkButton href={fields.secondaryButtonLink || "/contact"} variant="secondary">
                {fields.secondaryButtonText}
              </ClientLinkButton>
            ) : null}
          </div>
        </div>
        </div>
      </section>

      {page.body ? (
        <section className="pt-10 lg:pt-15 2xl:pt-20">
          <div className="container mx-auto px-4">
          <div className="mx-auto max-w-5xl whitespace-pre-wrap text-sm leading-8 text-stone-700 md:text-base lg:text-lg">
            {page.body}
          </div>
          </div>
        </section>
      ) : null}

      <section className="bg-stone-100/70 pt-10 lg:pt-15 2xl:pt-20">
        <div className="container mx-auto px-4 pb-16">
          <h2 className="mb-12 text-center text-xl font-semibold text-stone-950 sm:text-2xl lg:text-3xl 2xl:text-4xl">Our Services</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: "Design Consultation", desc: "Our professional team is always ready to help." },
              { title: "Turnkey Solutions", desc: "Ensuring high quality and timely completion." },
              { title: "Maintenance", desc: "Always by your side throughout the journey." },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border border-stone-200 bg-white p-8 lg:rounded-2xl">
                <h3 className="mb-3 text-xl font-semibold text-stone-950">{feature.title}</h3>
                <p className="text-sm leading-7 text-stone-600 md:text-base lg:text-lg">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
