import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const supabase = createServerClient();

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Compute stats
    const total = users?.length || 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newToday = users?.filter(
      (u) => new Date(u.created_at) >= today
    ).length || 0;

    const active = users?.filter(
      (u) => u.last_status !== "UNFOLLOWED" && u.last_status !== "Failed"
    ).length || 0;

    const failed = users?.filter(
      (u) => u.last_status === "Failed"
    ).length || 0;

    return NextResponse.json({
      success: true,
      data: users || [],
      stats: { total, newToday, active, failed },
      version: "2.0",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, version: "2.0" },
      { status: 500 }
    );
  }
}
