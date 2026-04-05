"use client";

import { Card, CardContent, CardHeader, CardTitle } from"@/components/ui/card";
import { Input } from"@/components/ui/input";
import { Button } from"@/components/ui/button";
import { CmsPage } from"@/lib/cms";

export function ContactTemplate({ page }: { page: CmsPage }) {
 return (
 <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 p-6 md:p-10 lg:flex-row">
  <div className="flex-1 space-y-6">
  <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
  {page.excerpt ? (
   <p className="text-xl text-muted-foreground leading-relaxed">
   {page.excerpt}
   </p>
  ) : null}
  
  {page.body ? (
   <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap">
   {page.body}
   </div>
  ) : null}
  </div>

  <Card className="w-full lg:max-w-md shrink-0">
  <CardHeader>
   <CardTitle>Send Message</CardTitle>
  </CardHeader>
  <CardContent>
   <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
   <div className="space-y-2">
    <label htmlFor="contact-name" className="font-medium">Full Name</label>
    <Input id="contact-name" placeholder="" />
   </div>
   <div className="space-y-2">
    <label htmlFor="contact-email" className="font-medium">Email</label>
    <Input id="contact-email" type="email" placeholder="" />
   </div>
   <div className="space-y-2">
    <label htmlFor="contact-message" className="font-medium">Message</label>
    <textarea 
    id="contact-message"
    className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 focus:outline-none"
    placeholder=""
    />
   </div>
   <Button className="w-full">Send Message</Button>
   </form>
  </CardContent>
  </Card>
 </section>
 );
}
