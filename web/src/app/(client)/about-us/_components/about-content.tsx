import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import type { CmsPage } from "@/lib/cms";
import { getFields } from "@/lib/cms-fields";

export function AboutContent({ page }: { page: CmsPage }) {
  const fields = getFields<{
    bannerImage?: string;
    introHeading?: string;
    introText?: string;
  }>(page);

  return (
    <div className="flex-1">
      <section className="relative h-[300px] w-full overflow-hidden bg-muted md:h-[400px]">
        {fields.bannerImage ? (
          <Image src={fields.bannerImage} alt="Banner" fill className="object-cover opacity-60" priority />
        ) : (
          <div className="absolute inset-0 bg-primary/10" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-auto max-w-4xl space-y-4 px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">{page.title}</h1>
            {page.excerpt ? (
              <p className="mx-auto max-w-2xl text-xl italic text-muted-foreground">&quot;{page.excerpt}&quot;</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card className="border-none bg-transparent">
              <CardContent className="space-y-6 p-0">
                {fields.introHeading ? <h2 className="text-3xl font-bold">{fields.introHeading}</h2> : null}
                {fields.introText ? <p className="text-lg leading-relaxed text-muted-foreground">{fields.introText}</p> : null}
                {page.body ? (
                  <div className="prose max-w-none whitespace-pre-wrap pt-4 text-lg leading-relaxed dark:prose-invert">
                    {page.body}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-4 rounded-2xl bg-muted/50 p-8">
              <h3 className="text-xl font-bold">Quick Stats</h3>
              <div className="space-y-4 pt-2">
                <div>
                  <p className="text-3xl font-extrabold text-primary">10+</p>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Years Experience</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-primary">500+</p>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Happy Clients</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
