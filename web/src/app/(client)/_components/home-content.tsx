import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import type { CmsPage } from "@/lib/cms";
import { getFields } from "@/lib/cms-fields";
import { cn } from "@/lib/utils";

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
    <div className="flex-1">
      <section className="border-b border-primary/10 bg-primary/5 px-6 py-24 text-center">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary md:text-7xl">
            {fields.heroTitle || page.title}
          </h1>
          {(fields.heroDescription || page.excerpt) && (
            <p className="mx-auto max-w-2xl text-xl leading-relaxed text-muted-foreground md:text-2xl">
              {fields.heroDescription || page.excerpt}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-4 pt-6">
            <Link href={fields.heroButtonLink || "/about-us"} className={cn(buttonVariants({ size: "lg" }))}>
              {fields.heroButtonText || "Learn more"}
            </Link>
            {fields.secondaryButtonText ? (
              <Link href={fields.secondaryButtonLink || "/contact"} className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
                {fields.secondaryButtonText}
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {page.body ? (
        <section className="mx-auto max-w-5xl px-6 py-20">
          <div className="prose max-w-none whitespace-pre-wrap text-lg leading-relaxed dark:prose-invert">
            {page.body}
          </div>
        </section>
      ) : null}

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="mb-12 text-center text-3xl font-bold">Our Services</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: "Design Consultation", desc: "Our professional team is always ready to help." },
              { title: "Turnkey Solutions", desc: "Ensuring high quality and timely completion." },
              { title: "Maintenance", desc: "Always by your side throughout the journey." },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border bg-card p-8 transition-colors">
                <h3 className="mb-3 text-xl font-bold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
