import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { checkRateLimit } from "@/lib/rateLimit";
import { autoBackupIfNeeded } from "@/lib/gdrive";

export async function POST(req: NextRequest) {
  const userId = "device-001";

  const allowed = await checkRateLimit(userId);
  if (!allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Max 100 req/s." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { rawValue, gasLevel, doValue, deviceName } = body;

  if (!rawValue || !gasLevel) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("gas_readings")
    .insert({
      raw_value: Number(rawValue),
      gas_level: Number(gasLevel),
      do_value: doValue || 0,
      device_name: deviceName || "unknown",
      user_id: userId,
      timestamp: Date.now()
    })
    .select();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // ตรวจสอบและย้ายข้อมูลอัตโนมัติ (ถ้าใกล้เต็ม)
  await autoBackupIfNeeded();

  // ถ้าแก๊สสูง → แจ้งเตือน LINE
  if (doValue === 1) {
    // TODO: ส่ง LINE alert
  }

  return NextResponse.json({ ok: true, id: data[0].id }, { status: 200 });
}