import { useState, useEffect, useRef, useCallback } from "react";

/* ─── GOOGLE FONTS ─── */
const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,600&family=Syne:wght@400;500;600;700;800&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&display=swap');
    
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    
    :root {
      --black:   #080A08;
      --deep:    #0E1510;
      --forest:  #122B1A;
      --green:   #1D4A28;
      --mid:     #254D30;
      --muted:   #2E5C38;
      --gold:    #C8971C;
      --gold-l:  #E5B84A;
      --gold-p:  #F3D98A;
      --cream:   #F2EDE3;
      --cream-d: #D9D1C0;
      --text:    #E8E3D8;
      --sub:     #9A9585;
      --border:  rgba(200,151,28,0.18);
      --glass:   rgba(18,43,26,0.7);
      --r:       #C0392B;
      --b:       #2471A3;
      --g:       #1D8A4A;
      --font-d:  'Cormorant Garamond', Georgia, serif;
      --font-s:  'Syne', sans-serif;
      --font-m:  'DM Mono', monospace;
    }

    html, body, #root { height: 100%; }

    body {
      background: var(--black);
      color: var(--text);
      font-family: var(--font-s);
      overflow: hidden;
      cursor: default;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--deep); }
    ::-webkit-scrollbar-thumb { background: var(--muted); border-radius: 2px; }

    input, textarea, select {
      font-family: var(--font-s);
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      color: var(--text);
      border-radius: 8px;
      padding: 10px 14px;
      outline: none;
      transition: border-color 0.2s;
      width: 100%;
    }
    input:focus, textarea:focus, select:focus { border-color: var(--gold); }
    input::placeholder, textarea::placeholder { color: var(--sub); }
    select option { background: var(--deep); }

    button { cursor: pointer; font-family: var(--font-s); border: none; outline: none; }

    .fade-in { animation: fadeIn 0.4s ease both; }
    .slide-up { animation: slideUp 0.35s ease both; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
    @keyframes shimmer {
      0% { background-position: -200% center; }
      100% { background-position: 200% center; }
    }

    .kente-border {
      background: repeating-linear-gradient(90deg,
        var(--gold) 0px, var(--gold) 3px,
        transparent 3px, transparent 10px,
        var(--green) 10px, var(--green) 13px,
        transparent 13px, transparent 20px
      );
      height: 3px;
      width: 100%;
    }

    .geo-pattern {
      background-image: 
        repeating-linear-gradient(45deg, transparent, transparent 12px, rgba(200,151,28,0.03) 12px, rgba(200,151,28,0.03) 13px),
        repeating-linear-gradient(-45deg, transparent, transparent 12px, rgba(29,74,40,0.05) 12px, rgba(29,74,40,0.05) 13px);
    }

    .gold-shimmer {
      background: linear-gradient(90deg, var(--gold-l), var(--gold-p), var(--gold-l));
      background-size: 200% auto;
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: shimmer 3s linear infinite;
    }
  `}</style>
);

/* ─── STORAGE LAYER ─── */
const DB_KEY = "amb:collective:v1";

const defaultData = {
  users: [
    { id: "anthony", name: "Anthony Munyui", initials: "AM", color: "#C0392B", bio: "Co-founder. Strategic thinker.", joinedDate: "2024-01-01" },
    { id: "bethuel", name: "Bethuel Mosomi", initials: "BM", color: "#2471A3", bio: "Co-founder. Financial analyst.", joinedDate: "2024-01-01" },
    { id: "brian",   name: "Brian Kipkemboi", initials: "BK", color: "#1D8A4A", bio: "Co-founder. Tech & innovation.", joinedDate: "2024-01-01" },
  ],
  passwords: { anthony: "Anthony2024", bethuel: "Bethuel2024", brian: "Brian2024" },
  contributions: [],
  investments: [],
  discussions: [],
  replies: [],
  welfare: [],
  watchlist: [],
  announcements: ["Welcome to AMB Collective — where brotherhood meets prosperity. 🌍"],
};

async function loadDB() {
  try {
    const res = await window.storage.get(DB_KEY);
    if (res && res.value) return JSON.parse(res.value);
  } catch (_) {}
  return defaultData;
}

async function saveDB(data) {
  try {
    await window.storage.set(DB_KEY, JSON.stringify(data));
  } catch (_) {}
}

/* ─── HELPERS ─── */
const fmt = (n) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n || 0);
const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
const uid = () => Math.random().toString(36).slice(2, 10);
const now = () => new Date().toISOString();
const thisWeek = () => {
  const d = new Date(); const day = d.getDay();
  const mon = new Date(d); mon.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); mon.setHours(0,0,0,0);
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23,59,59,999);
  return { start: mon.toISOString(), end: sun.toISOString() };
};
const timeAgo = (iso) => {
  const s = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s/60)}m ago`;
  if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago`;
};
const memberColors = { anthony: "#C0392B", bethuel: "#2471A3", brian: "#1D8A4A" };

/* ─── AVATAR ─── */
const Avatar = ({ user, size = 36, ring = false }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%", flexShrink: 0,
    background: `linear-gradient(135deg, ${user?.color || "#C8971C"}, ${user?.color || "#C8971C"}88)`,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "var(--font-d)", fontWeight: 600, fontSize: size * 0.35,
    color: "#fff", letterSpacing: "0.02em",
    boxShadow: ring ? `0 0 0 2px var(--black), 0 0 0 4px ${user?.color || "#C8971C"}55` : "none",
    flexShrink: 0,
  }}>{user?.initials || "?"}</div>
);

/* ─── BTN ─── */
const Btn = ({ children, onClick, variant = "primary", style = {}, disabled = false, small = false }) => {
  const styles = {
    primary: { background: "linear-gradient(135deg,#C8971C,#E5B84A)", color: "#080A08", fontWeight: 700 },
    ghost: { background: "transparent", color: "var(--gold-l)", border: "1px solid var(--border)" },
    danger: { background: "rgba(192,57,43,0.15)", color: "#E74C3C", border: "1px solid rgba(192,57,43,0.3)" },
    muted: { background: "rgba(255,255,255,0.05)", color: "var(--sub)", border: "1px solid var(--border)" },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      padding: small ? "6px 14px" : "11px 22px",
      borderRadius: 8, fontSize: small ? 12 : 13, letterSpacing: "0.05em",
      fontFamily: "var(--font-s)", transition: "all 0.2s", opacity: disabled ? 0.5 : 1,
      display: "inline-flex", alignItems: "center", gap: 6,
      ...styles[variant], ...style,
    }}>{children}</button>
  );
};

/* ─── CARD ─── */
const Card = ({ children, style = {}, glass = false }) => (
  <div style={{
    background: glass ? "var(--glass)" : "rgba(18,43,26,0.45)",
    border: "1px solid var(--border)", borderRadius: 14,
    backdropFilter: "blur(12px)", padding: 20, ...style,
  }}>{children}</div>
);

/* ─── STAT BOX ─── */
const Stat = ({ label, value, sub, accent }) => (
  <Card style={{ flex: 1, minWidth: 140 }}>
    <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 8 }}>{label}</div>
    <div style={{ fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 600, color: accent || "var(--gold-l)", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: "var(--sub)", marginTop: 6 }}>{sub}</div>}
  </Card>
);

/* ─── MODAL ─── */
const Modal = ({ open, onClose, title, children, width = 480 }) => {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      backdropFilter: "blur(4px)",
    }}>
      <div onClick={e => e.stopPropagation()} className="slide-up" style={{
        background: "var(--deep)", border: "1px solid var(--border)", borderRadius: 16,
        width: "100%", maxWidth: width, maxHeight: "85vh", overflow: "auto",
      }}>
        <div style={{ padding: "18px 22px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 600 }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", color: "var(--sub)", fontSize: 20, lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
};

/* ─── BADGE ─── */
const Badge = ({ color, children }) => (
  <span style={{
    background: `${color}22`, color, border: `1px solid ${color}44`,
    borderRadius: 20, padding: "2px 10px", fontSize: 11, fontFamily: "var(--font-m)",
    letterSpacing: "0.04em",
  }}>{children}</span>
);

/* ═══════════════════════════════════════════════════════
   AUTH SCREEN
═══════════════════════════════════════════════════════ */
const AuthScreen = ({ db, onLogin }) => {
  const [mode, setMode] = useState("login"); // login | signup
  const [form, setForm] = useState({ id: "", name: "", password: "", confirm: "" });
  const [error, setError] = useState("");

  const handleLogin = () => {
    const user = db.users.find(u => u.id === form.id);
    if (!user) return setError("Member not found.");
    if (db.passwords[form.id] !== form.password) return setError("Incorrect password.");
    onLogin(user);
  };

  const handleSignup = () => {
    if (!form.id || !form.name || !form.password) return setError("All fields required.");
    if (form.password !== form.confirm) return setError("Passwords don't match.");
    if (db.users.find(u => u.id === form.id)) return setError("Username taken.");
    const color = ["#7D3C98","#117A65","#B7770D"][db.users.length % 3];
    const newUser = { id: form.id, name: form.name, initials: form.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase(), color, bio: "", joinedDate: now() };
    onLogin(newUser, { ...form });
  };

  return (
    <div className="geo-pattern" style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "radial-gradient(ellipse 80% 70% at 50% 20%, #122B1A 0%, #080A08 100%)",
      position: "relative", overflow: "hidden",
    }}>
      {/* Decorative circles */}
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", border: "1px solid rgba(200,151,28,0.08)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      <div style={{ position: "absolute", width: 350, height: 350, borderRadius: "50%", border: "1px solid rgba(200,151,28,0.06)", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
      
      <div className="fade-in" style={{ width: "100%", maxWidth: 440, padding: 24, zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", gap: 6, marginBottom: 16 }}>
            {["A","M","B"].map((l,i) => (
              <div key={l} style={{
                width: 44, height: 44, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
                background: ["rgba(192,57,43,0.2)","rgba(200,151,28,0.15)","rgba(36,113,163,0.2)"][i],
                border: `1px solid ${["rgba(192,57,43,0.4)","rgba(200,151,28,0.4)","rgba(36,113,163,0.4)"][i]}`,
                fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 700,
                color: ["#E74C3C","var(--gold-l)","#3498DB"][i],
              }}>{l}</div>
            ))}
          </div>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 32, fontWeight: 600, letterSpacing: "0.01em" }}>AMB Collective</div>
          <div style={{ fontSize: 12, color: "var(--sub)", letterSpacing: "0.15em", textTransform: "uppercase", marginTop: 4 }}>Brotherhood of Growth</div>
          <div className="kente-border" style={{ marginTop: 20 }} />
        </div>

        <Card style={{ background: "rgba(14,21,16,0.9)" }}>
          <div style={{ display: "flex", gap: 0, marginBottom: 20, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3 }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); }} style={{
                flex: 1, padding: "8px 0", borderRadius: 6, fontSize: 13, fontFamily: "var(--font-s)", fontWeight: 600,
                background: mode === m ? "var(--green)" : "transparent",
                color: mode === m ? "var(--gold-l)" : "var(--sub)",
                border: mode === m ? "1px solid var(--border)" : "none",
                letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.2s",
              }}>{m}</button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {mode === "login" && (
              <>
                <div>
                  <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Member ID</label>
                  <select value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value }))}>
                    <option value="">— Select member —</option>
                    {db.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
                  <input type="password" placeholder="Enter password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} onKeyDown={e => e.key === "Enter" && handleLogin()} />
                </div>
                <div style={{ fontSize: 11, color: "var(--sub)", background: "rgba(200,151,28,0.07)", borderRadius: 6, padding: "8px 12px", border: "1px solid var(--border)" }}>
                  Default passwords: <span style={{ fontFamily: "var(--font-m)", color: "var(--gold)" }}>Anthony2024 / Bethuel2024 / Brian2024</span>
                </div>
              </>
            )}
            {mode === "signup" && (
              <>
                <div>
                  <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Username (no spaces)</label>
                  <input placeholder="e.g. john_doe" value={form.id} onChange={e => setForm(f => ({ ...f, id: e.target.value.toLowerCase().replace(/\s/g,"") }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Full Name</label>
                  <input placeholder="Your full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Password</label>
                  <input type="password" placeholder="Choose a password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Confirm Password</label>
                  <input type="password" placeholder="Repeat password" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} />
                </div>
              </>
            )}
            {error && <div style={{ color: "#E74C3C", fontSize: 12, background: "rgba(192,57,43,0.1)", borderRadius: 6, padding: "8px 12px" }}>⚠ {error}</div>}
            <Btn onClick={mode === "login" ? handleLogin : handleSignup} style={{ width: "100%", justifyContent: "center", marginTop: 4 }}>
              {mode === "login" ? "Enter the Collective" : "Join the Brotherhood"}
            </Btn>
          </div>
        </Card>

        <div style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "var(--sub)", letterSpacing: "0.04em" }}>
          Anthony · Bethuel · Brian — Since 2024
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════ */
const NAV = [
  { id: "dashboard",     icon: "⬡", label: "Dashboard" },
  { id: "contributions", icon: "◈", label: "Contributions" },
  { id: "investments",   icon: "◎", label: "Investments" },
  { id: "discussions",   icon: "◇", label: "Discussions" },
  { id: "welfare",       icon: "❖", label: "Welfare" },
  { id: "watchlist",     icon: "◉", label: "Watchlist" },
  { id: "members",       icon: "◐", label: "Members" },
  { id: "profile",       icon: "◑", label: "My Profile" },
];

const Sidebar = ({ current, setCurrent, user, onLogout, db }) => {
  const total = db.contributions.reduce((s, c) => s + c.amount, 0);
  const week = thisWeek();
  const thisWeekPaid = [...new Set(db.contributions.filter(c => c.date >= week.start && c.date <= week.end).map(c => c.userId))];

  return (
    <div style={{
      width: 220, flexShrink: 0, background: "rgba(10,16,11,0.95)",
      borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column",
      backdropFilter: "blur(20px)", position: "relative", overflow: "hidden",
    }}>
      {/* Kente accent */}
      <div style={{ height: 3, background: "linear-gradient(90deg,#C0392B,#C8971C,#2471A3,#1D8A4A,#C8971C)", flexShrink: 0 }} />

      {/* Logo */}
      <div style={{ padding: "18px 18px 14px" }}>
        <div style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 700, letterSpacing: "0.02em", lineHeight: 1 }}>AMB</div>
        <div style={{ fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--sub)", marginTop: 2 }}>Collective</div>
        <div className="kente-border" style={{ marginTop: 12 }} />
      </div>

      {/* Pool snapshot */}
      <div style={{ margin: "0 12px 14px", padding: "12px 14px", background: "rgba(200,151,28,0.08)", borderRadius: 10, border: "1px solid var(--border)" }}>
        <div style={{ fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 4 }}>Total Pool</div>
        <div style={{ fontFamily: "var(--font-d)", fontSize: 22, fontWeight: 600, color: "var(--gold-l)" }}>{fmt(total)}</div>
        <div style={{ fontSize: 10, color: "var(--sub)", marginTop: 6 }}>Week paid: {thisWeekPaid.length}/3</div>
        <div style={{ display: "flex", gap: 3, marginTop: 6 }}>
          {db.users.slice(0,3).map(u => (
            <div key={u.id} style={{
              width: 22, height: 22, borderRadius: "50%",
              background: thisWeekPaid.includes(u.id) ? u.color : "rgba(255,255,255,0.07)",
              border: `2px solid ${thisWeekPaid.includes(u.id) ? u.color : "var(--border)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 8, color: "#fff", fontWeight: 700,
            }}>{u.initials[0]}</div>
          ))}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 8px", overflow: "auto" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setCurrent(n.id)} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 10,
            padding: "9px 10px", borderRadius: 8, marginBottom: 2, textAlign: "left",
            background: current === n.id ? "rgba(200,151,28,0.12)" : "transparent",
            color: current === n.id ? "var(--gold-l)" : "var(--sub)",
            borderLeft: current === n.id ? "2px solid var(--gold)" : "2px solid transparent",
            fontSize: 13, fontFamily: "var(--font-s)", fontWeight: current === n.id ? 600 : 400,
            transition: "all 0.15s", cursor: "pointer",
          }}>
            <span style={{ fontSize: 14, opacity: current === n.id ? 1 : 0.6 }}>{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: "12px 12px 14px", borderTop: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Avatar user={user} size={32} ring />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name.split(" ")[0]}</div>
            <div style={{ fontSize: 10, color: "var(--sub)" }}>@{user.id}</div>
          </div>
        </div>
        <button onClick={onLogout} style={{
          width: "100%", padding: "7px 0", borderRadius: 7, fontSize: 11, letterSpacing: "0.06em",
          textTransform: "uppercase", background: "rgba(192,57,43,0.1)", color: "#E74C3C",
          border: "1px solid rgba(192,57,43,0.2)", cursor: "pointer",
        }}>Sign Out</button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════ */
const Dashboard = ({ db, user }) => {
  const total = db.contributions.reduce((s, c) => s + c.amount, 0);
  const invTotal = db.investments.reduce((s, i) => s + (i.currentValue || i.amount), 0);
  const welfareTotal = db.welfare.reduce((s, w) => s + w.amount, 0);
  const week = thisWeek();
  const thisWeekTotal = db.contributions.filter(c => c.date >= week.start && c.date <= week.end).reduce((s, c) => s + c.amount, 0);
  const thisWeekPaid = [...new Set(db.contributions.filter(c => c.date >= week.start && c.date <= week.end).map(c => c.userId))];
  const recentContribs = [...db.contributions].sort((a,b) => b.date.localeCompare(a.date)).slice(0,5);
  const recentDiscussions = [...db.discussions].sort((a,b) => b.date.localeCompare(a.date)).slice(0,3);

  const memberStats = db.users.slice(0,3).map(u => ({
    ...u,
    total: db.contributions.filter(c => c.userId === u.id).reduce((s, c) => s + c.amount, 0),
    count: db.contributions.filter(c => c.userId === u.id).length,
    paidThisWeek: thisWeekPaid.includes(u.id),
  }));

  return (
    <div className="fade-in" style={{ padding: "24px 28px", overflow: "auto", height: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 4 }}>Welcome back,</div>
            <h1 style={{ fontFamily: "var(--font-d)", fontSize: 34, fontWeight: 600, lineHeight: 1 }}>
              {user.name.split(" ")[0]} <span style={{ fontWeight: 300, fontStyle: "italic", color: "var(--gold-l)" }}>— Good to see you</span>
            </h1>
          </div>
        </div>
        {db.announcements[0] && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(200,151,28,0.07)", borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, color: "var(--cream-d)" }}>
            📢 {db.announcements[0]}
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <Stat label="Total Pool" value={fmt(total)} sub={`From ${db.contributions.length} contributions`} />
        <Stat label="Invested" value={fmt(invTotal)} sub={`Across ${db.investments.length} assets`} accent="var(--text)" />
        <Stat label="This Week" value={fmt(thisWeekTotal)} sub={`${thisWeekPaid.length}/3 members paid`} accent="var(--gold-p)" />
        <Stat label="Welfare Fund" value={fmt(welfareTotal)} sub={`${db.welfare.length} allocations`} accent="#88CC99" />
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        
        {/* Member standings */}
        <Card>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 14 }}>Member Standings</div>
          {memberStats.map((m, i) => (
            <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: i < 2 ? 14 : 0 }}>
              <div style={{ fontFamily: "var(--font-m)", fontSize: 12, color: "var(--sub)", width: 16, textAlign: "right" }}>#{i+1}</div>
              <Avatar user={m} size={38} ring />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.name}</div>
                <div style={{ marginTop: 4, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${total > 0 ? (m.total / total) * 100 : 33}%`, background: m.color, borderRadius: 2, transition: "width 0.6s" }} />
                </div>
                <div style={{ fontSize: 10, color: "var(--sub)", marginTop: 3 }}>{m.count} payments · {fmt(m.total)}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-m)", fontSize: 12, color: "var(--gold-l)" }}>{fmt(m.total)}</div>
                {m.paidThisWeek
                  ? <Badge color="#1D8A4A">✓ This week</Badge>
                  : <Badge color="#C0392B">Pending</Badge>}
              </div>
            </div>
          ))}
        </Card>

        {/* Recent activity */}
        <Card>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 14 }}>Recent Contributions</div>
          {recentContribs.length === 0 ? (
            <div style={{ color: "var(--sub)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No contributions yet.</div>
          ) : recentContribs.map((c) => {
            const member = db.users.find(u => u.id === c.userId);
            return (
              <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Avatar user={member} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{member?.name?.split(" ")[0] || c.userId}</div>
                  <div style={{ fontSize: 10, color: "var(--sub)" }}>{fmtDate(c.date)}{c.note ? ` · ${c.note}` : ""}</div>
                </div>
                <div style={{ fontFamily: "var(--font-m)", color: "var(--gold-l)", fontSize: 13 }}>+{fmt(c.amount)}</div>
              </div>
            );
          })}
        </Card>

        {/* Recent discussions */}
        <Card style={{ gridColumn: "1 / -1" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 14 }}>Recent Discussions</div>
          {recentDiscussions.length === 0 ? (
            <div style={{ color: "var(--sub)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>No discussions yet. Start a conversation!</div>
          ) : (
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {recentDiscussions.map(d => {
                const author = db.users.find(u => u.id === d.userId);
                const rCount = db.replies.filter(r => r.discussionId === d.id).length;
                return (
                  <div key={d.id} style={{ flex: 1, minWidth: 200, padding: "12px 14px", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid var(--border)" }}>
                    <Badge color={["#C8971C","#2471A3","#1D8A4A","#7D3C98"][["investment","welfare","general","strategy"].indexOf(d.category)] || "#C8971C"}>{d.category}</Badge>
                    <div style={{ fontFamily: "var(--font-d)", fontSize: 16, fontWeight: 600, margin: "8px 0 4px", lineHeight: 1.3 }}>{d.title}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--sub)" }}>
                      <Avatar user={author} size={16} />
                      {author?.name?.split(" ")[0]} · {timeAgo(d.date)} · {rCount} replies
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   CONTRIBUTIONS
═══════════════════════════════════════════════════════ */
const Contributions = ({ db, user, update }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ userId: user.id, amount: 100, note: "", date: new Date().toISOString().split("T")[0] });
  const [filterUser, setFilterUser] = useState("all");

  const handleAdd = () => {
    const entry = { id: uid(), userId: form.userId, amount: Number(form.amount), note: form.note, date: new Date(form.date).toISOString() };
    update(db => ({ ...db, contributions: [...db.contributions, entry] }));
    setModal(false);
    setForm(f => ({ ...f, note: "" }));
  };

  const handleDelete = (id) => {
    if (window.confirm("Remove this contribution?"))
      update(db => ({ ...db, contributions: db.contributions.filter(c => c.id !== id) }));
  };

  const filtered = [...db.contributions].filter(c => filterUser === "all" || c.userId === filterUser).sort((a,b) => b.date.localeCompare(a.date));
  const total = db.contributions.reduce((s,c) => s+c.amount, 0);
  const week = thisWeek();
  const thisWeekPaid = db.contributions.filter(c => c.date >= week.start && c.date <= week.end);

  // Build weekly chart data (last 8 weeks)
  const weeklyData = (() => {
    const weeks = [];
    for (let i = 7; i >= 0; i--) {
      const start = new Date(); start.setDate(start.getDate() - i * 7 - (start.getDay() || 7) + 1); start.setHours(0,0,0,0);
      const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
      const amt = db.contributions.filter(c => c.date >= start.toISOString() && c.date <= end.toISOString()).reduce((s,c) => s+c.amount, 0);
      weeks.push({ label: start.toLocaleDateString("en-US",{month:"short",day:"numeric"}), amt });
    }
    return weeks;
  })();
  const maxAmt = Math.max(...weeklyData.map(w => w.amt), 300);

  return (
    <div className="fade-in" style={{ padding: "24px 28px", overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Fund Pool</div>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 600 }}>Contributions</h2>
        </div>
        <Btn onClick={() => setModal(true)}>+ Log Payment</Btn>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <Stat label="Total Pool" value={fmt(total)} sub={`${db.contributions.length} payments`} />
        <Stat label="This Week" value={fmt(thisWeekPaid.reduce((s,c)=>s+c.amount,0))} sub={`${[...new Set(thisWeekPaid.map(c=>c.userId))].length}/3 members`} accent="var(--gold-p)" />
        {db.users.slice(0,3).map(u => (
          <Stat key={u.id} label={u.name.split(" ")[0]} value={fmt(db.contributions.filter(c=>c.userId===u.id).reduce((s,c)=>s+c.amount,0))} accent={u.color} />
        ))}
      </div>

      {/* Weekly bar chart */}
      <Card style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 16 }}>Weekly Contribution History</div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
          {weeklyData.map((w, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <div style={{ fontSize: 9, color: "var(--gold)", fontFamily: "var(--font-m)" }}>{w.amt > 0 ? fmt(w.amt).replace("$","$") : ""}</div>
              <div style={{
                width: "100%", borderRadius: "4px 4px 0 0", transition: "height 0.5s",
                height: w.amt > 0 ? `${(w.amt / maxAmt) * 60}px` : "3px",
                background: i === 7 ? "linear-gradient(180deg,var(--gold-l),var(--gold))" : "rgba(200,151,28,0.2)",
                border: "1px solid rgba(200,151,28,0.2)",
              }} />
              <div style={{ fontSize: 9, color: "var(--sub)", whiteSpace: "nowrap" }}>{w.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sub)" }}>Transaction History</div>
          <select value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ width: "auto", padding: "5px 10px", fontSize: 12 }}>
            <option value="all">All Members</option>
            {db.users.map(u => <option key={u.id} value={u.id}>{u.name.split(" ")[0]}</option>)}
          </select>
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0", color: "var(--sub)", fontSize: 13 }}>No contributions logged yet.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto auto", gap: "0 16px", alignItems: "center" }}>
            {["","Member","Amount","Date",""].map((h,i) => (
              <div key={i} style={{ fontSize: 10, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>{h}</div>
            ))}
            {filtered.map(c => {
              const m = db.users.find(u => u.id === c.userId);
              return [
                <Avatar key={`a${c.id}`} user={m} size={28} />,
                <div key={`n${c.id}`} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 10, paddingTop: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{m?.name || c.userId}</div>
                  {c.note && <div style={{ fontSize: 11, color: "var(--sub)" }}>{c.note}</div>}
                </div>,
                <div key={`am${c.id}`} style={{ fontFamily: "var(--font-m)", fontSize: 13, color: "var(--gold-l)", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 10, paddingTop: 10 }}>+{fmt(c.amount)}</div>,
                <div key={`d${c.id}`} style={{ fontSize: 11, color: "var(--sub)", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 10, paddingTop: 10 }}>{fmtDate(c.date)}</div>,
                <button key={`del${c.id}`} onClick={() => handleDelete(c.id)} style={{ background: "none", color: "rgba(192,57,43,0.5)", fontSize: 16, cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: 10, paddingTop: 10 }}>×</button>
              ];
            }).flat()}
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={() => setModal(false)} title="Log Contribution">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Member</label>
            <select value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}>
              {db.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Amount (USD)</label>
            <input type="number" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Note (optional)</label>
            <input placeholder="Weekly contribution, etc." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
          <Btn onClick={handleAdd} style={{ width: "100%", justifyContent: "center" }}>Confirm & Save</Btn>
        </div>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   INVESTMENTS
═══════════════════════════════════════════════════════ */
const INVEST_CATS = ["Stocks", "Shares", "Crypto", "Real Estate", "Bonds", "Savings", "Business", "Other"];
const INVEST_STATUS = ["Active", "Exited", "Pending", "Watchlist"];

const Investments = ({ db, user, update }) => {
  const [modal, setModal] = useState(false);
  const [editModal, setEditModal] = useState(null);
  const [form, setForm] = useState({ name: "", category: "Stocks", amount: "", currentValue: "", status: "Active", notes: "", date: new Date().toISOString().split("T")[0], addedBy: user.id });
  const [filterCat, setFilterCat] = useState("All");

  const handleAdd = () => {
    if (!form.name || !form.amount) return;
    const inv = { id: uid(), ...form, amount: Number(form.amount), currentValue: Number(form.currentValue || form.amount), date: new Date(form.date).toISOString(), addedBy: user.id };
    update(db => ({ ...db, investments: [...db.investments, inv] }));
    setModal(false); setForm({ name: "", category: "Stocks", amount: "", currentValue: "", status: "Active", notes: "", date: new Date().toISOString().split("T")[0], addedBy: user.id });
  };

  const handleUpdateValue = (id, newValue) => {
    update(db => ({ ...db, investments: db.investments.map(i => i.id === id ? { ...i, currentValue: Number(newValue) } : i) }));
  };

  const handleDelete = (id) => {
    if (window.confirm("Remove this investment?"))
      update(db => ({ ...db, investments: db.investments.filter(i => i.id !== id) }));
  };

  const all = db.investments;
  const filtered = filterCat === "All" ? all : all.filter(i => i.category === filterCat);
  const totalInvested = all.reduce((s,i) => s+i.amount, 0);
  const totalCurrent = all.reduce((s,i) => s+(i.currentValue||i.amount), 0);
  const gain = totalCurrent - totalInvested;
  const gainPct = totalInvested > 0 ? ((gain/totalInvested)*100).toFixed(1) : 0;

  return (
    <div className="fade-in" style={{ padding: "24px 28px", overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Portfolio</div>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 600 }}>Investments</h2>
        </div>
        <Btn onClick={() => setModal(true)}>+ Add Investment</Btn>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <Stat label="Total Invested" value={fmt(totalInvested)} />
        <Stat label="Current Value" value={fmt(totalCurrent)} accent={gain >= 0 ? "#88CC99" : "#E74C3C"} />
        <Stat label="Total Return" value={`${gain >= 0 ? "+" : ""}${fmt(gain)}`} sub={`${gainPct}% overall`} accent={gain >= 0 ? "#88CC99" : "#E74C3C"} />
        <Stat label="Assets" value={all.length} sub={`${all.filter(i=>i.status==="Active").length} active`} accent="var(--cream)" />
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {["All", ...INVEST_CATS].map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
            background: filterCat === c ? "var(--gold)" : "rgba(255,255,255,0.05)",
            color: filterCat === c ? "var(--black)" : "var(--sub)",
            border: filterCat === c ? "none" : "1px solid var(--border)",
            fontFamily: "var(--font-s)", fontWeight: filterCat === c ? 700 : 400,
          }}>{c}</button>
        ))}
      </div>

      {/* Investment cards */}
      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 20, color: "var(--sub)", marginBottom: 8 }}>No investments yet</div>
          <div style={{ fontSize: 13, color: "var(--sub)" }}>Track your first asset to see your portfolio grow.</div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {filtered.map(inv => {
            const member = db.users.find(u => u.id === inv.addedBy);
            const g = (inv.currentValue || inv.amount) - inv.amount;
            const gPct = ((g / inv.amount) * 100).toFixed(1);
            const statusColor = { Active:"#1D8A4A", Exited:"#C8971C", Pending:"#2471A3", Watchlist:"#7D3C98" }[inv.status] || "#888";
            return (
              <Card key={inv.id} style={{ position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <Badge color={statusColor}>{inv.status}</Badge>
                    <div style={{ fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 600, marginTop: 6, lineHeight: 1.2 }}>{inv.name}</div>
                    <div style={{ fontSize: 11, color: "var(--sub)", marginTop: 2 }}>{inv.category} · {fmtDate(inv.date)}</div>
                  </div>
                  <button onClick={() => handleDelete(inv.id)} style={{ background: "none", color: "rgba(192,57,43,0.4)", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--sub)" }}>Invested</div>
                    <div style={{ fontFamily: "var(--font-m)", fontSize: 15 }}>{fmt(inv.amount)}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 10, color: "var(--sub)" }}>Current Value</div>
                    <div style={{ fontFamily: "var(--font-m)", fontSize: 15, color: "var(--gold-l)" }}>{fmt(inv.currentValue || inv.amount)}</div>
                  </div>
                </div>
                <div style={{ padding: "6px 10px", borderRadius: 6, marginBottom: 10, background: g >= 0 ? "rgba(29,138,74,0.1)" : "rgba(192,57,43,0.1)", textAlign: "center" }}>
                  <span style={{ fontFamily: "var(--font-m)", fontSize: 13, color: g >= 0 ? "#88CC99" : "#E74C3C" }}>
                    {g >= 0 ? "▲" : "▼"} {fmt(Math.abs(g))} ({Math.abs(gPct)}%)
                  </span>
                </div>
                {inv.notes && <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 10, fontStyle: "italic" }}>{inv.notes}</div>}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--sub)" }}>
                    <Avatar user={member} size={16} /> {member?.name?.split(" ")[0]}
                  </div>
                  <input type="number" placeholder="Update value" style={{ width: 110, padding: "4px 8px", fontSize: 11 }}
                    onBlur={e => { if(e.target.value) { handleUpdateValue(inv.id, e.target.value); e.target.value = ""; } }}
                    onKeyDown={e => { if(e.key==="Enter"&&e.target.value) { handleUpdateValue(inv.id, e.target.value); e.target.value = ""; } }} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add Investment" width={520}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Asset Name</label>
              <input placeholder="e.g. Safaricom Shares" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Category</label>
              <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
                {INVEST_CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Status</label>
              <select value={form.status} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
                {INVEST_STATUS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Amount Invested ($)</label>
              <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Current Value ($)</label>
              <input type="number" placeholder="Leave blank = same" value={form.currentValue} onChange={e => setForm(f=>({...f,currentValue:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Notes</label>
              <textarea placeholder="Strategy, source, broker, etc." value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} style={{ height: 70 }} />
            </div>
          </div>
          <Btn onClick={handleAdd} style={{ width: "100%", justifyContent: "center" }}>Add to Portfolio</Btn>
        </div>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   DISCUSSIONS
═══════════════════════════════════════════════════════ */
const DISC_CATS = ["General", "Investment", "Welfare", "Strategy", "Milestone", "Announcement"];

const Discussions = ({ db, user, update }) => {
  const [view, setView] = useState("list"); // list | thread
  const [activeThread, setActiveThread] = useState(null);
  const [newThread, setNewThread] = useState(false);
  const [reply, setReply] = useState("");
  const [form, setForm] = useState({ title: "", body: "", category: "General" });
  const [filterCat, setFilterCat] = useState("All");

  const handleNewThread = () => {
    if (!form.title || !form.body) return;
    const d = { id: uid(), userId: user.id, title: form.title, body: form.body, category: form.category, date: now(), likes: [] };
    update(db => ({ ...db, discussions: [...db.discussions, d] }));
    setForm({ title: "", body: "", category: "General" });
    setNewThread(false);
  };

  const handleReply = () => {
    if (!reply.trim()) return;
    const r = { id: uid(), discussionId: activeThread.id, userId: user.id, body: reply, date: now(), likes: [] };
    update(db => ({ ...db, replies: [...db.replies, r] }));
    setReply("");
  };

  const handleLike = (type, id) => {
    update(db => ({
      ...db,
      [type]: db[type].map(item => item.id !== id ? item : {
        ...item, likes: item.likes?.includes(user.id)
          ? item.likes.filter(l => l !== user.id)
          : [...(item.likes||[]), user.id]
      })
    }));
  };

  const handleDeleteThread = (id) => {
    if (!window.confirm("Delete this thread?")) return;
    update(db => ({ ...db, discussions: db.discussions.filter(d => d.id !== id), replies: db.replies.filter(r => r.discussionId !== id) }));
    setView("list"); setActiveThread(null);
  };

  const catColor = { General:"#888", Investment:"#C8971C", Welfare:"#1D8A4A", Strategy:"#2471A3", Milestone:"#E74C3C", Announcement:"#7D3C98" };

  const filtered = [...db.discussions].filter(d => filterCat === "All" || d.category === filterCat).sort((a,b) => b.date.localeCompare(a.date));

  if (view === "thread" && activeThread) {
    const thread = db.discussions.find(d => d.id === activeThread.id) || activeThread;
    const author = db.users.find(u => u.id === thread.userId);
    const threadReplies = [...db.replies.filter(r => r.discussionId === thread.id)].sort((a,b) => a.date.localeCompare(b.date));

    return (
      <div className="fade-in" style={{ padding: "24px 28px", overflow: "auto", height: "100%", display: "flex", flexDirection: "column" }}>
        <button onClick={() => { setView("list"); setActiveThread(null); }} style={{
          background: "none", color: "var(--sub)", fontSize: 13, cursor: "pointer", marginBottom: 18, display: "flex", alignItems: "center", gap: 6, width: "fit-content"
        }}>← Back to Discussions</button>

        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Badge color={catColor[thread.category] || "#888"}>{thread.category}</Badge>
            {thread.userId === user.id && <button onClick={() => handleDeleteThread(thread.id)} style={{ background: "none", color: "rgba(192,57,43,0.5)", cursor: "pointer", fontSize: 12 }}>Delete thread</button>}
          </div>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 26, fontWeight: 600, margin: "10px 0 6px", lineHeight: 1.3 }}>{thread.title}</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Avatar user={author} size={28} ring />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{author?.name}</span>
            <span style={{ color: "var(--sub)", fontSize: 11 }}>· {timeAgo(thread.date)}</span>
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "var(--cream-d)", whiteSpace: "pre-wrap" }}>{thread.body}</div>
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <button onClick={() => handleLike("discussions", thread.id)} style={{
              background: "none", fontSize: 12, color: thread.likes?.includes(user.id) ? "var(--gold-l)" : "var(--sub)", cursor: "pointer",
              border: "1px solid var(--border)", borderRadius: 20, padding: "4px 12px",
            }}>♥ {thread.likes?.length || 0} like{thread.likes?.length !== 1 ? "s" : ""}</button>
            <span style={{ fontSize: 12, color: "var(--sub)" }}>{threadReplies.length} replies</span>
          </div>
        </Card>

        {/* Replies */}
        <div style={{ flex: 1 }}>
          {threadReplies.map((r, i) => {
            const rAuthor = db.users.find(u => u.id === r.userId);
            return (
              <div key={r.id} className="slide-up" style={{ display: "flex", gap: 12, marginBottom: 14, animationDelay: `${i*0.05}s` }}>
                <Avatar user={rAuthor} size={34} ring />
                <div style={{ flex: 1, background: "rgba(18,43,26,0.4)", borderRadius: 10, padding: "12px 14px", border: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{rAuthor?.name}</span>
                    <span style={{ fontSize: 11, color: "var(--sub)" }}>{timeAgo(r.date)}</span>
                  </div>
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: "var(--cream-d)" }}>{r.body}</div>
                  <button onClick={() => handleLike("replies", r.id)} style={{
                    background: "none", fontSize: 11, color: r.likes?.includes(user.id) ? "var(--gold)" : "var(--sub)", cursor: "pointer", marginTop: 6, border: "none",
                  }}>♥ {r.likes?.length || 0}</button>
                </div>
              </div>
            );
          })}
        </div>

        <Card style={{ marginTop: 14, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <Avatar user={user} size={34} ring />
            <div style={{ flex: 1 }}>
              <textarea
                placeholder="Write a reply..."
                value={reply}
                onChange={e => setReply(e.target.value)}
                onKeyDown={e => { if(e.key==="Enter"&&e.metaKey) handleReply(); }}
                style={{ height: 70, resize: "vertical" }}
              />
              <div style={{ fontSize: 11, color: "var(--sub)", marginTop: 4 }}>⌘ + Enter to submit</div>
            </div>
            <Btn onClick={handleReply} disabled={!reply.trim()}>Reply</Btn>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: "24px 28px", overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Community</div>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 600 }}>Discussions</h2>
        </div>
        <Btn onClick={() => setNewThread(true)}>+ New Thread</Btn>
      </div>

      {/* Category filter */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
        {["All", ...DISC_CATS].map(c => (
          <button key={c} onClick={() => setFilterCat(c)} style={{
            padding: "5px 14px", borderRadius: 20, fontSize: 12, cursor: "pointer",
            background: filterCat === c ? catColor[c] || "var(--gold)" : "rgba(255,255,255,0.05)",
            color: filterCat === c ? "#fff" : "var(--sub)",
            border: filterCat === c ? "none" : "1px solid var(--border)",
            fontFamily: "var(--font-s)", fontWeight: filterCat === c ? 700 : 400,
          }}>{c}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "50px" }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 22, color: "var(--sub)", marginBottom: 8 }}>No discussions yet</div>
          <div style={{ fontSize: 13, color: "var(--sub)" }}>Start a conversation to get things moving.</div>
        </Card>
      ) : filtered.map((d, i) => {
        const author = db.users.find(u => u.id === d.userId);
        const rCount = db.replies.filter(r => r.discussionId === d.id).length;
        return (
          <div key={d.id} className="slide-up" style={{ animationDelay: `${i*0.04}s` }}>
            <Card style={{ marginBottom: 12, cursor: "pointer", transition: "border-color 0.2s", ":hover": { borderColor: "var(--gold)" } }}
              glass onClick={() => { setActiveThread(d); setView("thread"); }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <Avatar user={author} size={42} ring />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                    <Badge color={catColor[d.category] || "#888"}>{d.category}</Badge>
                    <span style={{ fontSize: 11, color: "var(--sub)" }}>{author?.name} · {timeAgo(d.date)}</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 18, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>{d.title}</div>
                  <div style={{ fontSize: 13, color: "var(--sub)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{d.body}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "var(--font-m)", fontSize: 13, color: "var(--gold)", marginBottom: 4 }}>{rCount}</div>
                  <div style={{ fontSize: 10, color: "var(--sub)" }}>replies</div>
                  <div style={{ marginTop: 8, fontSize: 11, color: "var(--sub)" }}>♥ {d.likes?.length || 0}</div>
                </div>
              </div>
            </Card>
          </div>
        );
      })}

      <Modal open={newThread} onClose={() => setNewThread(false)} title="Start a Discussion" width={560}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Category</label>
            <select value={form.category} onChange={e => setForm(f=>({...f,category:e.target.value}))}>
              {DISC_CATS.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Title</label>
            <input placeholder="What's on your mind?" value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Message</label>
            <textarea placeholder="Share your thoughts, ideas, or proposals..." value={form.body} onChange={e => setForm(f=>({...f,body:e.target.value}))} style={{ height: 120 }} />
          </div>
          <Btn onClick={handleNewThread} disabled={!form.title || !form.body} style={{ width: "100%", justifyContent: "center" }}>Post Thread</Btn>
        </div>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   WELFARE
═══════════════════════════════════════════════════════ */
const WELFARE_TYPES = ["Medical", "Emergency", "Education", "Bereavement", "Personal Hardship", "Other"];

const Welfare = ({ db, user, update }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ beneficiary: user.id, type: "Medical", amount: "", description: "", date: new Date().toISOString().split("T")[0], approved: false });

  const handleAdd = () => {
    if (!form.amount || !form.description) return;
    const entry = { id: uid(), ...form, amount: Number(form.amount), date: new Date(form.date).toISOString(), requestedBy: user.id };
    update(db => ({ ...db, welfare: [...db.welfare, entry] }));
    setModal(false);
    setForm({ beneficiary: user.id, type: "Medical", amount: "", description: "", date: new Date().toISOString().split("T")[0], approved: false });
  };

  const handleApprove = (id) => {
    update(db => ({ ...db, welfare: db.welfare.map(w => w.id !== id ? w : { ...w, approved: !w.approved, approvedBy: user.id }) }));
  };

  const handleDelete = (id) => {
    if (window.confirm("Remove this welfare record?"))
      update(db => ({ ...db, welfare: db.welfare.filter(w => w.id !== id) }));
  };

  const total = db.welfare.reduce((s,w) => s+w.amount, 0);
  const approved = db.welfare.filter(w => w.approved).reduce((s,w) => s+w.amount, 0);
  const pending = total - approved;
  const typeColor = { Medical:"#E74C3C", Emergency:"#E67E22", Education:"#3498DB", Bereavement:"#7D3C98", "Personal Hardship":"#E91E63", Other:"#888" };

  return (
    <div className="fade-in" style={{ padding: "24px 28px", overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Brotherhood Care</div>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 600 }}>Welfare Fund</h2>
        </div>
        <Btn onClick={() => setModal(true)}>+ New Request</Btn>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <Stat label="Total Allocated" value={fmt(total)} sub={`${db.welfare.length} records`} />
        <Stat label="Approved" value={fmt(approved)} accent="#88CC99" />
        <Stat label="Pending" value={fmt(pending)} accent="#E5B84A" />
      </div>

      <div style={{ padding: "14px 18px", background: "rgba(29,74,40,0.15)", borderRadius: 10, border: "1px solid rgba(29,138,74,0.2)", marginBottom: 22, fontSize: 13, color: "var(--cream-d)", lineHeight: 1.6 }}>
        💚 The AMB Welfare Fund exists to support our brothers in times of need. Any member can request support, and all requests require group acknowledgment. Funds are drawn from the collective pool.
      </div>

      {db.welfare.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 20, color: "var(--sub)" }}>No welfare records yet</div>
        </Card>
      ) : [...db.welfare].sort((a,b) => b.date.localeCompare(a.date)).map((w, i) => {
        const beneficiary = db.users.find(u => u.id === w.beneficiary);
        const requester = db.users.find(u => u.id === w.requestedBy);
        return (
          <Card key={w.id} style={{ marginBottom: 12 }} className="slide-up">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
              <Avatar user={beneficiary} size={44} ring />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6, flexWrap: "wrap" }}>
                  <Badge color={typeColor[w.type] || "#888"}>{w.type}</Badge>
                  <Badge color={w.approved ? "#1D8A4A" : "#C8971C"}>{w.approved ? "✓ Approved" : "Pending"}</Badge>
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{beneficiary?.name}</div>
                <div style={{ fontSize: 13, color: "var(--cream-d)", marginBottom: 6, lineHeight: 1.5 }}>{w.description}</div>
                <div style={{ fontSize: 11, color: "var(--sub)" }}>
                  Requested by {requester?.name?.split(" ")[0]} · {fmtDate(w.date)}
                  {w.approved && w.approvedBy && ` · Acknowledged by ${db.users.find(u=>u.id===w.approvedBy)?.name?.split(" ")[0]}`}
                </div>
              </div>
              <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div style={{ fontFamily: "var(--font-m)", fontSize: 18, color: "var(--gold-l)", marginBottom: 8 }}>{fmt(w.amount)}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <Btn small variant={w.approved ? "muted" : "primary"} onClick={() => handleApprove(w.id)}>
                    {w.approved ? "Revoke" : "Approve"}
                  </Btn>
                  <Btn small variant="danger" onClick={() => handleDelete(w.id)}>✕</Btn>
                </div>
              </div>
            </div>
          </Card>
        );
      })}

      <Modal open={modal} onClose={() => setModal(false)} title="Welfare Request">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Beneficiary</label>
            <select value={form.beneficiary} onChange={e => setForm(f=>({...f,beneficiary:e.target.value}))}>
              {db.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Type</label>
            <select value={form.type} onChange={e => setForm(f=>({...f,type:e.target.value}))}>
              {WELFARE_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Amount ($)</label>
            <input type="number" placeholder="0.00" value={form.amount} onChange={e => setForm(f=>({...f,amount:e.target.value}))} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Description</label>
            <textarea placeholder="Describe the need and how funds will be used..." value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} style={{ height: 90 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Date</label>
            <input type="date" value={form.date} onChange={e => setForm(f=>({...f,date:e.target.value}))} />
          </div>
          <Btn onClick={handleAdd} disabled={!form.amount || !form.description} style={{ width: "100%", justifyContent: "center" }}>Submit Request</Btn>
        </div>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   WATCHLIST
═══════════════════════════════════════════════════════ */
const Watchlist = ({ db, user, update }) => {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ symbol: "", name: "", sector: "", targetPrice: "", currentPrice: "", notes: "", addedBy: user.id });

  const handleAdd = () => {
    if (!form.symbol || !form.name) return;
    const item = { id: uid(), ...form, targetPrice: Number(form.targetPrice), currentPrice: Number(form.currentPrice), date: now() };
    update(db => ({ ...db, watchlist: [...db.watchlist, item] }));
    setModal(false);
    setForm({ symbol: "", name: "", sector: "", targetPrice: "", currentPrice: "", notes: "", addedBy: user.id });
  };

  const handleDelete = (id) => {
    update(db => ({ ...db, watchlist: db.watchlist.filter(w => w.id !== id) }));
  };

  const handleVote = (id) => {
    update(db => ({
      ...db,
      watchlist: db.watchlist.map(w => w.id !== id ? w : {
        ...w, votes: w.votes?.includes(user.id)
          ? w.votes.filter(v => v !== user.id)
          : [...(w.votes || []), user.id]
      })
    }));
  };

  return (
    <div className="fade-in" style={{ padding: "24px 28px", overflow: "auto", height: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Opportunities</div>
          <h2 style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 600 }}>Watchlist</h2>
        </div>
        <Btn onClick={() => setModal(true)}>+ Add to Watch</Btn>
      </div>

      <div style={{ padding: "12px 16px", background: "rgba(36,113,163,0.1)", borderRadius: 8, border: "1px solid rgba(36,113,163,0.2)", marginBottom: 18, fontSize: 12, color: "var(--cream-d)" }}>
        👁 Track stocks, shares, and assets you're considering. Vote on what the group should invest in next.
      </div>

      {db.watchlist.length === 0 ? (
        <Card style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontFamily: "var(--font-d)", fontSize: 20, color: "var(--sub)" }}>No assets on watch yet</div>
        </Card>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 14 }}>
          {[...db.watchlist].sort((a,b) => (b.votes?.length||0) - (a.votes?.length||0)).map(w => {
            const addedBy = db.users.find(u => u.id === w.addedBy);
            const hasVoted = w.votes?.includes(user.id);
            const potential = w.targetPrice && w.currentPrice ? (((w.targetPrice - w.currentPrice) / w.currentPrice) * 100).toFixed(1) : null;
            return (
              <Card key={w.id}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: "var(--font-m)", fontSize: 20, fontWeight: 700, color: "var(--gold-l)" }}>{w.symbol}</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{w.name}</div>
                    {w.sector && <div style={{ fontSize: 11, color: "var(--sub)" }}>{w.sector}</div>}
                  </div>
                  <button onClick={() => handleDelete(w.id)} style={{ background: "none", color: "rgba(192,57,43,0.4)", cursor: "pointer", fontSize: 16 }}>×</button>
                </div>
                
                {(w.currentPrice || w.targetPrice) && (
                  <div style={{ display: "flex", gap: 12, margin: "10px 0", padding: "8px 10px", background: "rgba(0,0,0,0.2)", borderRadius: 6 }}>
                    {w.currentPrice > 0 && (
                      <div>
                        <div style={{ fontSize: 9, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Current</div>
                        <div style={{ fontFamily: "var(--font-m)", fontSize: 14 }}>${w.currentPrice}</div>
                      </div>
                    )}
                    {w.targetPrice > 0 && (
                      <div>
                        <div style={{ fontSize: 9, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Target</div>
                        <div style={{ fontFamily: "var(--font-m)", fontSize: 14, color: "var(--gold)" }}>${w.targetPrice}</div>
                      </div>
                    )}
                    {potential && (
                      <div>
                        <div style={{ fontSize: 9, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Upside</div>
                        <div style={{ fontFamily: "var(--font-m)", fontSize: 14, color: Number(potential) >= 0 ? "#88CC99" : "#E74C3C" }}>+{potential}%</div>
                      </div>
                    )}
                  </div>
                )}
                
                {w.notes && <div style={{ fontSize: 12, color: "var(--sub)", marginBottom: 10, lineHeight: 1.5 }}>{w.notes}</div>}
                
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "var(--sub)" }}>
                    <Avatar user={addedBy} size={16} /> {addedBy?.name?.split(" ")[0]} · {timeAgo(w.date)}
                  </div>
                  <button onClick={() => handleVote(w.id)} style={{
                    padding: "4px 12px", borderRadius: 20, fontSize: 12, cursor: "pointer",
                    background: hasVoted ? "rgba(200,151,28,0.2)" : "rgba(255,255,255,0.05)",
                    color: hasVoted ? "var(--gold-l)" : "var(--sub)",
                    border: `1px solid ${hasVoted ? "var(--gold)" : "var(--border)"}`,
                  }}>▲ {w.votes?.length || 0} vote{w.votes?.length !== 1 ? "s" : ""}</button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add to Watchlist" width={500}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Ticker / Symbol</label>
              <input placeholder="e.g. AAPL" value={form.symbol} onChange={e => setForm(f=>({...f,symbol:e.target.value.toUpperCase()}))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Company Name</label>
              <input placeholder="e.g. Apple Inc." value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Sector</label>
              <input placeholder="e.g. Technology" value={form.sector} onChange={e => setForm(f=>({...f,sector:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Current Price ($)</label>
              <input type="number" placeholder="0.00" value={form.currentPrice} onChange={e => setForm(f=>({...f,currentPrice:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Target Price ($)</label>
              <input type="number" placeholder="0.00" value={form.targetPrice} onChange={e => setForm(f=>({...f,targetPrice:e.target.value}))} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6 }}>Why are you watching this?</label>
            <textarea placeholder="Research notes, reason for interest..." value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} style={{ height: 80 }} />
          </div>
          <Btn onClick={handleAdd} disabled={!form.symbol || !form.name} style={{ width: "100%", justifyContent: "center" }}>Add to Watchlist</Btn>
        </div>
      </Modal>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   MEMBERS
═══════════════════════════════════════════════════════ */
const Members = ({ db, user, update, setCurrent }) => {
  const [selected, setSelected] = useState(null);

  const getMemberStats = (uid) => ({
    contributions: db.contributions.filter(c => c.userId === uid),
    totalContrib: db.contributions.filter(c => c.userId === uid).reduce((s, c) => s + c.amount, 0),
    investments: db.investments.filter(i => i.addedBy === uid),
    discussions: db.discussions.filter(d => d.userId === uid),
    welfare: db.welfare.filter(w => w.beneficiary === uid),
  });

  if (selected) {
    const m = db.users.find(u => u.id === selected);
    if (!m) return null;
    const stats = getMemberStats(m.id);
    const totalPool = db.contributions.reduce((s,c)=>s+c.amount,0);
    const share = totalPool > 0 ? ((stats.totalContrib / totalPool) * 100).toFixed(1) : 0;

    return (
      <div className="fade-in" style={{ padding: "24px 28px", overflow: "auto", height: "100%" }}>
        <button onClick={() => setSelected(null)} style={{ background: "none", color: "var(--sub)", fontSize: 13, cursor: "pointer", marginBottom: 18, display: "flex", alignItems: "center", gap: 6 }}>← All Members</button>
        
        {/* Profile header */}
        <div style={{ position: "relative", marginBottom: 24 }}>
          <div style={{ height: 120, borderRadius: 14, background: `linear-gradient(135deg, ${m.color}33, ${m.color}11)`, border: "1px solid var(--border)", marginBottom: -40, overflow: "hidden" }}>
            <div className="geo-pattern" style={{ width: "100%", height: "100%" }} />
          </div>
          <div style={{ padding: "0 24px", display: "flex", alignItems: "flex-end", gap: 16 }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg,${m.color},${m.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-d)", fontSize: 28, fontWeight: 700, color: "#fff", border: "3px solid var(--black)", flexShrink: 0 }}>{m.initials}</div>
            <div style={{ paddingBottom: 8 }}>
              <div style={{ fontFamily: "var(--font-d)", fontSize: 26, fontWeight: 700 }}>{m.name}</div>
              <div style={{ fontSize: 12, color: "var(--sub)" }}>@{m.id} · Member since {fmtDate(m.joinedDate)}</div>
            </div>
          </div>
        </div>

        {m.bio && <p style={{ fontSize: 14, color: "var(--cream-d)", marginBottom: 20, lineHeight: 1.6, maxWidth: 500 }}>{m.bio}</p>}

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
          <Stat label="Total Contributed" value={fmt(stats.totalContrib)} sub={`${share}% of pool`} accent={m.color} />
          <Stat label="Payments Made" value={stats.contributions.length} sub="contributions" accent="var(--cream)" />
          <Stat label="Discussions" value={stats.discussions.length} accent="var(--sub)" />
          <Stat label="Investments Added" value={stats.investments.length} accent="var(--sub)" />
        </div>

        {/* Recent contributions */}
        <Card style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 14 }}>Recent Contributions</div>
          {stats.contributions.slice(0,5).map(c => (
            <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div style={{ fontSize: 12 }}>{fmtDate(c.date)}{c.note ? ` — ${c.note}` : ""}</div>
              <div style={{ fontFamily: "var(--font-m)", color: "var(--gold-l)", fontSize: 13 }}>+{fmt(c.amount)}</div>
            </div>
          ))}
          {stats.contributions.length === 0 && <div style={{ color: "var(--sub)", fontSize: 13 }}>No contributions yet.</div>}
        </Card>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: "24px 28px", overflow: "auto", height: "100%" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.15em", textTransform: "uppercase" }}>AMB Brotherhood</div>
        <h2 style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 600 }}>Members</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
        {db.users.map((m, i) => {
          const stats = getMemberStats(m.id);
          const totalPool = db.contributions.reduce((s,c)=>s+c.amount,0);
          const share = totalPool > 0 ? ((stats.totalContrib / totalPool) * 100).toFixed(1) : 33;
          const week = thisWeek();
          const paidThisWeek = db.contributions.some(c => c.userId === m.id && c.date >= week.start && c.date <= week.end);

          return (
            <div key={m.id} onClick={() => setSelected(m.id)} className="slide-up" style={{ cursor: "pointer", animationDelay: `${i*0.1}s` }}>
              <Card style={{ transition: "border-color 0.2s", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 0 0 80px", background: `${m.color}11` }} />
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
                  <Avatar user={m} size={56} ring />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-d)", fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{m.name}</div>
                    <div style={{ fontSize: 11, color: "var(--sub)", marginBottom: 6 }}>@{m.id}</div>
                    {paidThisWeek ? <Badge color="#1D8A4A">✓ Paid this week</Badge> : <Badge color="#C0392B">Unpaid this week</Badge>}
                  </div>
                </div>
                {m.bio && <div style={{ fontSize: 12, color: "var(--sub)", marginBottom: 12, lineHeight: 1.5 }}>{m.bio}</div>}
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--sub)" }}>Contributed</div>
                    <div style={{ fontFamily: "var(--font-m)", fontSize: 16, color: "var(--gold-l)" }}>{fmt(stats.totalContrib)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--sub)" }}>Pool Share</div>
                    <div style={{ fontFamily: "var(--font-m)", fontSize: 16 }}>{share}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: "var(--sub)" }}>Posts</div>
                    <div style={{ fontFamily: "var(--font-m)", fontSize: 16 }}>{stats.discussions.length}</div>
                  </div>
                </div>
                <div style={{ marginTop: 12, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${share}%`, background: m.color, borderRadius: 2 }} />
                </div>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   PROFILE
═══════════════════════════════════════════════════════ */
const Profile = ({ db, user, update }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ bio: user.bio || "", name: user.name });
  const [pwForm, setPwForm] = useState({ current: "", next: "", confirm: "" });
  const [pwMsg, setPwMsg] = useState("");

  const handleSave = () => {
    update(db => ({
      ...db,
      users: db.users.map(u => u.id !== user.id ? u : {
        ...u, bio: form.bio, name: form.name,
        initials: form.name.split(" ").map(w=>w[0]).slice(0,2).join("").toUpperCase()
      })
    }));
    setEditing(false);
  };

  const handlePassword = () => {
    if (db.passwords[user.id] !== pwForm.current) { setPwMsg("Current password incorrect."); return; }
    if (pwForm.next !== pwForm.confirm) { setPwMsg("Passwords don't match."); return; }
    if (pwForm.next.length < 6) { setPwMsg("Password too short (min 6)."); return; }
    update(db => ({ ...db, passwords: { ...db.passwords, [user.id]: pwForm.next } }));
    setPwMsg("Password updated! ✓");
    setPwForm({ current: "", next: "", confirm: "" });
  };

  const stats = {
    totalContrib: db.contributions.filter(c => c.userId === user.id).reduce((s,c) => s+c.amount, 0),
    payments: db.contributions.filter(c => c.userId === user.id).length,
    discussions: db.discussions.filter(d => d.userId === user.id).length,
    replies: db.replies.filter(r => r.userId === user.id).length,
  };

  return (
    <div className="fade-in" style={{ padding: "24px 28px", overflow: "auto", height: "100%" }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontSize: 11, color: "var(--sub)", letterSpacing: "0.15em", textTransform: "uppercase" }}>Your Account</div>
        <h2 style={{ fontFamily: "var(--font-d)", fontSize: 30, fontWeight: 600 }}>My Profile</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
        {/* Identity */}
        <Card style={{ gridColumn: "1/-1" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 20 }}>
            <div style={{ position: "relative" }}>
              <Avatar user={user} size={80} ring />
              <div style={{ position: "absolute", bottom: 0, right: 0, width: 22, height: 22, borderRadius: "50%", background: user.color, border: "2px solid var(--black)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10 }}>✓</div>
            </div>
            <div style={{ flex: 1 }}>
              {editing ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} placeholder="Full name" />
                  <textarea value={form.bio} onChange={e => setForm(f=>({...f,bio:e.target.value}))} placeholder="Write something about yourself..." style={{ height: 80 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn onClick={handleSave}>Save Changes</Btn>
                    <Btn variant="ghost" onClick={() => setEditing(false)}>Cancel</Btn>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily: "var(--font-d)", fontSize: 26, fontWeight: 700 }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: "var(--sub)", marginBottom: 8 }}>@{user.id} · Member since {fmtDate(user.joinedDate)}</div>
                  <div style={{ fontSize: 14, color: "var(--cream-d)", lineHeight: 1.6, marginBottom: 12 }}>{user.bio || <span style={{ color: "var(--sub)" }}>No bio yet.</span>}</div>
                  <Btn small variant="ghost" onClick={() => setEditing(true)}>Edit Profile</Btn>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Stats */}
        <Stat label="Total Contributed" value={fmt(stats.totalContrib)} />
        <Stat label="Payments Made" value={stats.payments} />
        <Stat label="Discussions Started" value={stats.discussions} accent="var(--sub)" />
        <Stat label="Replies Written" value={stats.replies} accent="var(--sub)" />

        {/* Password */}
        <Card style={{ gridColumn: "1/-1" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sub)", marginBottom: 16 }}>Change Password</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", display: "block", marginBottom: 5 }}>Current</label>
              <input type="password" value={pwForm.current} onChange={e => setPwForm(f=>({...f,current:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", display: "block", marginBottom: 5 }}>New Password</label>
              <input type="password" value={pwForm.next} onChange={e => setPwForm(f=>({...f,next:e.target.value}))} />
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--sub)", display: "block", marginBottom: 5 }}>Confirm New</label>
              <input type="password" value={pwForm.confirm} onChange={e => setPwForm(f=>({...f,confirm:e.target.value}))} />
            </div>
          </div>
          {pwMsg && <div style={{ fontSize: 12, marginBottom: 10, color: pwMsg.includes("✓") ? "#88CC99" : "#E74C3C" }}>{pwMsg}</div>}
          <Btn small onClick={handlePassword}>Update Password</Btn>
        </Card>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   APP ROOT
═══════════════════════════════════════════════════════ */
export default function App() {
  const [db, setDb] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDB().then(data => { setDb(data); setLoading(false); });
  }, []);

  const update = useCallback((fn) => {
    setDb(prev => {
      const next = fn(prev);
      saveDB(next);
      return next;
    });
  }, []);

  const handleLogin = (user, newUserData) => {
    if (newUserData) {
      update(db => ({
        ...db,
        users: [...db.users, user],
        passwords: { ...db.passwords, [user.id]: newUserData.password }
      }));
    }
    setCurrentUser(user);
  };

  const handleLogout = () => setCurrentUser(null);

  // Keep currentUser in sync with db
  const liveUser = currentUser && db ? (db.users.find(u => u.id === currentUser.id) || currentUser) : currentUser;

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--black)", flexDirection: "column", gap: 16 }}>
      <FontLoader />
      <div style={{ fontFamily: "var(--font-d)", fontSize: 22, color: "var(--gold)", animation: "pulse 1.5s ease infinite" }}>AMB Collective</div>
      <div style={{ width: 40, height: 40, border: "2px solid var(--border)", borderTopColor: "var(--gold)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!currentUser) return (
    <><FontLoader /><AuthScreen db={db} onLogin={handleLogin} /></>
  );

  const pages = { dashboard: Dashboard, contributions: Contributions, investments: Investments, discussions: Discussions, welfare: Welfare, watchlist: Watchlist, members: Members, profile: Profile };
  const PageComponent = pages[page] || Dashboard;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <FontLoader />
      <Sidebar current={page} setCurrent={setPage} user={liveUser} onLogout={handleLogout} db={db} />
      <main style={{ flex: 1, overflow: "auto", background: "radial-gradient(ellipse 100% 60% at 70% 0%, #0E1F14 0%, var(--black) 100%)", position: "relative" }}>
        <div className="geo-pattern" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.4 }} />
        <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
          <PageComponent db={db} user={liveUser} update={update} setCurrent={setPage} />
        </div>
      </main>
    </div>
  );
}
