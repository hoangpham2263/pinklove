import { CmsPage } from "@/lib/cms";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

export function AboutTemplate({ page }: { page: CmsPage }) {
  const fields = page.customFields || {};

  return (
    <div className="flex-1">
      {/* Banner/Header section */}
      <section className="relative h-[300px] md:h-[400px] w-full overflow-hidden bg-muted">
        {fields.bannerImage ? (
          <Image 
            src={fields.bannerImage} 
            alt="Banner" 
            fill 
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-primary/10" />
        )}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="mx-auto max-w-4xl text-center space-y-4 px-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{page.title}</h1>
            {page.excerpt && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto italic">
                &quot;{page.excerpt}&quot;
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-4xl py-12 px-6">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <Card className="border-none shadow-none bg-transparent">
              <CardContent className="p-0 space-y-6">
                {fields.introHeading && (
                  <h2 className="text-3xl font-bold">{fields.introHeading}</h2>
                )}
                {fields.introText && (
                  <p className="text-lg leading-relaxed text-muted-foreground">
                    {fields.introText}
                  </p>
                )}
                {page.body && (
                  <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-lg leading-relaxed pt-4">
                    {page.body}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-4">
            <div className="sticky top-24 rounded-2xl bg-muted/50 p-8 space-y-4">
              <h3 className="font-bold text-xl">Quick Stats</h3>
              <div className="space-y-4 pt-2">
                <div>
                  <p className="text-3xl font-extrabold text-primary">10+</p>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Years Experience</p>
                </div>
                <div>
                  <p className="text-3xl font-extrabold text-primary">500+</p>
                  <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Happy Clients</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}