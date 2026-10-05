"use client";
export async function claimDevice() {
  const r = await fetch("/api/session/claim", { method: "POST" });
  return (await r.json()) as { ok: boolean; hasLicense?: boolean; error?: string };
}

export async function signOutDevice() {
  await fetch("/api/session/release", { method: "POST" });
  window.location.href = "/login";
}
