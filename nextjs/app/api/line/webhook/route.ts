import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const event = body.events[0];

  if (event.type === "message" && event.message.type === "text") {
    const text = event.message.text;

    if (text === "แก๊ส" || text === "สถานะ") {
      const { data } = await supabase
        .from("gas_readings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      const gasLevel = data[0]?.gas_level?.toFixed(2) || "0";
      const message = `🔥 ระดับแก๊ส: ${gasLevel}%`;

      // TODO: ส่งกลับ LINE (ใช้ LINE Messaging API)
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: true });
}