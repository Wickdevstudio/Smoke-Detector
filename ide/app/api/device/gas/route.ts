import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { alertGasHigh, alertError } from "@/lib/discord";
import { autoBackupIfNeeded } from "@/lib/gdrive";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawValue, gasLevel, doValue, deviceName } = body;

    if (rawValue === undefined || gasLevel === undefined) {
      return NextResponse.json(
        { success: false, error: "rawValue and gasLevel are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase
      .from("gas_readings")
      .insert({
        raw_value: Number(rawValue),
        gas_level: Number(gasLevel),
        do_value: doValue ?? 0,
        device_name: deviceName || "unknown",
        user_id: "device-001",
        timestamp: Date.now(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Supabase insert error: ${error.message}`);
    }

    // Check for high gas → alert
    if (Number(gasLevel) > 50 || doValue === 1) {
      await alertGasHigh(Number(gasLevel), deviceName || "unknown");
    }

    // Auto backup check
    try {
      await autoBackupIfNeeded();
    } catch (backupErr: any) {
      console.error("Auto backup failed:", backupErr);
    }

    return NextResponse.json({
      success: true,
      data: { id: data.id },
      version: "2.0",
    });
  } catch (error: any) {
    console.error("Gas data error:", error);
    await alertError("device/gas", error.message);
    return NextResponse.json(
      { success: false, error: error.message, version: "2.0" },
      { status: 500 }
    );
  }
}
