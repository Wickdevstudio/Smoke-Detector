// ============================================
// Google Drive Export Helper
// ============================================

import { createServerClient } from "./supabase-server";

export async function checkQuota() {
  const supabase = createServerClient();
  const { count } = await supabase
    .from("gas_readings")
    .select("*", { count: "exact", head: true });

  const used = count || 0;
  const total = 10000;
  const close = used >= total * 0.9;

  return { close, used, total, percent: Math.round((used / total) * 100) };
}

export async function exportToGoogleDrive() {
  const supabase = createServerClient();

  // 1. Fetch all data
  const { data, error } = await supabase
    .from("gas_readings")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Supabase fetch error: ${error.message}`);
  if (!data || data.length === 0) throw new Error("No data to export");

  // 2. Create JSON
  const jsonStr = JSON.stringify(data, null, 2);
  const fileName = `gas_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;

  // 3. Upload to Google Drive (multipart)
  const boundary = "----FormBoundary" + Date.now();
  const metadata = JSON.stringify({
    name: fileName,
    parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    mimeType: "application/json",
  });

  const multipartBody =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${jsonStr}\r\n` +
    `--${boundary}--`;

  const uploadRes = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GOOGLE_API_KEY}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!uploadRes.ok) {
    throw new Error(`Google Drive upload failed: ${uploadRes.status} ${await uploadRes.text()}`);
  }

  const driveData = await uploadRes.json();
  const driveUrl = `https://drive.google.com/file/d/${driveData.id}`;

  // 4. Delete old data from Supabase
  const ids = data.map((d: any) => d.id);
  await supabase.from("gas_readings").delete().in("id", ids);

  // 5. Log backup
  await supabase.from("backup_logs").insert({
    drive_url: driveUrl,
    file_name: fileName,
    record_count: data.length,
    file_size: jsonStr.length,
  });

  return { driveUrl, fileName, recordCount: data.length };
}

export async function autoBackupIfNeeded() {
  const quota = await checkQuota();
  if (quota.close) {
    console.log("⚠️ Supabase near full, starting backup...");
    return exportToGoogleDrive();
  }
  return null;
}
