import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { CmsPage } from"@/lib/cms";

export function DefaultTemplate({ page }: { page: CmsPage }) {
 return (
 <section className="mx-auto flex w-full max-w-6xl flex-1 p-6 md:p-10">
  <Card className="w-full">
  <CardHeader>
   <CardTitle>{page.title}</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
   {page.excerpt ? <p className="text-muted-foreground text-lg">{page.excerpt}</p> : null}
   {page.body ? (
   <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
    {page.body}
   </div>
   ) : null}
  </CardContent>
  </Card>
 </section>
 );
}
