import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { pushMessage } from "@/lib/line";
import { alertError } from "@/lib/discord";

export async function POST(req: NextRequest) {
  try {
    const { userId, text } = await req.json();

    if (!userId || !text) {
      return NextResponse.json(
        { success: false, error: "userId and text are required" },
        { status: 400 }
      );
    }

    // Push text message
    await pushMessage(userId, [{ type: "text", text }]);

    // Update user status
    const supabase = createServerClient();
    const now = new Date().toISOString();

    await supabase
      .from("users")
      .update({ last_sent: now, last_status: "Success", updated_at: now })
      .eq("user_id", userId);

    // Log message
    await supabase.from("messages").insert({
      user_id: userId,
      message_type: "text",
      content: text,
      status: "sent",
    });

    return NextResponse.json({
      success: true,
      message: "Text message sent",
      data: { userId, sentAt: now },
      version: "2.0",
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    await alertError("send-message", error.message);

    // Update status to failed
    try {
      const { userId } = await req.clone().json();
      if (userId) {
        const supabase = createServerClient();
        await supabase
          .from("users")
          .update({ last_status: "Failed", updated_at: new Date().toISOString() })
          .eq("user_id", userId);
      }
    } catch {}

    return NextResponse.json(
      { success: false, error: error.message, version: "2.0" },
      { status: 500 }
    );
  }
}
