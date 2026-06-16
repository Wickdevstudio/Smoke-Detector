import { supabase } from "./supabase";

const RATE_LIMIT = 100;
const WINDOW_MS = 1000;

export async function checkRateLimit(userId: string): Promise<boolean> {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const { data } = await supabase
    .from("rate_limits")
    .select("count, window_start")
    .eq("user_id", userId)
    .single();

  let count = 0;
  let ws = windowStart;

  if (data && data.window_start >= windowStart) {
    count = data.count;
    ws = data.window_start;
  }

  if (count >= RATE_LIMIT) return false;

  count += 1;

  await supabase.from("rate_limits").upsert({
    user_id: userId,
    count: count,
    window_start: ws
  });

  return true;
}