"use client";

import { FormEvent, useEffect, useState } from "react";

type ConnectionState = "disconnected" | "connecting" | "connected";
type View = "overview" | "devices" | "settings";
type IconName = "grid" | "router" | "settings" | "plus" | "power" | "shield" | "arrow" | "wifi" | "globe" | "clock" | "download" | "upload" | "check" | "close" | "lock";

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true as const };
  const paths: Record<IconName, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    router: <><rect x="3" y="9" width="18" height="11" rx="2"/><path d="M7 9V5m10 4V5M8 14h.01M12 14h.01M16 14h.01M8 17h8"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1a1.7 1.7 0 1 1-2.4 2.4l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.3a1.7 1.7 0 1 1-3.4 0v-.2a1.7 1.7 0 0 0-2.9-1.2l-.1.1a1.7 1.7 0 1 1-2.4-2.4l.1-.1a1.7 1.7 0 0 0-1.2-2.9h-.3a1.7 1.7 0 1 1 0-3.4h.2a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a1.7 1.7 0 1 1 2.4-2.4l.1.1a1.7 1.7 0 0 0 2.9-1.2v-.3a1.7 1.7 0 1 1 3.4 0v.2a1.7 1.7 0 0 0 2.9 1.2l.1-.1a1.7 1.7 0 1 1 2.4 2.4l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.3a1.7 1.7 0 1 1 0 3.4h-.2a1.7 1.7 0 0 0-1.2 2.9Z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    power: <><path d="M12 2v10"/><path d="M5.5 5.5a9 9 0 1 0 13 0"/></>,
    shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/></>,
    arrow: <><path d="M7 17 17 7M7 7h10v10"/></>,
    wifi: <><path d="M5 12.5a10 10 0 0 1 14 0M8 15.5a6 6 0 0 1 8 0M11 18.5a2 2 0 0 1 2 0"/><path d="M12 21h.01"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5M12 15V3"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5M12 3v12"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    close: <><path d="m18 6-12 12M6 6l12 12"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const navigation: { id: View; label: string; icon: IconName }[] = [
  { id: "overview", label: "Overview", icon: "grid" },
  { id: "devices", label: "My gateways", icon: "router" },
  { id: "settings", label: "Preferences", icon: "settings" },
];

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [connection, setConnection] = useState<ConnectionState>("disconnected");
  const [routeMode, setRouteMode] = useState<"full" | "local">("full");
  const [connectedAt, setConnectedAt] = useState<number | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [showPairing, setShowPairing] = useState(false);
  const [pairingCode, setPairingCode] = useState("");
  const [pairingMessage, setPairingMessage] = useState("");
  const [killSwitch, setKillSwitch] = useState(true);

  useEffect(() => {
    if (connection !== "connected" || connectedAt === null) return;
    const update = () => setSeconds(Math.floor((Date.now() - connectedAt) / 1000));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [connection, connectedAt]);

  const startConnection = () => {
    if (connection === "connecting") return;
    if (connection === "connected") {
      setConnection("disconnected");
      setConnectedAt(null);
      setSeconds(0);
      return;
    }
    setConnection("connecting");
    window.setTimeout(() => {
      const now = Date.now();
      setConnectedAt(now);
      setConnection("connected");
    }, 1100);
  };

  const formatDuration = (value: number) => {
    const hours = Math.floor(value / 3600).toString().padStart(2, "0");
    const minutes = Math.floor((value % 3600) / 60).toString().padStart(2, "0");
    const secs = (value % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${secs}`;
  };

  const handlePair = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pairingCode.trim().length < 4) {
      setPairingMessage("Enter the pairing code shown on your gateway.");
      return;
    }
    setPairingMessage("Demo mode: gateway pairing will be connected when the server is ready.");
  };

  const isConnected = connection === "connected";
  const statusText = connection === "connecting" ? "Connecting securely…" : isConnected ? "Protected connection active" : "Ready when you are";

  return (
    <main className="product-shell">
      <aside className="sidebar">
        <a className="brand" href="#home" onClick={(event) => { event.preventDefault(); setView("overview"); }}>
          <span className="brand-symbol"><Icon name="shield" size={21}/></span>
          <span className="brand-name">waypoint<span>.</span></span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {navigation.map((item) => (
            <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => setView(item.id)}>
              <Icon name={item.icon} size={18}/><span>{item.label}</span>
              {item.id === "devices" && <span className="nav-count">1</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><Icon name="lock" size={17}/></div>
            <p className="help-title">Your connection, private.</p>
            <p className="help-copy">Your gateway is only accessible to your account.</p>
            <button onClick={() => setView("settings")}>Privacy settings <Icon name="arrow" size={14}/></button>
          </div>
          <button className="profile-row" onClick={() => setView("settings")}>
            <span className="avatar">N</span><span className="profile-text"><strong>Nedict</strong><small>Personal plan</small></span><span className="profile-menu">···</span>
          </button>
        </div>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="breadcrumbs">Workspace <span>/</span> <strong>{navigation.find((item) => item.id === view)?.label}</strong></div>
          <div className="topbar-right"><span className="demo-badge"><span/> DEMO MODE</span><button className="help-button" aria-label="Help" onClick={() => setView("settings")}>?</button></div>
        </header>

        {view === "overview" && <div className="content-wrap">
          <div className="page-heading">
            <div><p className="overline">TUESDAY, NOVEMBER 20</p><h1>Your home, wherever you are.</h1><p className="page-subtitle">Connect through your home network with one tap.</p></div>
            <button className="outline-button" onClick={() => setShowPairing(true)}><Icon name="plus" size={16}/> Add gateway</button>
          </div>

          <section className={`connection-card ${isConnected ? "is-connected" : ""}`} aria-label="Connection controls">
            <div className="connection-card-top"><div className="gateway-identity"><span className="gateway-icon"><Icon name="router" size={20}/></span><span><strong>Home gateway</strong><small><span className="online-dot"/> Online · Home</small></span></div><button className="more-button" aria-label="Gateway options" onClick={() => setView("devices")}>···</button></div>
            <div className="connect-content">
              <div className={`connection-orbit ${isConnected ? "orbit-active" : ""} ${connection === "connecting" ? "orbit-loading" : ""}`}>
                <div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/><div className="orbit-center"><Icon name="power" size={29}/></div>
              </div>
              <p className="connection-status"><span className={`status-indicator ${connection}`}/>{statusText}</p>
              <button className={`primary-connect ${isConnected ? "disconnect" : ""}`} onClick={startConnection} disabled={connection === "connecting"}>
                {connection === "connecting" ? <><span className="button-spinner"/> Connecting</> : isConnected ? "Disconnect" : "Connect to home"}
              </button>
              <p className="connection-hint">{isConnected ? `Session duration · ${formatDuration(seconds)}` : "Your traffic will be routed through your home internet."}</p>
            </div>
            <div className="connection-footer"><span><Icon name="shield" size={15}/> WireGuard protected</span><span className="gateway-id">RG-01 <span>·</span> Raspberry Pi</span></div>
          </section>

          <div className="dashboard-grid">
            <section className="panel route-panel">
              <div className="panel-heading"><div><h2>Connection mode</h2><p>Choose what travels through home.</p></div><span className="panel-icon"><Icon name="globe" size={17}/></span></div>
              <div className="mode-options">
                <button className={`mode-option ${routeMode === "full" ? "selected" : ""}`} onClick={() => setRouteMode("full")}><span className="mode-radio"/><span className="mode-copy"><strong>Full internet</strong><small>Browse as if you&apos;re at home</small></span><Icon name="globe" size={18}/></button>
                <button className={`mode-option ${routeMode === "local" ? "selected" : ""}`} onClick={() => setRouteMode("local")}><span className="mode-radio"/><span className="mode-copy"><strong>Home devices only</strong><small>Keep regular browsing local</small></span><Icon name="router" size={18}/></button>
              </div>
              <div className="route-note"><Icon name="lock" size={14}/><span>{routeMode === "full" ? "All device traffic uses your home connection." : "Only traffic to your home network uses the tunnel."}</span></div>
            </section>
            <section className="panel gateway-panel">
              <div className="panel-heading"><div><h2>Gateway health</h2><p>Your home connection at a glance.</p></div><span className="health-badge"><span/> Healthy</span></div>
              <div className="health-stats"><div className="health-stat"><span className="stat-label"><Icon name="wifi" size={15}/> Home network</span><strong>Excellent</strong><small>Wi-Fi signal</small></div><div className="health-stat"><span className="stat-label"><Icon name="clock" size={15}/> Response time</span><strong>24 <em>ms</em></strong><small>Gateway latency</small></div></div>
              <div className="gateway-location"><span className="location-mark"><Icon name="router" size={16}/></span><span><strong>Home</strong><small>Last seen just now</small></span><span className="location-status">Online</span></div>
            </section>
          </div>

          <div className="bottom-grid">
            <section className="panel traffic-panel"><div className="panel-heading"><div><h2>Session traffic</h2><p>{isConnected ? "Live usage this session" : "Usage appears here during a session"}</p></div><span className="period-label">{isConnected ? "LIVE" : "TODAY"}</span></div><div className="traffic-stats"><div><span><Icon name="download" size={15}/> Received</span><strong>{isConnected ? "18.4" : "0"} <small>MB</small></strong></div><div><span><Icon name="upload" size={15}/> Sent</span><strong>{isConnected ? "4.2" : "0"} <small>MB</small></strong></div><div className="traffic-chart" aria-label="Traffic activity chart"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div></div></section>
            <section className="panel security-panel"><div className="panel-heading"><div><h2>Connection safety</h2><p>Protection preferences</p></div><span className="security-icon"><Icon name="shield" size={17}/></span></div><button className="setting-row" onClick={() => setKillSwitch(!killSwitch)}><span className="setting-symbol"><Icon name="lock" size={16}/></span><span className="setting-copy"><strong>Network lock</strong><small>Block traffic if connection drops</small></span><span className={`toggle ${killSwitch ? "on" : ""}`} role="switch" aria-checked={killSwitch} aria-label="Network lock"/></button><div className="security-footnote"><Icon name="check" size={14}/> {killSwitch ? "Network lock is enabled" : "Network lock is disabled"}</div></section>
          </div>
          <p className="prototype-note">Prototype preview · Connection controls are simulated and do not route traffic yet.</p>
        </div>}

        {view === "devices" && <div className="content-wrap secondary-view"><div className="page-heading"><div><p className="overline">YOUR DEVICES</p><h1>My gateways</h1><p className="page-subtitle">Manage the devices that make your home reachable.</p></div><button className="outline-button" onClick={() => setShowPairing(true)}><Icon name="plus" size={16}/> Add gateway</button></div><section className="panel device-detail"><div className="device-large-icon"><Icon name="router" size={26}/></div><div className="device-info"><span className="health-badge"><span/> Online</span><h2>Home gateway</h2><p>Raspberry Pi · RG-01</p><div className="device-meta"><span>Home network</span><span>Added today</span><span>Last seen just now</span></div></div><button className="outline-button" onClick={() => setView("overview")}>View dashboard <Icon name="arrow" size={15}/></button></section><div className="device-tip"><Icon name="shield" size={18}/><span><strong>Only your account can access this gateway.</strong><small>Pairing and device management will be connected to your account when the service backend is available.</small></span></div></div>}

        {view === "settings" && <div className="content-wrap secondary-view"><div className="page-heading"><div><p className="overline">YOUR ACCOUNT</p><h1>Preferences</h1><p className="page-subtitle">Choose how your connection behaves.</p></div></div><section className="panel preferences-panel"><div className="preference-row"><span className="preference-icon"><Icon name="lock" size={18}/></span><span className="preference-copy"><strong>Network lock</strong><small>Block internet traffic if your gateway connection drops.</small></span><button className={`toggle-button ${killSwitch ? "selected" : ""}`} role="switch" aria-checked={killSwitch} onClick={() => setKillSwitch(!killSwitch)}><span/>{killSwitch ? "On" : "Off"}</button></div><div className="preference-row"><span className="preference-icon"><Icon name="globe" size={18}/></span><span className="preference-copy"><strong>Default connection mode</strong><small>Choose the default route for future sessions.</small></span><div className="compact-select"><button className={routeMode === "full" ? "chosen" : ""} onClick={() => setRouteMode("full")}>Full internet</button><button className={routeMode === "local" ? "chosen" : ""} onClick={() => setRouteMode("local")}>Home only</button></div></div><div className="preference-row"><span className="preference-icon"><Icon name="shield" size={18}/></span><span className="preference-copy"><strong>Privacy &amp; security</strong><small>Connection actions are simulated in this prototype. No traffic is collected.</small></span><span className="demo-badge">PROTOTYPE</span></div></section></div>}
      </section>

      {showPairing && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setShowPairing(false); setPairingMessage(""); } }}><section className="pairing-modal" role="dialog" aria-modal="true" aria-labelledby="pair-title"><button className="modal-close" aria-label="Close" onClick={() => { setShowPairing(false); setPairingMessage(""); }}><Icon name="close" size={18}/></button><span className="modal-icon"><Icon name="router" size={23}/></span><p className="overline">ADD A DEVICE</p><h2 id="pair-title">Pair your gateway</h2><p className="modal-copy">Enter the one-time setup code shown in your gateway app to add it to your account.</p><form onSubmit={handlePair}><label htmlFor="pair-code">Setup code</label><input id="pair-code" autoFocus value={pairingCode} onChange={(event) => { setPairingCode(event.target.value); setPairingMessage(""); }} placeholder="e.g. H7K2-P9"/><button className="primary-connect modal-submit" type="submit">Continue</button></form>{pairingMessage && <p className="pairing-message" role="status">{pairingMessage}</p>}<p className="modal-footnote"><Icon name="lock" size={13}/> Pairing is a UI prototype; no code is sent or stored.</p></section></div>}
    </main>
  );
}
