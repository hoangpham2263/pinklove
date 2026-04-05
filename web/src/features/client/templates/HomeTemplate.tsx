import { CmsPage } from"@/lib/cms";
import Link from"next/link";
import { buttonVariants } from"@/components/ui/button-variants";
import { cn } from"@/lib/utils";

export function HomeTemplate({ page }: { page: CmsPage }) {
 return (
 <div className="flex-1">
  {/* Hero Section */}
  <section className="bg-primary/5 py-24 px-6 text-center border-b border-primary/10">
  <div className="mx-auto max-w-4xl space-y-6">
   <h1 className="text-4xl md:text-7xl font-extrabold tracking-tight text-primary">
   {page.title}
   </h1>
   {page.excerpt ? (
   <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
    {page.excerpt}
   </p>
   ) : null}
   <div className="pt-6 flex flex-wrap justify-center gap-4">
   <Link 
    href="/about-us" 
    className={cn(buttonVariants({ size:"lg" }))}
   >
    Learn more
   </Link>
   <Link 
    href="/contact" 
    className={cn(buttonVariants({ variant:"outline", size:"lg" }))}
   >
    Contact us
   </Link>
   </div>
  </div>
  </section>

  {/* Main Content Section */}
  {page.body ? (
  <section className="mx-auto max-w-5xl py-20 px-6">
   <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-lg leading-relaxed">
   {page.body}
   </div>
  </section>
  ) : null}

  {/* Feature section or others could be added here */}
  <section className="bg-muted/30 py-20">
  <div className="mx-auto max-w-6xl px-6">
   <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
   <div className="grid gap-8 md:grid-cols-3">
   {[
    { title:"Design Consultation", desc:"Our professional team is always ready to help." },
    { title:"Turnkey Solutions", desc:"Ensuring high quality and timely completion." },
    { title:"Maintenance", desc:"Always by your side throughout the journey." },
   ].map((feature, i) => (
    <div key={i} className="rounded-xl border bg-card p-8 shadow-sm hover:shadow-md transition-shadow">
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
