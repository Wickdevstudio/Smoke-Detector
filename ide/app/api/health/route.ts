import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { alertDatabaseDown } from "@/lib/discord";

export async function GET() {
  const startTime = Date.now();
  let status = "healthy";
  let errorMessage = "";

  try {
    const supabase = createServerClient();

    // Ping database with a simple query
    const { error } = await supabase
      .from("health_checks")
      .select("id", { count: "exact", head: true });

    if (error) {
      status = "unhealthy";
      errorMessage = error.message;
    }
  } catch (err: any) {
    status = "unhealthy";
    errorMessage = err.message;
  }

  const responseTime = Date.now() - startTime;

  // Log the health check
  try {
    const supabase = createServerClient();
    await supabase.from("health_checks").insert({
      status,
      response_time_ms: responseTime,
      error_message: errorMessage || null,
    });
  } catch {
    // If we can't even log, database is definitely down
    status = "unhealthy";
  }

  // Alert on failure
  if (status === "unhealthy") {
    await alertDatabaseDown(responseTime, errorMessage);
  }

  return NextResponse.json({
    success: status === "healthy",
    status,
    responseTimeMs: responseTime,
    error: errorMessage || undefined,
    checkedAt: new Date().toISOString(),
    version: "2.0",
  });
}
