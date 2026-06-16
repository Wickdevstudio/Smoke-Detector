"use client";

import { useEffect, useState } from "react";
import { supabase, subscribeGasReadings } from "@/lib/realtime";

export default function Dashboard() {
  const [readings, setReadings] = useState<any[]>([]);

  useEffect(() => {
    const channel = subscribeGasReadings((newData: any) => {
      setReadings(prev => [newData, ...prev.slice(0, 49)]);
    });

    fetchReadings();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchReadings() {
    const { data } = await supabase
      .from("gas_readings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setReadings(data);
  }

  return (
    <div style={{ maxWidth: 700, margin: "40px auto" }}>
      <h2>🔥 Gas Monitor (Realtime)</h2>
      
      {readings.length === 0 ? (
        <p>No readings yet.</p>
      ) : (
        <div style={{ display: "grid", gap: 10 }}>
          {readings.map((r) => (
            <div
              key={r.id}
              style={{
                padding: 12,
                background: r.gas_level > 70 ? "#ffcccc" : "#f5f5f5",
                borderRadius: 6
              }}
            >
              <strong>Device:</strong> {r.device_name} <br />
              <strong>Gas:</strong> {r.gas_level.toFixed(2)}% <br />
              <strong>AO:</strong> {r.raw_value} <br />
              <strong>DO:</strong> {r.do_value === 1 ? "⚠️ HIGH" : "OK"} <br />
              <strong>Time:</strong> {new Date(r.created_at).toLocaleString()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}