import { useEffect, useState, type FormEvent } from "react";
import {
  Activity, Award, BarChart3, Bell, ChevronRight, CircleUserRound,
  Gamepad2, Gift, LayoutDashboard, Menu, ShieldCheck, Trophy, Wallet, X
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

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


function AccountPanel() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName.trim() || email.split("@")[0] } }
        });
        if (error) throw error;
        setMessage(data.session ? "Account created. Your player profile is ready." : "Registration received. Check your email to confirm your account.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage("Signed in successfully.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Account request failed.");
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    setMessage(error ? error.message : "Signed out.");
  }

  return (
    <section className="panel account-panel">
      <div className="panel-heading">
        <div><span className="panel-kicker">PLAYER ACCOUNT</span><h2>{session ? "Your account" : "Create your player account"}</h2></div>
        <CircleUserRound size={21} />
      </div>
      {!isSupabaseConfigured ? (
        <p className="account-message">Account services are unavailable until Supabase environment variables are configured.</p>
      ) : session ? (
        <div className="account-signed-in">
          <div><strong>{session.user.user_metadata?.display_name || session.user.email}</strong><p>{session.user.email}</p><small>Your player profile is linked to this account.</small></div>
          <button className="account-submit" onClick={signOut}>SIGN OUT</button>
        </div>
      ) : (
        <form className="account-form" onSubmit={submit}>
          {mode === "signup" && <label>PLAYER NAME<input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Choose a display name" maxLength={40} /></label>}
          <label>EMAIL ADDRESS<input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
          <label>PASSWORD<input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete={mode === "signup" ? "new-password" : "current-password"} /></label>
          <div className="account-actions">
            <button className="account-submit" type="submit" disabled={busy}>{busy ? "PLEASE WAIT..." : mode === "signup" ? "CREATE ACCOUNT" : "SIGN IN"}</button>
            <button className="account-switch" type="button" onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setMessage(""); }}>{mode === "signup" ? "Already registered? Sign in" : "Need an account? Register"}</button>
          </div>
          {message && <p className="account-message" role="status">{message}</p>}
          <small className="account-footnote">Player profiles are created automatically after registration. Console linking and rewards remain disabled.</small>
        </form>
      )}
    </section>
  );
}

export default function App() {
  const [active, setActive] = useState("Dashboard");
  const [menuOpen, setMenuOpen] = useState(false);
  const [playerData, setPlayerData] = useState({
    signedIn: false,
    displayName: "PLAYER PROFILE",
    xp: 0,
    rewardCredits: 0,
    consoles: 0,
    achievements: 0,
    sessions: 0
  });

  useEffect(() => {
    if (!supabase) return;

    async function loadPlayer(user: any) {
      if (!user) {
        setPlayerData({
          signedIn: false, displayName: "PLAYER PROFILE",
          xp: 0, rewardCredits: 0, consoles: 0, achievements: 0, sessions: 0
        });
        return;
      }

      const [profile, xpWallet, rewardWallet, accounts, achievements, sessions] = await Promise.all([
        supabase!.from("gaming_profiles").select("display_name, gamertag").eq("user_id", user.id).maybeSingle(),
        supabase!.from("xp_wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase!.from("reward_wallets").select("balance").eq("user_id", user.id).maybeSingle(),
        supabase!.from("linked_accounts").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("connection_status", "active"),
        supabase!.from("member_achievements").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("verification_status", "verified"),
        supabase!.from("gaming_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("verification_status", "verified")
      ]);

      setPlayerData({
        signedIn: true,
        displayName: profile.data?.display_name || profile.data?.gamertag || user.user_metadata?.display_name || user.email || "PLAYER",
        xp: Number(xpWallet.data?.balance || 0),
        rewardCredits: Number(rewardWallet.data?.balance || 0),
        consoles: accounts.count || 0,
        achievements: achievements.count || 0,
        sessions: sessions.count || 0
      });
    }

    supabase.auth.getSession().then(({ data }) => loadPlayer(data.session?.user));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => { void loadPlayer(session?.user); }, 0);
    });
    return () => data.subscription.unsubscribe();
  }, []);

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
            <div className="player-chip"><div className="avatar">PT</div><div><strong>{playerData.displayName}</strong><span>{playerData.signedIn ? "ACCOUNT CONNECTED" : "Not connected"}</span></div></div>
          </div>

          <div className="notice">
            <ShieldCheck size={20} />
            <div><strong>Foundation mode — integrations are disabled</strong>
              <p>No console accounts, adverts or reward transactions are connected. This preview uses demonstration data only.</p></div>
          </div>

          <AccountPanel />\n\n          <div className="stat-grid">
            <article className="stat-card"><div className="stat-icon"><Trophy /></div><span>GAMING XP</span><strong>{playerData.xp.toLocaleString()} <small>XP</small></strong><p>Progression points only</p></article>
            <article className="stat-card"><div className="stat-icon"><Wallet /></div><span>REWARD CREDITS</span><strong>{playerData.rewardCredits.toLocaleString()} <small>RC</small></strong><p>Funded, redeemable balance</p></article>
            <article className="stat-card"><div className="stat-icon"><Gamepad2 /></div><span>LINKED CONSOLES</span><strong>{playerData.consoles}</strong><p>Active connections</p></article>
            <article className="stat-card"><div className="stat-icon"><Award /></div><span>ACHIEVEMENTS</span><strong>{playerData.achievements}</strong><p>Verified unlocks</p></article>
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