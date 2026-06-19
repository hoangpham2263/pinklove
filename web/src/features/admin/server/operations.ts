import "server-only";

import { query } from "@/lib/database";

export async function listAuditLogs() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        log.id,
        log.target_type,
        log.target_id,
        log.field_key,
        COALESCE(profile.display_name, account.username, log.actor_id, 'System') AS actor,
        log.old_value::text,
        log.new_value::text,
        log.created_at::text
      FROM field_change_logs log
      LEFT JOIN users account ON account.id = log.actor_id
      LEFT JOIN user_profiles profile ON profile.user_id = account.id
      ORDER BY log.created_at DESC
      LIMIT 200
    `
  );
  return result.rows;
}

export async function listCampaigns() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        campaign.id,
        campaign.landing_page_id,
        campaign.name,
        campaign.channel,
        campaign.status,
        landing.name AS landing_page,
        campaign.budget::text,
        COALESCE(stats.views, 0) AS views,
        COALESCE(stats.clicks, 0) AS clicks,
        COALESCE(stats.orders, 0) AS orders,
        COALESCE(stats.revenue, 0)::text AS revenue,
        campaign.updated_at::text
      FROM campaigns campaign
      INNER JOIN landing_pages landing ON landing.id = campaign.landing_page_id
      LEFT JOIN campaign_stats stats ON stats.campaign_id = campaign.id
      ORDER BY campaign.updated_at DESC
    `
  );
  return result.rows;
}

export async function getCampaignById(id: string) {
  const rows = await listCampaigns();
  return rows.find((row) => String(row.id) === id) ?? null;
}

export async function listAbExperiments() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        experiment.id,
        experiment.name,
        experiment.status,
        experiment.primary_metric,
        COUNT(variant.landing_page_id)::int AS variants,
        COALESCE(SUM(variant.traffic_percent), 0)::text AS traffic_percent,
        experiment.started_at::text,
        experiment.ended_at::text,
        experiment.updated_at::text
      FROM ab_experiments experiment
      LEFT JOIN ab_experiment_landing_pages variant ON variant.experiment_id = experiment.id
      GROUP BY experiment.id
      ORDER BY experiment.updated_at DESC
    `
  );
  return result.rows;
}

export async function listConversionGoals() {
  const result = await query<Record<string, unknown>>(
    `
      SELECT
        goal.id,
        goal.key,
        goal.label,
        goal.target_type,
        goal.is_active,
        COUNT(event.id)::int AS conversions,
        goal.updated_at::text
      FROM conversion_goals goal
      LEFT JOIN conversion_events event ON event.goal_id = goal.id
      GROUP BY goal.id
      ORDER BY goal.key
    `
  );
  return result.rows;
}

export async function saveCampaign(input: {
  id?: string;
  intent?: string;
  name: string;
  channel: string;
  landingPageId: string;
  status?: string;
  budget?: number;
}) {
  if (input.intent === "archive" && input.id) {
    await query("UPDATE campaigns SET status = 'archived', updated_at = NOW() WHERE id = $1", [input.id]);
    return input.id;
  }

  if (input.intent === "update" && input.id) {
    await query(
      `
        UPDATE campaigns
        SET name = $2, channel = $3, landing_page_id = $4, status = $5,
            budget = $6, updated_at = NOW()
        WHERE id = $1
      `,
      [
        input.id,
        input.name,
        input.channel,
        input.landingPageId,
        input.status ?? "draft",
        Math.max(0, input.budget ?? 0),
      ]
    );
    return input.id;
  }

  const result = await query<{ id: string }>(
    `
      INSERT INTO campaigns (name, channel, landing_page_id, status, budget)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `,
    [input.name, input.channel, input.landingPageId, input.status ?? "draft", Math.max(0, input.budget ?? 0)]
  );
  return result.rows[0]?.id ?? "";
}

export async function saveAbExperiment(input: {
  name: string;
  status?: string;
  primaryMetric?: string;
  landingPageId?: string;
  trafficPercent?: number;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO ab_experiments (name, status, primary_metric)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
    [input.name, input.status ?? "draft", input.primaryMetric ?? "orders"]
  );
  const experimentId = result.rows[0]?.id ?? "";
  if (experimentId && input.landingPageId) {
    await query(
      `
        INSERT INTO ab_experiment_landing_pages (experiment_id, landing_page_id, traffic_percent)
        VALUES ($1, $2, $3)
        ON CONFLICT (experiment_id, landing_page_id) DO UPDATE
        SET traffic_percent = EXCLUDED.traffic_percent,
            updated_at = NOW()
      `,
      [experimentId, input.landingPageId, Math.min(100, Math.max(0, input.trafficPercent ?? 100))]
    );
  }
  return experimentId;
}

export async function saveConversionGoal(input: {
  key: string;
  label: string;
  targetType: string;
  isActive?: boolean;
}) {
  const result = await query<{ id: string }>(
    `
      INSERT INTO conversion_goals (key, label, target_type, is_active)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (key) DO UPDATE
      SET label = EXCLUDED.label,
          target_type = EXCLUDED.target_type,
          is_active = EXCLUDED.is_active,
          updated_at = NOW()
      RETURNING id
    `,
    [input.key, input.label, input.targetType, input.isActive ?? true]
  );
  return result.rows[0]?.id ?? "";
}
