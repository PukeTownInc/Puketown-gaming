import { useState } from "react";
import {
  Activity, Award, BarChart3, Bell, ChevronRight, CircleUserRound,
  Gamepad2, Gift, LayoutDashboard, Menu, ShieldCheck, Trophy, Wallet, X
} from "lucide-react";
import { isSupabaseConfigured } from "./lib/supabase";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "My consoles", icon: Gamepad2 },
  { label: "Gaming activity", icon: Activity },
  { label: "Achievements", icon: Award },
  { label: "Leaderboards", icon: Trophy },
  { label: "Challenges", icon: BarChart3 },
  { label: "Wallet", icon: Wallet },
  { label: "Rewards shop", icon: Gift }
];

export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">PT</div>
          <div><strong>PUKE TOWN</strong><span>GAMING NETWORK</span></div>
          <button className="icon-button mobile-close" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={19} /></button>
        </div>
        <div className="nav-label">COMMAND CENTRE</div>
        <nav>
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${active === label ? "active" : ""}`}
              onClick={() => { setActive(label); setMenuOpen(false); }}>
              <Icon size={18} /><span>{label}</span>{active === label && <ChevronRight size={15} />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="status-dot" /> FOUNDATION BUILD <span>v0.1</span>
        </div>
      </aside>

      {menuOpen && <button className="scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}
      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu /></button>
          <div className="breadcrumb">PUKE TOWN <span>/</span> {active.toUpperCase()}</div>
          <div className="top-actions"><span className="build-tag">MILESTONE 1</span><button className="icon-button" aria-label="Notifications"><Bell size={18} /></button><CircleUserRound size={23} /></div>
        </header>

        <section className="page-content">
          <div className="eyebrow"><span className="eyebrow-line" /> GAMING REWARDS PLATFORM</div>
          <div className="page-heading">
            <div><h1>{active === "Dashboard" ? "Your gaming command centre." : active}</h1>
              <p>Track progress. Complete challenges. Build your player profile.</p></div>
            <div className="player-chip"><div className="avatar">PT</div><div><strong>PLAYER PROFILE</strong><span>Not connected</span></div></div>
          </div>

          <div className="notice">
            <ShieldCheck size={20} />
            <div><strong>Foundation mode — integrations are disabled</strong>
              <p>No console accounts, adverts or reward transactions are connected. This preview uses demonstration data only.</p></div>
          </div>

          <div className="stat-grid">
            <article className="stat-card"><div className="stat-icon"><Trophy /></div><span>GAMING XP</span><strong>0 <small>XP</small></strong><p>Progression points only</p></article>
            <article className="stat-card"><div className="stat-icon"><Wallet /></div><span>REWARD CREDITS</span><strong>0 <small>RC</small></strong><p>Redeemable balance</p></article>
            <article className="stat-card"><div className="stat-icon"><Gamepad2 /></div><span>LINKED CONSOLES</span><strong>0</strong><p>Connections not enabled</p></article>
            <article className="stat-card"><div className="stat-icon"><Award /></div><span>ACHIEVEMENTS</span><strong>0</strong><p>Verified unlocks</p></article>
          </div>

          <div className="content-grid">
            <section className="panel">
              <div className="panel-heading"><div><span className="panel-kicker">PLAYER OVERVIEW</span><h2>{active === "Dashboard" ? "Getting started" : active + " overview"}</h2></div><span className="live-label"><i /> PREVIEW</span></div>
              <div className="empty-state"><div className="empty-icon"><Gamepad2 size={27} /></div><h3>Your player hub is ready to build</h3>
                <p>Console linking, activity sync and achievement verification will be added only after provider access and commercial permissions are confirmed.</p>
                <div className="empty-progress"><span /><span /><span /></div><small>ACCOUNT SETUP · PROVIDER APPROVAL · VERIFIED DATA</small></div>
            </section>
            <section className="panel rewards-panel">
              <div className="panel-heading"><div><span className="panel-kicker">REWARDS ECONOMY</span><h2>Two separate balances</h2></div><Gift size={20} /></div>
              <div className="balance-row"><div className="balance-symbol xp">XP</div><div><strong>Gaming XP</strong><p>Levels, ranks and progression</p></div><span>NON-REDEEMABLE</span></div>
              <div className="balance-row"><div className="balance-symbol rc">RC</div><div><strong>Reward Credits</strong><p>Issued only against cleared, approved revenue</p></div><span>FUNDING-GATED</span></div>
              <div className="economy-note">Reward issuance remains switched off until funding, fraud controls and provider terms are approved.</div>
            </section>
          </div>
          <footer><span>PUKE TOWN GAMING</span><span>BUILT FOR PLAYERS · DESIGNED WITH CONTROL</span><span>{isSupabaseConfigured ? "BACKEND CONFIGURED" : "DEMO MODE"}</span></footer>
        </section>
      </main>
    </div>
  );
}