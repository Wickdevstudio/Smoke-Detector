import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import {
  validateSignature,
  getLineProfile,
  replyMessage,
  buildWelcomeFlex,
  buildStatusFlex,
} from "@/lib/line";
import { alertNewUser, alertError } from "@/lib/discord";

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get("x-line-signature") || "";

    // Validate LINE signature
    const valid = await validateSignature(body, signature);
    if (!valid) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const events = payload.events || [];
    const supabase = createServerClient();

    for (const event of events) {
      // ----- Follow Event (Add Friend) -----
      if (event.type === "follow") {
        const userId = event.source.userId;

        try {
          const profile = await getLineProfile(userId);

          // Save to Supabase
          await supabase.from("users").upsert(
            {
              user_id: userId,
              display_name: profile.displayName || "Unknown",
              picture_url: profile.pictureUrl || "",
              last_status: "NEW",
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );

          // Discord alert
          await alertNewUser(profile.displayName, userId);

          // Reply with welcome Flex
          if (event.replyToken) {
            await replyMessage(event.replyToken, [
              buildWelcomeFlex(profile.displayName, profile.pictureUrl),
            ]);
          }
        } catch (err: any) {
          console.error("Follow event error:", err);
          await alertError("webhook/follow", err.message);
        }
      }

      // ----- Unfollow Event -----
      if (event.type === "unfollow") {
        const userId = event.source.userId;
        await supabase
          .from("users")
          .update({ last_status: "UNFOLLOWED", updated_at: new Date().toISOString() })
          .eq("user_id", userId);
      }

      // ----- Message Event -----
      if (event.type === "message" && event.message.type === "text") {
        const text = event.message.text.trim().toLowerCase();

        if (text === "แก๊ส" || text === "สถานะ" || text === "status" || text === "gas") {
          // Fetch latest reading
          const { data } = await supabase
            .from("gas_readings")
            .select("gas_level, device_name, created_at")
            .order("created_at", { ascending: false })
            .limit(1);

          const reading = data?.[0];
          const gasLevel = reading?.gas_level ?? 0;
          const deviceName = reading?.device_name ?? "unknown";

          if (event.replyToken) {
            await replyMessage(event.replyToken, [
              buildStatusFlex(gasLevel, deviceName),
            ]);
          }
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    await alertError("webhook", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// LINE webhook verification (GET)
export async function GET() {
  return NextResponse.json({ status: "LINE webhook is active" });
}
