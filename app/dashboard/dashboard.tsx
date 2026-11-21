"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";

type ProfileResponse = { data: { user: { id: string; name: string; email: string; image: string | null }; profile: { id: string; displayName: string | null; timezone: string } } };
type Gateway = { id: string; name: string; status: string; lastSeenAt: string | null; permission: string };
type ApiError = { error?: { message?: string } };
type Enrollment = { gatewayId: string; enrollmentId: string; code: string; expiresAt: string };

const panelStyle = { border: "1px solid #30372d", borderRadius: 14, background: "#151914", padding: 22 } as const;
const fieldStyle = { width: "100%", padding: "11px 12px", marginTop: 6, color: "#f2f3ee", border: "1px solid #3b4336", borderRadius: 7, background: "#10130f" } as const;

export default function Dashboard() {
  const [profile, setProfile] = useState<ProfileResponse["data"] | null>(null);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [gatewayName, setGatewayName] = useState("");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [profileResponse, gatewayResponse] = await Promise.all([fetch("/api/v1/profile", { cache: "no-store" }), fetch("/api/v1/gateways", { cache: "no-store" })]);
      if (profileResponse.status === 401 || gatewayResponse.status === 401) { window.location.assign("/login?next=%2Fdashboard"); return; }
      const profileBody = await profileResponse.json() as ProfileResponse & ApiError;
      const gatewayBody = await gatewayResponse.json() as { data: Gateway[] } & ApiError;
      if (!profileResponse.ok) throw new Error(profileBody.error?.message || "Could not load your profile.");
      if (!gatewayResponse.ok) throw new Error(gatewayBody.error?.message || "Could not load gateways.");
      setProfile(profileBody.data); setDisplayName(profileBody.data.profile.displayName || profileBody.data.user.name);
      setTimezone(profileBody.data.profile.timezone || "UTC"); setGateways(gatewayBody.data);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to connect to the RIG backend."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void loadData(); }, [loadData]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/v1/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName, timezone }) });
      const body = await response.json() as { data?: { displayName: string; timezone: string } } & ApiError;
      if (!response.ok) throw new Error(body.error?.message || "Could not save your profile.");
      setProfile((current) => current ? { ...current, profile: { ...current.profile, displayName: body.data!.displayName, timezone: body.data!.timezone } } : current); setNotice("Profile saved.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to save your profile."); }
    finally { setSaving(false); }
  }

  async function createEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setEnrolling(true); setError(""); setNotice(""); setEnrollment(null);
    try {
      const response = await fetch("/api/v1/gateways/enroll", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: gatewayName }) });
      const body = await response.json() as { data?: Enrollment } & ApiError;
      if (!response.ok) throw new Error(body.error?.message || "Could not create gateway enrollment.");
      setEnrollment(body.data!); setGatewayName(""); setNotice("Save this setup code now; it is shown only once."); await loadData();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to create a gateway setup code."); }
    finally { setEnrolling(false); }
  }

  async function revokeEnrollment() {
    if (!enrollment || !window.confirm("Revoke this setup code? This cannot be undone.")) return;
    try {
      const response = await fetch(`/api/v1/gateways/${enrollment.gatewayId}/enrollments/${enrollment.enrollmentId}`, { method: "DELETE" });
      const body = await response.json() as ApiError;
      if (!response.ok) throw new Error(body.error?.message || "Could not revoke setup code.");
      setEnrollment(null); setNotice("Setup code revoked.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to revoke setup code."); }
  }

  async function renameGateway(gateway: Gateway) {
    const name = window.prompt("Gateway name", gateway.name);
    if (name === null || name.trim() === gateway.name) return;
    try {
      const response = await fetch(`/api/v1/gateways/${gateway.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const body = await response.json() as ApiError;
      if (!response.ok) throw new Error(body.error?.message || "Could not update gateway.");
      setNotice("Gateway updated."); await loadData();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to update gateway."); }
  }

  async function removeGateway(gateway: Gateway) {
    if (!window.confirm(`Permanently remove ${gateway.name} and its enrollment records?`)) return;
    try {
      const response = await fetch(`/api/v1/gateways/${gateway.id}`, { method: "DELETE" });
      const body = await response.json() as ApiError;
      if (!response.ok) throw new Error(body.error?.message || "Could not remove gateway.");
      setNotice("Gateway removed."); await loadData();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to remove gateway."); }
  }

  return <main style={{ minHeight: "100vh", padding: "32px 18px 70px", color: "#f2f3ee", background: "#0c0e0d" }}><div style={{ width: "min(100%, 900px)", margin: "0 auto" }}>
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 36 }}><Link href="/" style={{ color: "#eef3e7", textDecoration: "none", fontSize: 20, fontWeight: 700 }}>rig<span style={{ color: "#a9cb71" }}>.</span></Link><button onClick={() => void loadData()} disabled={loading} style={{ color: "#dce7cf", border: "1px solid #394333", borderRadius: 7, background: "#1b2118", padding: "9px 13px", cursor: "pointer" }}>{loading ? "Refreshing…" : "Refresh data"}</button></header>
    <p style={{ color: "#a9cb71", fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase" }}>Account dashboard</p><h1 style={{ margin: "7px 0", fontSize: "clamp(28px, 5vw, 42px)", letterSpacing: -1.5 }}>Your RIG, in one place.</h1><p style={{ color: "#a4aa9e", marginBottom: 26 }}>{profile ? `Signed in as ${profile.user.email}` : "Loading your secure account…"}</p>
    {error && <p role="alert" style={{ ...panelStyle, color: "#ffc2b2", borderColor: "#77483d" }}>{error}</p>}{notice && <p role="status" style={{ color: "#b6d887" }}>{notice}</p>}
    <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))" }}>
      <section style={panelStyle}><h2 style={{ marginTop: 0, fontSize: 17 }}>Profile preferences</h2><p style={{ color: "#9ba294", fontSize: 13 }}>Saved securely to your account.</p><form onSubmit={saveProfile} style={{ display: "grid", gap: 15 }}><label style={{ color: "#d3d8cc", fontSize: 12 }}>Display name<input style={fieldStyle} value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={1} maxLength={80} disabled={loading || saving}/></label><label style={{ color: "#d3d8cc", fontSize: 12 }}>Timezone<input style={fieldStyle} value={timezone} onChange={(event) => setTimezone(event.target.value)} required maxLength={100} placeholder="Europe/London" disabled={loading || saving}/></label><button type="submit" disabled={loading || saving} style={{ padding: 11, color: "#10130f", border: 0, borderRadius: 7, background: "#a9cb71", fontWeight: 700 }}>{saving ? "Saving…" : "Save profile"}</button></form></section>
      <section style={panelStyle}><h2 style={{ marginTop: 0, fontSize: 17 }}>Prepare gateway enrollment</h2><p style={{ color: "#9ba294", fontSize: 13, lineHeight: 1.6 }}>Create a short-lived setup code. Hardware authentication is not yet enabled, so a gateway will remain pending until device identity is implemented.</p><form onSubmit={createEnrollment} style={{ display: "grid", gap: 12 }}><label style={{ color: "#d3d8cc", fontSize: 12 }}>Gateway name<input style={fieldStyle} value={gatewayName} onChange={(event) => setGatewayName(event.target.value)} required minLength={2} maxLength={80} placeholder="Home gateway" disabled={enrolling}/></label><button type="submit" disabled={enrolling} style={{ padding: 11, color: "#10130f", border: 0, borderRadius: 7, background: "#a9cb71", fontWeight: 700 }}>{enrolling ? "Creating…" : "Create setup code"}</button></form>{enrollment && <div style={{ marginTop: 14, padding: 14, borderRadius: 8, background: "#10130f" }}><p style={{ margin: "0 0 8px", color: "#9ba294", fontSize: 12 }}>One-time code · expires {new Date(enrollment.expiresAt).toLocaleTimeString()}</p><strong style={{ display: "block", textAlign: "center", fontFamily: "monospace", letterSpacing: 2, fontSize: 18 }}>{enrollment.code}</strong><button type="button" onClick={() => void revokeEnrollment()} style={{ marginTop: 12, color: "#ffc2b2", border: "1px solid #77483d", borderRadius: 6, background: "transparent", padding: "7px 10px", cursor: "pointer" }}>Revoke code</button></div>}</section>
      <section style={panelStyle}><h2 style={{ marginTop: 0, fontSize: 17 }}>Your gateways</h2><p style={{ color: "#9ba294", fontSize: 13 }}>Only gateway owners can rename or remove a gateway.</p>{loading ? <p style={{ color: "#9ba294" }}>Loading gateways…</p> : gateways.length === 0 ? <p style={{ color: "#9ba294" }}>No gateways linked yet.</p> : <ul style={{ display: "grid", gap: 10, padding: 0, listStyle: "none" }}>{gateways.map((gateway) => <li key={gateway.id} style={{ padding: 13, borderRadius: 9, background: "#10130f" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}><div><strong>{gateway.name}</strong><p style={{ margin: "6px 0 0", color: "#9ba294", fontSize: 12 }}>{gateway.status} · {gateway.permission}{gateway.lastSeenAt ? ` · Last seen ${new Date(gateway.lastSeenAt).toLocaleString()}` : ""}</p></div>{gateway.permission === "owner" && <div style={{ display: "flex", gap: 7 }}><button type="button" onClick={() => void renameGateway(gateway)} style={{ color: "#dce7cf", border: "1px solid #394333", borderRadius: 6, background: "transparent", padding: "5px 8px", cursor: "pointer" }}>Rename</button><button type="button" onClick={() => void removeGateway(gateway)} style={{ color: "#ffc2b2", border: "1px solid #77483d", borderRadius: 6, background: "transparent", padding: "5px 8px", cursor: "pointer" }}>Remove</button></div>}</div></li>)}</ul>}</section>
    </div>
    <section style={{ ...panelStyle, marginTop: 16 }}><h2 style={{ marginTop: 0, fontSize: 17 }}>VPN connectivity</h2><p style={{ color: "#9ba294", fontSize: 13, lineHeight: 1.7 }}>VPN tunneling remains intentionally deferred. Setup codes do not authenticate gateway hardware and do not activate a gateway.</p></section><p style={{ marginTop: 22, color: "#71786d", fontSize: 10 }}>RIG DEVELOPMENT PREVIEW · Setup codes expire after 15 minutes.</p>
  </div></main>;
}
