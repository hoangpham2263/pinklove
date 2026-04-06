import { CmsPage } from "@/lib/cms";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/utils";

export function HomeTemplate({ page }: { page: CmsPage }) {
  const fields = page.customFields || {};

  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="bg-primary/5 py-24 px-6 text-center border-b border-primary/10">
        <div className="mx-auto max-w-4xl space-y-6">
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-primary">
            {fields.heroTitle || page.title}
          </h1>
          {(fields.heroDescription || page.excerpt) && (
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {fields.heroDescription || page.excerpt}
            </p>
          )}
          <div className="pt-6 flex flex-wrap justify-center gap-4">
            <Link 
              href={fields.heroButtonLink || "/about-us"} 
              className={cn(buttonVariants({ size: "lg" }))}
            >
              {fields.heroButtonText || "Learn more"}
            </Link>
            {(fields.secondaryButtonText) && (
              <Link 
                href={fields.secondaryButtonLink || "/contact"} 
                className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
              >
                {fields.secondaryButtonText}
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      {page.body && (
        <section className="mx-auto max-w-5xl py-20 px-6">
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-lg leading-relaxed">
            {page.body}
          </div>
        </section>
      )}

      {/* Default feature section */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { title: "Design Consultation", desc: "Our professional team is always ready to help." },
              { title: "Turnkey Solutions", desc: "Ensuring high quality and timely completion." },
              { title: "Maintenance", desc: "Always by your side throughout the journey." },
            ].map((feature, i) => (
              <div key={i} className="rounded-xl border bg-card p-8 transition-shadow">
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}