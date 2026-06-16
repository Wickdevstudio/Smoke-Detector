import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { pushMessage, buildWelcomeFlex, buildGasAlertFlex } from "@/lib/line";
import { alertError } from "@/lib/discord";

export async function POST(req: NextRequest) {
  try {
    const { userId, flexType, data } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    // Build flex message based on type
    let flexMessage;

    switch (flexType) {
      case "welcome":
        flexMessage = buildWelcomeFlex(
          data?.name || "User",
          data?.pictureUrl
        );
        break;
      case "gas-alert":
        flexMessage = buildGasAlertFlex(
          data?.gasLevel || 0,
          data?.deviceName || "unknown"
        );
        break;
      default:
        // Custom flex — expect full contents in data.contents
        if (!data?.contents) {
          return NextResponse.json(
            { success: false, error: "flexType or data.contents required" },
            { status: 400 }
          );
        }
        flexMessage = {
          type: "flex" as const,
          altText: data.altText || "Flex Message",
          contents: data.contents,
        };
    }

    // Push flex
    await pushMessage(userId, [flexMessage]);

    // Update status
    const supabase = createServerClient();
    const now = new Date().toISOString();

    await supabase
      .from("users")
      .update({ last_sent: now, last_status: "Success", updated_at: now })
      .eq("user_id", userId);

    await supabase.from("messages").insert({
      user_id: userId,
      message_type: "flex",
      content: JSON.stringify({ flexType, data }),
      status: "sent",
    });

    return NextResponse.json({
      success: true,
      message: "Flex message sent",
      data: { userId, flexType, sentAt: now },
      version: "2.0",
    });
  } catch (error: any) {
    console.error("Send flex error:", error);
    await alertError("send-flex", error.message);

    return NextResponse.json(
      { success: false, error: error.message, version: "2.0" },
      { status: 500 }
    );
  }
}
