import { NextResponse } from "next/server";
import { exportToGoogleDrive, checkQuota } from "@/lib/gdrive";

export async function POST() {
  try {
    const quota = await checkQuota();

    if (!quota.close) {
      return NextResponse.json({
        success: true,
        message: "Quota is fine, no backup needed",
        data: quota,
        version: "2.0",
      });
    }

    const result = await exportToGoogleDrive();

    return NextResponse.json({
      success: true,
      message: "Backup completed",
      data: result,
      version: "2.0",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, version: "2.0" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const quota = await checkQuota();
    return NextResponse.json({
      success: true,
      data: quota,
      version: "2.0",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, version: "2.0" },
      { status: 500 }
    );
  }
}
