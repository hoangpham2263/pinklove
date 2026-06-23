import { GuestMarketingPageDecor } from "@/app/(guest)/_components/guest-marketing-background";

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="guest-soft-top-bg contact-wave-bg relative isolate flex min-h-screen flex-col overflow-hidden">
      <GuestMarketingPageDecor />
      <div className="relative z-10 flex min-h-screen flex-col">{children}</div>
    </main>
  );
}
