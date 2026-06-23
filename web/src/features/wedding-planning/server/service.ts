import "server-only";

import { CONVERSION_GOAL_KEYS, recordConversion } from "@/features/analytics/server/conversions";
import { createAdminNotification } from "@/features/notifications/server/service";
import { query } from "@/lib/database";
import { sendEmail } from "@/lib/email";

export const WEDDING_TASK_CATEGORIES = [
  "venue",
  "photo",
  "video",
  "makeup",
  "planner",
  "decoration",
  "transportation",
  "legal",
  "gift",
  "other",
] as const;
export const WEDDING_TASK_STATUSES = ["pending", "in_progress", "completed", "cancelled"] as const;
export const WEDDING_TIMELINE_TYPES = ["preparation", "ceremony", "reception", "custom"] as const;

export type GuestGroupRow = { id: string; name: string; sort_order: number };
export type WeddingGuestRow = { id: string; full_name: string; group_label: string | null };
export type WeddingRsvpRow = { id: string; attendee_name: string; response_status: string; attendee_count: number };
export type WeddingTableRow = { id: string; name: string; capacity: number; assigned_guests: number };
export type WeddingTaskRow = { id: string; title: string; category: string; status: string; due_date: string | null };
export type WeddingTimelineRow = { id: string; title: string; timeline_type: string; starts_at: string | null };

export async function listWeddingPlanningForAdmin() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        site.id,
        site.title,
        site.slug,
        COALESCE(profile.display_name, account.account_name) AS customer,
        site.project_status,
        site.budget::text,
        site.event_date::text,
        site.guest_target,
        COUNT(DISTINCT guest.id)::int AS guests,
        COUNT(DISTINCT rsvp.id)::int AS rsvps,
        COUNT(DISTINCT wedding_table.id)::int AS tables,
        COUNT(DISTINCT task.id)::int AS tasks,
        COUNT(DISTINCT timeline.id)::int AS timeline_items,
        site.updated_at
      FROM wedding_sites site
      INNER JOIN users account ON account.id = site.user_id
      LEFT JOIN user_profiles profile ON profile.user_id = account.id
      LEFT JOIN wedding_site_guests guest ON guest.wedding_site_id = site.id
      LEFT JOIN wedding_site_rsvps rsvp ON rsvp.wedding_site_id = site.id
      LEFT JOIN wedding_tables wedding_table ON wedding_table.wedding_site_id = site.id
      LEFT JOIN wedding_tasks task ON task.wedding_site_id = site.id
      LEFT JOIN wedding_timeline_items timeline ON timeline.wedding_site_id = site.id
      GROUP BY site.id, profile.display_name, account.account_name
      ORDER BY site.updated_at DESC
    `
  );
  return result.rows;
}

export async function getWeddingPlanningDetailForAdmin(weddingSiteId: string) {
  const site = await query<Record<string, unknown>>(
    `
      SELECT
        site.id,
        site.title,
        site.slug,
        COALESCE(profile.display_name, account.account_name) AS customer,
        site.project_status,
        site.budget::text,
        site.event_date::text,
        site.guest_target,
        site.updated_at::text
      FROM wedding_sites site
      INNER JOIN users account ON account.id = site.user_id
      LEFT JOIN user_profiles profile ON profile.user_id = account.id
      WHERE site.id = $1
      LIMIT 1
    `,
    [weddingSiteId]
  );

  const row = site.rows[0];
  if (!row) return null;

  const [guests, rsvps, tables, tasks, timeline] = await Promise.all([
    query<Record<string, unknown>>(
      `
        SELECT guest.full_name, guest.phone, guest.email, guest_group.name AS group_label, guest.created_at::text
        FROM wedding_site_guests guest
        LEFT JOIN guest_groups guest_group ON guest_group.id = guest.guest_group_id
        WHERE guest.wedding_site_id = $1
        ORDER BY guest.created_at DESC
      `,
      [weddingSiteId]
    ),
    query<Record<string, unknown>>(
      `
        SELECT attendee_name, attendee_count, response_status, meal_choice, special_requests, created_at::text
        FROM wedding_site_rsvps
        WHERE wedding_site_id = $1
        ORDER BY created_at DESC
      `,
      [weddingSiteId]
    ),
    query<Record<string, unknown>>(
      `
        SELECT wedding_table.name, wedding_table.capacity, COUNT(table_guest.guest_id)::int AS assigned_guests
        FROM wedding_tables wedding_table
        LEFT JOIN wedding_table_guests table_guest ON table_guest.table_id = wedding_table.id
        WHERE wedding_table.wedding_site_id = $1
        GROUP BY wedding_table.id
        ORDER BY wedding_table.sort_order, wedding_table.created_at
      `,
      [weddingSiteId]
    ),
    query<Record<string, unknown>>(
      `
        SELECT title, category, status, priority, due_date::text
        FROM wedding_tasks
        WHERE wedding_site_id = $1
        ORDER BY due_date NULLS LAST, created_at DESC
      `,
      [weddingSiteId]
    ),
    query<Record<string, unknown>>(
      `
        SELECT title, timeline_type, starts_at::text, ends_at::text
        FROM wedding_timeline_items
        WHERE wedding_site_id = $1
        ORDER BY starts_at NULLS LAST, created_at DESC
      `,
      [weddingSiteId]
    ),
  ]);

  return {
    site: row,
    guests: guests.rows,
    rsvps: rsvps.rows,
    tables: tables.rows,
    tasks: tasks.rows,
    timeline: timeline.rows,
  };
}

export async function getWeddingPlanningWorkspace(userId: string, weddingSiteId?: string) {
  const sites = await query<{
    id: string;
    title: string;
    slug: string;
    project_status: string;
    budget: string;
    event_date: string | null;
    guest_target: number;
  }>(
    `
      SELECT id, title, slug, project_status, budget::text, event_date::text, guest_target
      FROM wedding_sites
      WHERE user_id = $1
      ORDER BY updated_at DESC
    `,
    [userId]
  );
  const activeSite = sites.rows.find((site) => site.id === weddingSiteId) ?? sites.rows[0] ?? null;
  if (!activeSite) {
    return { sites: sites.rows, activeSite: null, groups: [], guests: [], rsvps: [], tables: [], tasks: [], timeline: [] };
  }

  const [groups, guests, rsvps, tables, tasks, timeline] = await Promise.all([
    query<GuestGroupRow>(`SELECT id, name, sort_order FROM guest_groups WHERE wedding_site_id = $1 ORDER BY sort_order, created_at`, [activeSite.id]),
    query<WeddingGuestRow>(
      `
        SELECT guest.*, guest_group.name AS group_label
        FROM wedding_site_guests guest
        LEFT JOIN guest_groups guest_group ON guest_group.id = guest.guest_group_id
        WHERE guest.wedding_site_id = $1
        ORDER BY guest.created_at
      `,
      [activeSite.id]
    ),
    query<WeddingRsvpRow>(`SELECT id, attendee_name, response_status, attendee_count FROM wedding_site_rsvps WHERE wedding_site_id = $1 ORDER BY created_at DESC`, [activeSite.id]),
    query<WeddingTableRow>(
      `
        SELECT wedding_table.*,
          COUNT(table_guest.guest_id)::int AS assigned_guests
        FROM wedding_tables wedding_table
        LEFT JOIN wedding_table_guests table_guest ON table_guest.table_id = wedding_table.id
        WHERE wedding_table.wedding_site_id = $1
        GROUP BY wedding_table.id
        ORDER BY wedding_table.sort_order, wedding_table.created_at
      `,
      [activeSite.id]
    ),
    query<WeddingTaskRow>(`SELECT id, title, category, status, due_date::text FROM wedding_tasks WHERE wedding_site_id = $1 ORDER BY due_date NULLS LAST, created_at`, [activeSite.id]),
    query<WeddingTimelineRow>(`SELECT id, title, timeline_type, starts_at::text FROM wedding_timeline_items WHERE wedding_site_id = $1 ORDER BY starts_at NULLS LAST, created_at`, [activeSite.id]),
  ]);

  return {
    sites: sites.rows,
    activeSite,
    groups: groups.rows,
    guests: guests.rows,
    rsvps: rsvps.rows,
    tables: tables.rows,
    tasks: tasks.rows,
    timeline: timeline.rows,
  };
}

export async function assertWeddingSiteOwnership(userId: string, weddingSiteId: string) {
  const result = await query<{ id: string }>(
    "SELECT id FROM wedding_sites WHERE id = $1 AND user_id = $2 LIMIT 1",
    [weddingSiteId, userId]
  );
  return Boolean(result.rows[0]);
}

export async function listPublicWeddingTimeline(weddingSiteId: string) {
  const result = await query<Record<string, unknown>>(
    `
      SELECT title, timeline_type, starts_at::text, ends_at::text, notes
      FROM wedding_timeline_items
      WHERE wedding_site_id = $1
      ORDER BY starts_at NULLS LAST, created_at
    `,
    [weddingSiteId]
  );
  return result.rows;
}

export async function updateWeddingProject(input: {
  userId: string;
  weddingSiteId: string;
  projectStatus: string;
  budget: number;
  eventDate?: string | null;
  guestTarget: number;
}) {
  const result = await query<{ id: string }>(
    `
      UPDATE wedding_sites
      SET project_status = $3, budget = $4, event_date = $5::date, guest_target = $6, updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING id
    `,
    [
      input.weddingSiteId,
      input.userId,
      input.projectStatus,
      Math.max(0, input.budget),
      input.eventDate || null,
      Math.max(0, input.guestTarget),
    ]
  );
  return Boolean(result.rows[0]);
}

export async function createGuestGroup(input: { weddingSiteId: string; name: string }) {
  await query(
    `
      INSERT INTO guest_groups (wedding_site_id, name, sort_order)
      VALUES (
        $1,
        $2,
        COALESCE((SELECT MAX(sort_order) + 1 FROM guest_groups WHERE wedding_site_id = $1), 0)
      )
    `,
    [input.weddingSiteId, input.name]
  );
}

export async function createWeddingGuest(input: {
  weddingSiteId: string;
  fullName: string;
  phone?: string;
  email?: string;
  guestGroupId?: string | null;
  note?: string;
}) {
  await query(
    `
      INSERT INTO wedding_site_guests (
        wedding_site_id, full_name, phone, email, guest_group_id, note
      )
      VALUES ($1, $2, $3, $4, $5, $6)
    `,
    [input.weddingSiteId, input.fullName, input.phone ?? "", input.email ?? "", input.guestGroupId ?? null, input.note ?? ""]
  );
}

export async function saveRsvp(input: {
  weddingSiteId: string;
  guestId?: string | null;
  attendeeName: string;
  attendeeCount: number;
  responseStatus: string;
  mealChoice?: string;
  specialRequests?: string;
  userId?: string | null;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO wedding_site_rsvps (
        wedding_site_id, guest_id, attendee_name, attendee_count, response_status,
        meal_choice, special_requests, responded_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING id
    `,
    [
      input.weddingSiteId,
      input.guestId ?? null,
      input.attendeeName,
      Math.max(1, input.attendeeCount),
      input.responseStatus,
      input.mealChoice ?? "",
      input.specialRequests ?? "",
    ]
  );
  await recordConversion({
    goalKey: CONVERSION_GOAL_KEYS.RSVP_SUBMITTED,
    userId: input.userId,
    targetType: "wedding_site_rsvp",
    targetId: result.rows[0]?.id,
  });

  const owner = await query<{ user_id: string; title: string; contact_email: string | null }>(
    `
      SELECT site.user_id, site.title, profile.contact_email
      FROM wedding_sites site
      LEFT JOIN user_profiles profile ON profile.user_id = site.user_id
      WHERE site.id = $1
      LIMIT 1
    `,
    [input.weddingSiteId]
  );
  const siteOwner = owner.rows[0];
  if (siteOwner) {
    await createAdminNotification({
      actorUserId: siteOwner.user_id,
      title: "Có RSVP mới",
      body: `${input.attendeeName} vừa phản hồi RSVP cho ${siteOwner.title}.`,
      linkUrl: `/customer/wedding-planning?site=${encodeURIComponent(input.weddingSiteId)}`,
      audienceType: "users",
      userIds: [siteOwner.user_id],
      sendMode: "now",
    });
    if (siteOwner.contact_email) {
      try {
        await sendEmail({
          to: siteOwner.contact_email,
          subject: `RSVP mới cho ${siteOwner.title}`,
          text: `${input.attendeeName} vừa phản hồi RSVP (${input.responseStatus}) cho ${siteOwner.title}.`,
        });
      } catch (error) {
        console.warn("Failed to send RSVP email notification", error);
      }
    }
  }
  return result.rows[0]?.id ?? "";
}

export async function createWeddingTable(input: {
  weddingSiteId: string;
  name: string;
  capacity: number;
  notes?: string;
}) {
  await query(
    `
      INSERT INTO wedding_tables (wedding_site_id, name, capacity, sort_order, notes)
      VALUES (
        $1,
        $2,
        $3,
        COALESCE((SELECT MAX(sort_order) + 1 FROM wedding_tables WHERE wedding_site_id = $1), 0),
        $4
      )
    `,
    [input.weddingSiteId, input.name, Math.max(0, input.capacity), input.notes ?? ""]
  );
}

export async function assignGuestToTable(input: {
  weddingSiteId: string;
  tableId: string;
  guestId: string;
  seatNumber?: string;
}) {
  await query(
    `
      INSERT INTO wedding_table_guests (table_id, guest_id, seat_number)
      SELECT wedding_table.id, guest.id, $4
      FROM wedding_tables wedding_table
      INNER JOIN wedding_site_guests guest ON guest.id = $3
      WHERE wedding_table.id = $2
        AND wedding_table.wedding_site_id = $1
        AND guest.wedding_site_id = $1
      ON CONFLICT (table_id, guest_id) DO UPDATE SET seat_number = EXCLUDED.seat_number
    `,
    [input.weddingSiteId, input.tableId, input.guestId, input.seatNumber ?? ""]
  );
}

export async function createWeddingTask(input: {
  weddingSiteId: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  priority?: string;
  dueDate?: string | null;
}) {
  await query(
    `
      INSERT INTO wedding_tasks (
        wedding_site_id, title, description, category, status, priority, due_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::date)
    `,
    [
      input.weddingSiteId,
      input.title,
      input.description ?? "",
      input.category,
      input.status,
      input.priority ?? "normal",
      input.dueDate || null,
    ]
  );
}

export async function createWeddingTimelineItem(input: {
  weddingSiteId: string;
  title: string;
  startsAt?: string | null;
  endsAt?: string | null;
  timelineType: string;
  notes?: string;
}) {
  await query(
    `
      INSERT INTO wedding_timeline_items (
        wedding_site_id, title, starts_at, ends_at, timeline_type, notes
      )
      VALUES ($1, $2, $3::timestamptz, $4::timestamptz, $5, $6)
    `,
    [
      input.weddingSiteId,
      input.title,
      input.startsAt || null,
      input.endsAt || null,
      input.timelineType,
      input.notes ?? "",
    ]
  );
}
