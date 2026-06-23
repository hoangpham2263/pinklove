import Image from "next/image";
import { NativeForm } from "@/components/common/native-form";
import { resolveMediaUrl } from "@/lib/media-resolver";
import { BuilderInvitationTemplate } from "@/features/invitations/builder/renderer";
import { listPublicWeddingTimeline } from "@/features/wedding-planning/server/service";
import { ROUTES } from "@/lib/routes";
import { INVITATION_SITE_TYPES, type InvitationSite } from "../types";

function getCoupleTitle(data: Record<string, unknown>, fallback: string) {
  const brideName = String(data.brideName || "").trim();
  const groomName = String(data.groomName || "").trim();

  if (brideName || groomName) {
    return [groomName, brideName].filter(Boolean).join(" & ");
  }

  return String(data.heroTitle || fallback);
}

function RsvpForm({ site }: { site: InvitationSite }) {
  return (
    <section id="rsvp" className="mx-auto max-w-5xl px-6 pb-24">
      <div className="rounded-2xl border bg-background/95 p-8">
        <h2 className="text-2xl font-semibold">RSVP</h2>
        <NativeForm action={ROUTES.API.INVITATIONS.RSVP} method="POST" className="mt-5 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="weddingSiteId" value={site.id} />
          <input type="hidden" name="returnTo" value={ROUTES.INVITATIONS.PUBLIC(site.slug)} />
          <input name="attendeeName" placeholder="Tên của bạn" className="h-11 rounded-md border bg-background px-3 text-sm" required />
          <input name="attendeeCount" type="number" min="1" defaultValue="1" placeholder="Số người tham dự" className="h-11 rounded-md border bg-background px-3 text-sm" />
          <select name="responseStatus" defaultValue="accepted" className="h-11 rounded-md border bg-background px-3 text-sm">
            <option value="accepted">Sẽ tham dự</option>
            <option value="declined">Không tham dự</option>
            <option value="maybe">Có thể</option>
          </select>
          <input name="mealChoice" placeholder="Lựa chọn món ăn" className="h-11 rounded-md border bg-background px-3 text-sm" />
          <textarea name="specialRequests" placeholder="Lời nhắn hoặc yêu cầu đặc biệt" className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm md:col-span-2" />
          <button className="h-11 rounded-md bg-stone-950 px-5 text-sm font-medium text-white md:col-span-2">Gửi RSVP</button>
        </NativeForm>
      </div>
    </section>
  );
}

function TimelineSection({ timeline }: { timeline: Record<string, unknown>[] }) {
  if (timeline.length === 0) return null;
  return (
    <section className="mx-auto max-w-5xl px-6 pb-12">
      <h2 className="text-2xl font-semibold">Lịch trình</h2>
      <div className="mt-5 divide-y rounded-2xl border bg-background/90">
        {timeline.map((item, index) => (
          <div key={`${String(item.title)}-${index}`} className="grid gap-2 p-5 md:grid-cols-[12rem_minmax(0,1fr)]">
            <p className="text-sm text-muted-foreground">{String(item.starts_at || "Đang cập nhật")}</p>
            <div>
              <p className="font-medium">{String(item.title)}</p>
              <p className="text-sm text-muted-foreground">{String(item.timeline_type || "custom")}</p>
              {item.notes ? <p className="mt-2 text-sm text-muted-foreground">{String(item.notes)}</p> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export async function RomanticBloomTemplate({ site }: { site: InvitationSite }) {
  const data = site.customData;
  const rawGallery = Array.isArray(data.gallery) ? (data.gallery as string[]) : [];
  const [gallery, timeline] = await Promise.all([
    Promise.all(rawGallery.map((image) => resolveMediaUrl(image))).then((items) => items.filter((image): image is string => Boolean(image))),
    listPublicWeddingTimeline(site.id),
  ]);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,rgba(255,241,242,0.8),rgba(255,255,255,1))]">
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <p className="text-sm uppercase tracking-[4px] text-muted-foreground">Wedding Invitation</p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight md:text-7xl">
          {getCoupleTitle(data, site.title)}
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
                <Image
                  key={`${image}-${index}`}
                  src={image}
                  alt=""
                  width={800}
                  height={1000}
                  className="aspect-4/5 w-full rounded-xl object-cover"
                />
              ))}
            </div>
          )}
        </div>
      </section>
      <TimelineSection timeline={timeline} />
      <RsvpForm site={site} />
    </div>
  );
}

export async function ClassicGardenTemplate({ site }: { site: InvitationSite }) {
  const data = site.customData;
  const rawGallery = Array.isArray(data.gallery) ? (data.gallery as string[]) : [];
  const [gallery, timeline] = await Promise.all([
    Promise.all(rawGallery.map((image) => resolveMediaUrl(image))).then((items) => items.filter((image): image is string => Boolean(image))),
    listPublicWeddingTimeline(site.id),
  ]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#f4f0e8,white_55%)]">
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-[32px] border bg-background/90 p-10 md:p-16">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="uppercase tracking-[5px] text-muted-foreground">Save The Date</p>
              <h1 className="mt-4 text-5xl font-semibold md:text-6xl">
                {getCoupleTitle(data, site.title)}
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
                  <Image
                    key={`${image}-${index}`}
                    src={image}
                    alt=""
                    width={1280}
                    height={720}
                    className="aspect-video w-full rounded-xl object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      <TimelineSection timeline={timeline} />
      <RsvpForm site={site} />
    </div>
  );
}

export async function renderInvitationSite(site: InvitationSite) {
  if (site.siteType === INVITATION_SITE_TYPES.EDITABLE) {
    const timeline = await listPublicWeddingTimeline(site.id);
    return (
      <>
        <BuilderInvitationTemplate site={site} />
        <div className="bg-background">
          <TimelineSection timeline={timeline} />
          <RsvpForm site={site} />
        </div>
      </>
    );
  }

  switch (site.templateKey) {
    case "golden_aisle":
    case "moonlight_garden":
    case "pearl_manor":
      return <ClassicGardenTemplate site={site} />;
    case "aurora_veil":
    case "blush_sonata":
    case "linen_vows":
    default:
      return <RomanticBloomTemplate site={site} />;
  }
}
