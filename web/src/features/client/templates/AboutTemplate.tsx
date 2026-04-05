import { CmsPage } from"@/lib/cms";
import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";

export function AboutTemplate({ page }: { page: CmsPage }) {
 return (
 <div className="flex-1">
  {/* Banner/Header section */}
  <section className="bg-muted py-16 px-6">
  <div className="mx-auto max-w-4xl text-center space-y-4">
   <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
   {page.excerpt ? (
   <p className="text-xl text-muted-foreground max-w-2xl mx-auto italic">
  "{page.excerpt}"
   </p>
   ) : null}
  </div>
  </section>

  {/* Main content */}
  <section className="mx-auto max-w-4xl py-12 px-6">
  <Card className="border-none shadow-none bg-transparent">
   <CardContent className="p-0">
   {page.body ? (
    <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap text-lg leading-relaxed">
    {page.body}
    </div>
   ) : null}
   </CardContent>
  </Card>
  </section>

  {/* Optional team or values section could go here if we had more data fields */}
 </div>
 );
}
