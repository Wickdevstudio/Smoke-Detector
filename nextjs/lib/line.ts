import { supabase } from "./supabase";

// LINE Bot (ต้องตั้งค่าก่อน)
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN!;
const LINE_CHANNEL_SECRET = process.env.LINE_CHANNEL_SECRET!;

// Google Sheets (ต้องตั้งค่าก่อน)
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID!;
const GOOGLE_SHEET_API_KEY = process.env.GOOGLE_SHEET_API_KEY!;

// ส่งข้อความไป LINE (Webhook)
export async function sendLINEMessage(replyToken: string, text: string): Promise<void> {
  const response = await fetch(
    "https://api.line.me/v2/bot/message/reply",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text }]
      })
    }
  );

  if (!response.ok) {
    throw new Error("LINE message send failed");
  }

  console.log("✓ LINE message sent:", text);
}

// เก็บ UserID ลง Google Sheets
export async function saveLINEUserIDToSheet(userId: string, displayName: string): Promise<void> {
  const timestamp = new Date().toISOString();

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${GOOGLE_SHEET_ID}/values/Sheet1!A3:C1000`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GOOGLE_SHEET_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        values: [[userId, displayName, timestamp]]
      })
    }
  );

  if (!response.ok) {
    throw new Error("Google Sheets save failed");
  }

  console.log("✓ LINE UserID saved to Sheets:", userId);
}

// ส่ง Logincip Erfolgsเ
export async function sendBackupLogToLINE(driveUrl: string, quota: any): Promise<void> {
  const text = `✅ Backup completed!\n\n📊 Quota: ${quota.used}/${quota.total} (${Math.round(quota.used/quota.total*100)}%)\\n📁 Google Drive: ${driveUrl}`;

  // ส่งไป LINE (ต้อง punya replyToken หรือใช้ broadcast)
  // await sendLINEMessage(replyToken, text);

  console.log("✓ Backup log sent to LINE:", text);
}