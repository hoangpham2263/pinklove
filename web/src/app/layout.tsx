import { Suspense } from "react";
import type { Metadata } from"next";
import"./globals.css";
import { AppToaster } from"@/components/common/app-toaster";
import { ConfirmProvider } from "@/components/common/confirm-provider";
import { AffiliateRefTracker } from "@/features/affiliate/components/affiliate-ref-tracker";
import { createRootMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
 return createRootMetadata();
}

export default function RootLayout({
 children,
}: Readonly<{
 children: React.ReactNode;
}>) {
 return (
 <html lang="en" className="h-full antialiased">
  <body className="min-h-full flex flex-col">
  <ConfirmProvider>
   <Suspense fallback={null}>
    <AffiliateRefTracker />
   </Suspense>
   {children}
   <AppToaster />
  </ConfirmProvider>
  </body>
 </html>
 );
}
