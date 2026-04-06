import { BuilderWeddingSiteTemplate } from "@/features/wedding-sites/builder/renderer";
import type { WeddingSite } from "../types";

export function RomanticBloomTemplate({ site }: { site: WeddingSite }) {
  const data = site.customData;
  const gallery = Array.isArray(data.gallery) ? (data.gallery as string[]) : [];

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(255,241,242,0.8),rgba(255,255,255,1))]">
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="text-sm uppercase tracking-[4px] text-muted-foreground">Wedding Invitation</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-7xl">
          {String(data.heroTitle || site.title)}
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
          {String(data.heroSubtitle || "")}
        </p>
        <div className="mt-10 inline-flex flex-col gap-2 rounded-xl border bg-background/80 px-8 py-4">
          <span className="text-sm uppercase tracking-[3px] text-muted-foreground">Thời gian</span>
          <span className="text-2xl font-semibold">{String(data.eventDate || "Sắp cập nhật")}</span>
          <span className="text-muted-foreground">{String(data.venue || "")}</span>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-6 pb-24 md:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border bg-background/90 p-8">
          <h2 className="text-2xl font-semibold">{String(data.storyTitle || "Câu chuyện")}</h2>
          <p className="mt-4 whitespace-pre-wrap text-muted-foreground">
            {String(data.storyBody || "")}
          </p>
        </div>
        <div className="rounded-2xl border bg-card p-8">
          <h2 className="text-2xl font-semibold">Bộ sưu tập</h2>
          {gallery.length === 0 ? (
            <p className="mt-4 text-muted-foreground">Chưa có ảnh nào được thêm.</p>
          ) : (
            <div className="mt-4 grid grid-cols-2 gap-3">
              {gallery.map((image, index) => (
                <img key={`${image}-${index}`} src={image} alt="" className="aspect-[4/5] w-full rounded-xl object-cover" />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export function ClassicGardenTemplate({ site }: { site: WeddingSite }) {
  const data = site.customData;
  const gallery = Array.isArray(data.gallery) ? (data.gallery as string[]) : [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f4f0e8,white_55%)]">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-[32px] border bg-background/90 p-10 md:p-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="uppercase tracking-[5px] text-muted-foreground">Save The Date</p>
              <h1 className="mt-4 text-5xl font-semibold md:text-6xl">
                {String(data.heroTitle || site.title)}
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                {String(data.heroSubtitle || "")}
              </p>
            </div>
            <div className="rounded-2xl border bg-muted/40 p-8">
              <p className="text-sm uppercase tracking-[4px] text-muted-foreground">Lễ cưới</p>
              <p className="mt-3 text-3xl font-semibold">{String(data.eventDate || "")}</p>
              <p className="mt-2 text-muted-foreground">{String(data.venue || "")}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2 rounded-2xl border bg-card p-8">
            <h2 className="text-2xl font-semibold">{String(data.storyTitle || "Our Story")}</h2>
            <p className="mt-4 whitespace-pre-wrap text-muted-foreground">
              {String(data.storyBody || "")}
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-8">
            <h2 className="text-2xl font-semibold">Gallery</h2>
            {gallery.length === 0 ? (
              <p className="mt-4 text-muted-foreground">Chưa có ảnh nào.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {gallery.slice(0, 3).map((image, index) => (
                  <img key={`${image}-${index}`} src={image} alt="" className="aspect-video w-full rounded-xl object-cover" />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export function renderWeddingSite(site: WeddingSite) {
  if (site.siteType === "builder_template") {
    return <BuilderWeddingSiteTemplate site={site} />;
  }

  switch (site.templateKey) {
    case "classic_garden":
      return <ClassicGardenTemplate site={site} />;
    case "romantic_bloom":
    default:
      return <RomanticBloomTemplate site={site} />;
  }
}
