import { supabase } from "./supabase";

// Google Drive API (ต้องตั้งค่าก่อน)
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;
const GOOGLE_DRIVE_FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID!;

// ตรวจสอบ quota Supabase
export async function checkSupabaseQuota(): Promise<{ close: boolean, used: number, total: number }> {
  const { data } = await supabase
    .from("gas_readings")
    .select("*");

  const used = data?.length || 0;
  const total = 10000; // 10,000 records (ตั้งค่าตามต้องการ)
  const close = used >= total * 0.9; // 90% = ใกล้เต็ม

  return { close, used, total };
}

// Export ข้อมูลไป Google Drive
export async function exportToGoogleDrive(): Promise<string> {
  // 1. ดึงข้อมูลทั้งหมด
  const { data } = await supabase
    .from("gas_readings")
    .select("*");

  if (!data || data.length === 0) {
    throw new Error("No data to export");
  }

  // 2. สร้าง JSON file
  const jsonStr = JSON.stringify(data, null, 2);
  const fileName = `gas_backup_${new Date().toISOString()}.json`;

  // 3. อัปโหลด Google Drive
  const response = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOOGLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: fileName,
        parents: [GOOGLE_DRIVE_FOLDER_ID]
      })
    }
  );

  if (!response.ok) {
    throw new Error("Google Drive upload failed");
  }

  const driveData = await response.json();
  const driveUrl = driveData.id;

  // 4. ลบข้อมูลเก่าจาก Supabase
  await supabase
    .from("gas_readings")
    .delete()
    .in("id", data.map((d: any) => d.id));

  // 5. เก็บลิงก์ Google Drive กลับไป Supabase
  await supabase.from("backup_logs").insert({
    drive_url: driveUrl,
    file_size: jsonStr.length
  });

  console.log("✓ Exported to Google Drive:", driveUrl);
  return driveUrl;
}

// ตรวจสอบและย้ายข้อมูลอัตโนมัติ
export async function autoBackupIfNeeded(): Promise<void> {
  const quota = await checkSupabaseQuota();

  if (quota.close) {
    console.log("⚠️ Supabase close to full, exporting to Google Drive...");
    await exportToGoogleDrive();
  }
}