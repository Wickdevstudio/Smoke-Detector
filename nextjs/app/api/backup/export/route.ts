import { NextRequest, NextResponse } from "next/server";
import { exportToGoogleDrive, checkSupabaseQuota } from "@/lib/gdrive";

export async function POST(req: NextRequest) {
  // 1. ตรวจสอบ quota
  const quota = await checkSupabaseQuota();

  if (!quota.close) {
    return NextResponse.json(
      { message: "Supabase not close to full yet", quota },
      { status: 200 }
    );
  }

  // 2. Export ไป Google Drive
  try {
    const driveUrl = await exportToGoogleDrive();
    return NextResponse.json(
      { ok: true, drive_url: driveUrl, quota },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}