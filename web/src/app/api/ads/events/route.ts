import { NextResponse } from "next/server";

import { trackAdEvent, trackProviderPromotionEvent } from "@/features/ads/server/service";

export const runtime = "nodejs";

const EVENT_TYPES = new Set(["impression", "click"]);
const KINDS = new Set(["ad", "provider-promotion"]);

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const kind = String(payload.kind ?? "");
    const id = String(payload.id ?? "");
    const eventType = String(payload.eventType ?? "");

    if (!KINDS.has(kind) || !id || !EVENT_TYPES.has(eventType)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    if (kind === "ad") {
      await trackAdEvent({
        campaignId: id,
        eventType: eventType as "impression" | "click",
        targetType: typeof payload.targetType === "string" ? payload.targetType : undefined,
        targetId: typeof payload.targetId === "string" ? payload.targetId : undefined,
        metadata: typeof payload.metadata === "object" && payload.metadata ? payload.metadata : {},
      });
    } else {
      await trackProviderPromotionEvent({
        promotionId: id,
        providerId: typeof payload.providerId === "string" ? payload.providerId : undefined,
        eventType: eventType as "impression" | "click",
        targetType: typeof payload.targetType === "string" ? payload.targetType : undefined,
        targetId: typeof payload.targetId === "string" ? payload.targetId : undefined,
        metadata: typeof payload.metadata === "object" && payload.metadata ? payload.metadata : {},
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
