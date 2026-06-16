// ============================================
// LINE Messaging API Helpers
// ============================================

const LINE_API_BASE = "https://api.line.me/v2/bot";

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
  };
}

// ---------- Profile ----------

export async function getLineProfile(userId: string) {
  const res = await fetch(`${LINE_API_BASE}/profile/${userId}`, {
    headers: getHeaders(),
  });
  if (!res.ok) {
    throw new Error(`LINE profile error: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<{
    userId: string;
    displayName: string;
    pictureUrl?: string;
    statusMessage?: string;
  }>;
}

// ---------- Reply ----------

export async function replyMessage(replyToken: string, messages: any[]) {
  const res = await fetch(`${LINE_API_BASE}/message/reply`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ replyToken, messages }),
  });
  if (!res.ok) {
    throw new Error(`LINE reply error: ${res.status} ${await res.text()}`);
  }
}

// ---------- Push ----------

export async function pushMessage(userId: string, messages: any[]) {
  const res = await fetch(`${LINE_API_BASE}/message/push`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ to: userId, messages }),
  });
  if (!res.ok) {
    throw new Error(`LINE push error: ${res.status} ${await res.text()}`);
  }
}

// ---------- Signature Validation ----------

export async function validateSignature(
  body: string,
  signature: string
): Promise<boolean> {
  const secret = process.env.LINE_CHANNEL_SECRET!;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const hash = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return hash === signature;
}

// ---------- Flex Message Builders ----------

export function buildWelcomeFlex(name: string, pictureUrl?: string) {
  return {
    type: "flex" as const,
    altText: `Welcome, ${name}!`,
    contents: {
      type: "bubble",
      hero: {
        type: "image",
        url: pictureUrl || "https://via.placeholder.com/1024x680/1a1040/3b82f6?text=Welcome",
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: `Welcome, ${name}! 🎉`,
            weight: "bold",
            size: "xl",
            color: "#1a1040",
          },
          {
            type: "text",
            text: "คุณได้ถูกเพิ่มเข้าระบบ Smoke Detector แล้ว\nจะแจ้งเตือนเมื่อตรวจพบแก๊สเกินค่ามาตรฐาน",
            wrap: true,
            color: "#666666",
            size: "sm",
          },
          {
            type: "separator",
            margin: "lg",
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "lg",
            contents: [
              { type: "text", text: "Status", size: "sm", color: "#aaaaaa", flex: 1 },
              { type: "text", text: "✅ Active", size: "sm", color: "#10b981", align: "end", flex: 2 },
            ],
          },
        ],
      },
    },
  };
}

export function buildGasAlertFlex(gasLevel: number, deviceName: string) {
  const isHigh = gasLevel > 70;
  return {
    type: "flex" as const,
    altText: `⚠️ Gas Alert: ${gasLevel.toFixed(1)}%`,
    contents: {
      type: "bubble",
      styles: {
        header: { backgroundColor: isHigh ? "#f43f5e" : "#f59e0b" },
      },
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: isHigh ? "🚨 DANGER" : "⚠️ WARNING",
            color: "#ffffff",
            weight: "bold",
            size: "lg",
          },
        ],
        paddingAll: "16px",
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: `Gas Level: ${gasLevel.toFixed(1)}%`,
            weight: "bold",
            size: "xl",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "Device", size: "sm", color: "#aaaaaa", flex: 1 },
              { type: "text", text: deviceName, size: "sm", align: "end", flex: 2 },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "Time", size: "sm", color: "#aaaaaa", flex: 1 },
              {
                type: "text",
                text: new Date().toLocaleString("th-TH"),
                size: "sm",
                align: "end",
                flex: 2,
              },
            ],
          },
        ],
      },
    },
  };
}

export function buildStatusFlex(gasLevel: number, deviceName: string) {
  return {
    type: "flex" as const,
    altText: `Gas Status: ${gasLevel.toFixed(1)}%`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: "🔥 Gas Monitor Status",
            weight: "bold",
            size: "lg",
          },
          {
            type: "separator",
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "ระดับแก๊ส", size: "sm", color: "#aaaaaa", flex: 1 },
              {
                type: "text",
                text: `${gasLevel.toFixed(2)}%`,
                size: "sm",
                weight: "bold",
                color: gasLevel > 70 ? "#f43f5e" : gasLevel > 40 ? "#f59e0b" : "#10b981",
                align: "end",
                flex: 2,
              },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "อุปกรณ์", size: "sm", color: "#aaaaaa", flex: 1 },
              { type: "text", text: deviceName, size: "sm", align: "end", flex: 2 },
            ],
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              { type: "text", text: "เวลา", size: "sm", color: "#aaaaaa", flex: 1 },
              {
                type: "text",
                text: new Date().toLocaleString("th-TH"),
                size: "sm",
                align: "end",
                flex: 2,
              },
            ],
          },
        ],
      },
    },
  };
}
