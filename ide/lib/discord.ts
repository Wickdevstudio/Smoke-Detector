// ============================================
// Discord Webhook Helper
// ============================================

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  fields?: { name: string; value: string; inline?: boolean }[];
  timestamp?: string;
}

export async function sendDiscordAlert(
  content: string,
  embed?: DiscordEmbed
) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) {
    console.warn("[Discord] No webhook URL configured, skipping alert");
    return;
  }

  const body: any = {};

  if (embed) {
    body.embeds = [
      {
        ...embed,
        timestamp: embed.timestamp || new Date().toISOString(),
      },
    ];
  } else {
    body.content = content;
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`[Discord] Webhook failed: ${res.status}`);
    }
  } catch (err) {
    console.error("[Discord] Webhook error:", err);
  }
}

// ---------- Preset Alerts ----------

export async function alertNewUser(name: string, userId: string) {
  await sendDiscordAlert("", {
    title: "👋 New LINE User",
    description: `**${name}** has been added to the system`,
    color: 0x10b981, // emerald
    fields: [
      { name: "User ID", value: `\`${userId}\``, inline: true },
      { name: "Time", value: new Date().toLocaleString("th-TH"), inline: true },
    ],
  });
}

export async function alertError(source: string, message: string) {
  await sendDiscordAlert("", {
    title: "🚨 Error",
    description: message,
    color: 0xf43f5e, // rose
    fields: [
      { name: "Source", value: source, inline: true },
      { name: "Time", value: new Date().toLocaleString("th-TH"), inline: true },
    ],
  });
}

export async function alertDatabaseDown(responseTime?: number, error?: string) {
  await sendDiscordAlert("", {
    title: "🔴 Database DOWN",
    description: "Supabase health check failed!",
    color: 0xf43f5e,
    fields: [
      { name: "Response Time", value: responseTime ? `${responseTime}ms` : "N/A", inline: true },
      { name: "Error", value: error || "Unknown", inline: false },
      { name: "Time", value: new Date().toLocaleString("th-TH"), inline: true },
    ],
  });
}

export async function alertGasHigh(gasLevel: number, deviceName: string) {
  await sendDiscordAlert("", {
    title: "🔥 High Gas Level Detected",
    description: `Gas level **${gasLevel.toFixed(1)}%** detected on device **${deviceName}**`,
    color: 0xf59e0b, // amber
    fields: [
      { name: "Gas Level", value: `${gasLevel.toFixed(2)}%`, inline: true },
      { name: "Device", value: deviceName, inline: true },
      { name: "Time", value: new Date().toLocaleString("th-TH"), inline: true },
    ],
  });
}
