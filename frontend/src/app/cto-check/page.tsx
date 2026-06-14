"use client";

export default function CTOCheck() {
  const now = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
  return (
    <div style={{ padding: "50px", fontFamily: "sans-serif" }}>
      <h1>CTO Deployment Check</h1>
      <p>Status: ACTIVE</p>
      <p>Version: v0.2.0</p>
      <p>Timestamp: {now} KST</p>
    </div>
  );
}
