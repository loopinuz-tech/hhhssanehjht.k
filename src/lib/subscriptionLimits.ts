import { supabase } from "@/integrations/supabase/client";

export interface FeatureLimitResult {
  allowed: boolean;
  tier: "standart" | "premium" | "pro";
  feature: string;
  current_count: number;
  max_limit: number;
  remaining: number;
}

export const checkFeatureLimit = async (
  userId: string,
  featureName: "ai_chat" | "essay_checker" | "test_attempt" | "vision_ai" | "course_create"
): Promise<FeatureLimitResult> => {
  if (!userId) {
    return {
      allowed: false,
      tier: "standart",
      feature: featureName,
      current_count: 0,
      max_limit: 0,
      remaining: 0,
    };
  }

  try {
    const { data, error } = await (supabase as any).rpc("check_user_daily_feature_limit", {
      uid: userId,
      p_feature: featureName,
    });

    if (error || !data) {
      // Fallback in case RPC is not yet executed in Supabase
      return checkFallbackLimit(userId, featureName);
    }

    return data as FeatureLimitResult;
  } catch (err) {
    console.warn("RPC check_user_daily_feature_limit error, using fallback:", err);
    return checkFallbackLimit(userId, featureName);
  }
};

export const incrementFeatureUsage = async (
  userId: string,
  featureName: "ai_chat" | "essay_checker" | "test_attempt" | "vision_ai" | "course_create"
): Promise<FeatureLimitResult> => {
  if (!userId) {
    return {
      allowed: false,
      tier: "standart",
      feature: featureName,
      current_count: 0,
      max_limit: 0,
      remaining: 0,
    };
  }

  try {
    const { data, error } = await (supabase as any).rpc("increment_user_feature_usage", {
      uid: userId,
      p_feature: featureName,
    });

    if (error || !data) {
      return recordFallbackUsage(userId, featureName);
    }

    return data as FeatureLimitResult;
  } catch (err) {
    console.warn("RPC increment_user_feature_usage error, using fallback:", err);
    return recordFallbackUsage(userId, featureName);
  }
};

// Client-side fallback tracking in case RPCs are pending execution
async function checkFallbackLimit(userId: string, feature: string): Promise<FeatureLimitResult> {
  const { data: profile } = await supabase.from("profiles").select("subscription_tier, is_lifetime, subscription_expires_at").eq("user_id", userId).maybeSingle();
  const tier = (profile as any)?.subscription_tier || "standart";
  const isPremium = tier === "premium" || tier === "pro" || !!(profile as any)?.is_lifetime;

  if (isPremium) {
    return { allowed: true, tier, feature, current_count: 0, max_limit: -1, remaining: -1 };
  }

  const { data: usage } = await (supabase as any)
    .from("user_daily_usage")
    .select("usage_count")
    .eq("user_id", userId)
    .eq("feature_name", feature)
    .eq("usage_date", new Date().toISOString().split("T")[0])
    .maybeSingle();

  const count = usage?.usage_count || 0;
  const limits: Record<string, number> = {
    ai_chat: 10,
    essay_checker: 3,
    test_attempt: 5,
    vision_ai: 0,
    course_create: 1,
  };
  const max = limits[feature] ?? 10;
  const allowed = max === -1 || (max > 0 && count < max);

  return {
    allowed,
    tier: "standart",
    feature,
    current_count: count,
    max_limit: max,
    remaining: Math.max(0, max - count),
  };
}

async function recordFallbackUsage(userId: string, feature: string): Promise<FeatureLimitResult> {
  const today = new Date().toISOString().split("T")[0];
  try {
    const { data: existing } = await (supabase as any)
      .from("user_daily_usage")
      .select("id, usage_count")
      .eq("user_id", userId)
      .eq("feature_name", feature)
      .eq("usage_date", today)
      .maybeSingle();

    if (existing) {
      await (supabase as any)
        .from("user_daily_usage")
        .update({ usage_count: (existing.usage_count || 0) + 1, updated_at: new Date().toISOString() })
        .eq("id", existing.id);
    } else {
      await (supabase as any)
        .from("user_daily_usage")
        .insert({ user_id: userId, feature_name: feature, usage_date: today, usage_count: 1 });
    }
  } catch (e) {
    console.warn("Fallback usage insert error:", e);
  }

  return checkFallbackLimit(userId, feature);
}
