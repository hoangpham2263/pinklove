"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CmsPage } from "@/lib/cms";
import { Mail, Phone, MapPin } from "lucide-react";

export function ContactTemplate({ page }: { page: CmsPage }) {
  const fields = page.customFields || {};

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 p-6 md:p-10 lg:flex-row">
      <div className="flex-1 space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">{page.title}</h1>
          {page.excerpt && (
            <p className="text-xl text-muted-foreground leading-relaxed">
              {page.excerpt}
            </p>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
          {fields.contactEmail && (
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Mail className="size-6" />
              </div>
              <div>
                <p className="font-bold">Email</p>
                <p className="text-muted-foreground">{fields.contactEmail}</p>
              </div>
            </div>
          )}
          {fields.contactPhone && (
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <Phone className="size-6" />
              </div>
              <div>
                <p className="font-bold">Phone</p>
                <p className="text-muted-foreground">{fields.contactPhone}</p>
              </div>
            </div>
          )}
          {fields.contactAddress && (
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary">
                <MapPin className="size-6" />
              </div>
              <div>
                <p className="font-bold">Address</p>
                <p className="text-muted-foreground whitespace-pre-wrap">{fields.contactAddress}</p>
              </div>
            </div>
          )}
        </div>

        {fields.googleMapsEmbed && (
          <div className="aspect-video w-full overflow-hidden rounded-xl border bg-muted">
            <iframe
              src={fields.googleMapsEmbed}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        )}
        
        {page.body && (
          <div className="prose dark:prose-invert max-w-none whitespace-pre-wrap border-t pt-8">
            {page.body}
          </div>
        )}
      </div>

      <Card className="w-full lg:max-w-md shrink-0 self-start sticky top-24 border-primary/10">
        <CardHeader className="bg-primary/5">
          <CardTitle>Send Message</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label htmlFor="contact-name" className="font-medium text-sm">Full Name</label>
              <Input id="contact-name" placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <label htmlFor="contact-email" className="font-medium text-sm">Email</label>
              <Input id="contact-email" type="email" placeholder="email@example.com" />
            </div>
            <div className="space-y-2">
              <label htmlFor="contact-message" className="font-medium text-sm">Message</label>
              <textarea 
                id="contact-message"
                className="min-h-32 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                placeholder="How can we help you?"
              />
            </div>
            <Button className="w-full" size="lg">Send Message</Button>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
