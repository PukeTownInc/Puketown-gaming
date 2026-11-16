import { useEffect, useRef, useState, type FormEvent } from "react";
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


function GamingActivityPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadActivity() {
      setLoading(true);
      setError("");
      if (!supabase) {
        if (active) { setSignedIn(false); setRows([]); setLoading(false); }
        return;
      }
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (!active) return;
      if (authError) {
        setError("Could not check your account session. Please refresh and try again.");
        setRows([]);
        setLoading(false);
        return;
      }
      const user = authData.session?.user;
      setSignedIn(Boolean(user));
      if (!user) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data, error: queryError } = await supabase
        .from("gaming_sessions")
        .select("id, started_at, ended_at, duration_seconds, verification_status, games(title, provider), linked_accounts(provider, display_name)")
        .eq("user_id", user.id)
        .order("started_at", { ascending: false, nullsFirst: false })
        .limit(50);
      if (!active) return;
      if (queryError) {
        setError("Activity could not be loaded. Only your own session records are accessible.");
        setRows([]);
      } else {
        setRows(data || []);
      }
      setLoading(false);
    }
    void loadActivity();
    return () => { active = false; };
  }, []);

  function formatDate(value?: string | null) {
    if (!value) return "Time not recorded";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Time unavailable" : date.toLocaleString();
  }

  function formatDuration(value?: number | null) {
    if (value === null || value === undefined) return "Duration not recorded";
    const minutes = Math.floor(value / 60);
    if (minutes < 60) return `${minutes} min recorded`;
    return `${Math.floor(minutes / 60)} hr ${minutes % 60} min recorded`;
  }

  return (
    <section className="activity-hub">
      <div className="activity-intro">
        <span className="panel-kicker">PLAYER SESSION HISTORY</span>
        <h2>Your gaming activity.</h2>
        <p>Sessions appear here only when a supported source records them. Verification status is shown separately; an unverified record is not proof of playtime or reward eligibility.</p>
      </div>
      <div className="activity-summary">
        <article className="panel activity-stat"><span>RECORDED SESSIONS</span><strong>{rows.length}</strong><small>Latest 50 records</small></article>
        <article className="panel activity-stat"><span>VERIFIED SESSIONS</span><strong>{rows.filter(row => row.verification_status === "verified").length}</strong><small>Provider-verified only</small></article>
        <article className="panel activity-stat"><span>CONNECTED SOURCES</span><strong>0</strong><small>Integrations not enabled</small></article>
      </div>
      <section className="panel activity-list">
        <div className="panel-heading"><div><span className="panel-kicker">RECENT HISTORY</span><h2>Session records</h2></div><Activity size={20} /></div>
        {loading ? <div className="activity-empty">Loading your session history…</div>
          : error ? <div className="activity-empty" role="status">{error}</div>
          : !signedIn ? <div className="activity-empty"><h3>Sign in to view your activity</h3><p>Your private session history will appear here after you sign in.</p></div>
          : rows.length === 0 ? <div className="activity-empty"><div className="empty-icon"><Gamepad2 size={25} /></div><h3>No gaming sessions recorded yet</h3><p>Your history is currently empty. Console and Steam integrations are not connected, so no playtime is being collected.</p></div>
          : <div className="activity-records">{rows.map(row => {
              const game = Array.isArray(row.games) ? row.games[0] : row.games;
              const account = Array.isArray(row.linked_accounts) ? row.linked_accounts[0] : row.linked_accounts;
              return <article className="activity-record" key={row.id}>
                <div className="activity-record-main"><strong>{game?.title || "Game not identified"}</strong><span>{account?.display_name || account?.provider || game?.provider || "Platform not recorded"}</span><small>{formatDate(row.started_at)}</small></div>
                <div className="activity-record-meta"><span>{formatDuration(row.duration_seconds)}</span><span className={`verification-tag ${row.verification_status}`}>{row.verification_status || "unverified"}</span></div>
              </article>;
            })}</div>}
      </section>
    </section>
  );
}

function AchievementsPanel() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    async function loadAchievements() {
      if (!supabase) {
        if (active) { setSignedIn(false); setRows([]); setLoading(false); }
        return;
      }
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (!active) return;
      if (authError) {
        setError("Could not check your account session. Please refresh and try again.");
        setLoading(false);
        return;
      }
      const user = authData.session?.user;
      setSignedIn(Boolean(user));
      if (!user) {
        setRows([]);
        setLoading(false);
        return;
      }
      const { data, error: queryError } = await supabase
        .from("achievements")
        .select("id, provider_achievement_id, title, description, points, games(title, provider), member_achievements(id, unlocked_at, verification_status)")
        .order("title", { ascending: true })
        .limit(250);
      if (!active) return;
      if (queryError) {
        setError("The achievement catalogue could not be loaded. Please try again later.");
        setRows([]);
      } else {
        setRows(data || []);
      }
      setLoading(false);
    }
    void loadAchievements();
    return () => { active = false; };
  }, []);

  const catalogue = rows.map(row => {
    const game = Array.isArray(row.games) ? row.games[0] : row.games;
    const unlocks = Array.isArray(row.member_achievements) ? row.member_achievements : [];
    return { ...row, game, unlock: unlocks[0] || null };
  });
  const unlocked = catalogue.filter(row => row.unlock);
  const verified = unlocked.filter(row => row.unlock?.verification_status === "verified");
  const visible = catalogue.filter(row => {
    const matchesFilter = filter === "all" ||
      (filter === "unlocked" && Boolean(row.unlock)) ||
      (filter === "locked" && !row.unlock) ||
      (filter === "verified" && row.unlock?.verification_status === "verified");
    const haystack = `${row.title} ${row.description || ""} ${row.game?.title || ""} ${row.game?.provider || ""}`.toLowerCase();
    return matchesFilter && haystack.includes(search.toLowerCase().trim());
  });

  return (
    <section className="achievement-hub">
      <div className="achievement-intro">
        <span className="panel-kicker">PLAYER PROGRESSION</span>
        <h2>Achievements & unlocks.</h2>
        <p>Browse the achievement catalogue and see your unlock records. An unlock is only marked verified when its recorded verification status is verified.</p>
      </div>
      <div className="achievement-summary">
        <article className="panel achievement-stat"><span>CATALOGUE</span><strong>{catalogue.length}</strong><small>Available achievement records</small></article>
        <article className="panel achievement-stat"><span>UNLOCKED</span><strong>{unlocked.length}</strong><small>Your recorded unlocks</small></article>
        <article className="panel achievement-stat"><span>VERIFIED</span><strong>{verified.length}</strong><small>Provider-verified unlocks</small></article>
      </div>
      <section className="panel achievement-library">
        <div className="panel-heading"><div><span className="panel-kicker">ACHIEVEMENT LIBRARY</span><h2>Browse achievements</h2></div><Award size={20} /></div>
        <div className="achievement-controls">
          <input aria-label="Search achievements" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search games or achievements…" />
          <select aria-label="Filter achievements" value={filter} onChange={event => setFilter(event.target.value)}>
            <option value="all">All achievements</option>
            <option value="unlocked">My unlocks</option>
            <option value="verified">Verified unlocks</option>
            <option value="locked">Not yet unlocked</option>
          </select>
        </div>
        {loading ? <div className="achievement-empty">Loading achievement catalogue…</div>
          : error ? <div className="achievement-empty" role="status">{error}</div>
          : !signedIn ? <div className="achievement-empty"><h3>Sign in to view your achievements</h3><p>Your personal unlock history is private to your account.</p></div>
          : catalogue.length === 0 ? <div className="achievement-empty"><div className="empty-icon"><Award size={25} /></div><h3>The achievement library is ready for data</h3><p>No game or achievement catalogue records have been added yet. Once supported provider data is available, games and their achievements will appear here. No sample unlocks have been invented.</p></div>
          : visible.length === 0 ? <div className="achievement-empty"><h3>No matching achievements</h3><p>Try another search or change the filter.</p></div>
          : <div className="achievement-grid">{visible.map(row => (
              <article className={`achievement-card ${row.unlock ? "is-unlocked" : ""}`} key={row.id}>
                <div className="achievement-card-top"><span className="achievement-medal"><Award size={21} /></span><span className={`verification-tag ${row.unlock?.verification_status || "locked"}`}>{row.unlock?.verification_status || "locked"}</span></div>
                <h3>{row.title}</h3>
                <p>{row.description || "No description supplied by the game catalogue."}</p>
                <div className="achievement-card-foot"><span>{row.game?.title || "Game not specified"}{row.game?.provider ? ` · ${row.game.provider}` : ""}</span><strong>{row.points ?? 0} PTS</strong></div>
                {row.unlock?.unlocked_at && <small className="achievement-date">Unlocked {new Date(row.unlock.unlocked_at).toLocaleDateString()}</small>}
              </article>
            ))}</div>}
      </section>
    </section>
  );
}

function LeaderboardsPanel() {
  const [ranking, setRanking] = useState("xp");
  const [period, setPeriod] = useState("all-time");

  return (
    <section className="leaderboard-hub">
      <div className="leaderboard-intro">
        <span className="panel-kicker">COMMUNITY RANKINGS</span>
        <h2>Compete on verified progress.</h2>
        <p>Leaderboards will rank players using recorded XP and provider-verified achievements. Only eligible, verified activity will count towards competitive standings.</p>
      </div>
      <div className="leaderboard-controls">
        <div className="leaderboard-tabs" role="group" aria-label="Leaderboard category">
          <button type="button" className={ranking === "xp" ? "selected" : ""} onClick={() => setRanking("xp")}>GAMING XP</button>
          <button type="button" className={ranking === "achievements" ? "selected" : ""} onClick={() => setRanking("achievements")}>VERIFIED ACHIEVEMENTS</button>
        </div>
        <select aria-label="Leaderboard period" value={period} onChange={event => setPeriod(event.target.value)}>
          <option value="all-time">All time</option>
          <option value="monthly">This month</option>
          <option value="weekly">This week</option>
        </select>
      </div>
      <div className="leaderboard-summary">
        <article className="panel leaderboard-stat"><span>YOUR POSITION</span><strong>—</strong><small>Not ranked yet</small></article>
        <article className="panel leaderboard-stat"><span>RANKING CATEGORY</span><strong>{ranking === "xp" ? "XP" : "ACH"}</strong><small>{ranking === "xp" ? "Earned gaming experience" : "Verified achievement unlocks"}</small></article>
        <article className="panel leaderboard-stat"><span>TIME PERIOD</span><strong>{period === "all-time" ? "ALL" : period === "monthly" ? "30D" : "7D"}</strong><small>{period === "all-time" ? "All-time standings" : period === "monthly" ? "Monthly standings" : "Weekly standings"}</small></article>
      </div>
      <section className="panel leaderboard-table">
        <div className="panel-heading"><div><span className="panel-kicker">PLAYER STANDINGS</span><h2>{ranking === "xp" ? "XP leaderboard" : "Achievement leaderboard"}</h2></div><Trophy size={20} /></div>
        <div className="leaderboard-columns"><span>RANK / PLAYER</span><span>{ranking === "xp" ? "GAMING XP" : "VERIFIED UNLOCKS"}</span></div>
        <div className="leaderboard-empty">
          <div className="empty-icon"><Trophy size={25} /></div>
          <h3>Standings are not live yet</h3>
          <p>There are no public rankings to display. Leaderboards will go live after player visibility and opt-in rules are in place, and verified XP and achievement data can be served through a privacy-safe ranking service.</p>
        </div>
      </section>
      <div className="panel leaderboard-note">
        <ShieldCheck size={20} />
        <div><strong>Fair-play ranking rules</strong><p>Unverified achievements, manually entered playtime and pending reward activity will not count. Player identity will not be exposed publicly without an appropriate visibility choice.</p></div>
      </div>
    </section>
  );
}

function AccountPanel() {
  const [session, setSession] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [gamertag, setGamertag] = useState("");
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [busy, setBusy] = useState(false);
  const [profileBusy, setProfileBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [profileMessage, setProfileMessage] = useState("");

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !session?.user) {
      setDisplayName("");
      setGamertag("");
      return;
    }
    let active = true;
    supabase.from("gaming_profiles").select("display_name, gamertag")
      .eq("user_id", session.user.id).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setProfileMessage("Could not load your player profile. Please refresh and try again.");
          return;
        }
        setDisplayName(data?.display_name || session.user.user_metadata?.display_name || "");
        setGamertag(data?.gamertag || "");
      });
    return () => { active = false; };
  }, [session]);

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

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !session?.user) return;
    const cleanName = displayName.trim();
    const cleanGamertag = gamertag.trim();
    if (!cleanName) {
      setProfileMessage("Enter a player name before saving.");
      return;
    }
    setProfileBusy(true);
    setProfileMessage("");
    try {
      const { error } = await supabase.from("gaming_profiles")
        .update({ display_name: cleanName, gamertag: cleanGamertag || null })
        .eq("user_id", session.user.id);
      if (error) throw error;
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { display_name: cleanName }
      });
      if (metadataError) throw metadataError;
      setProfileMessage("Player profile saved.");
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Could not save your profile.");
    } finally {
      setProfileBusy(false);
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
        <div><span className="panel-kicker">PLAYER ACCOUNT</span><h2>{session ? "Profile & account settings" : "Create your player account"}</h2></div>
        <CircleUserRound size={21} />
      </div>
      {!isSupabaseConfigured ? (
        <p className="account-message">Account services are unavailable until Supabase environment variables are configured.</p>
      ) : session ? (
        <div className="profile-settings">
          <form className="profile-form" onSubmit={saveProfile}>
            <label>PLAYER NAME<input value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your display name" maxLength={40} required /></label>
            <label>GAMERTAG <span className="optional-label">OPTIONAL</span><input value={gamertag} onChange={e => setGamertag(e.target.value)} placeholder="Your console gamertag" maxLength={40} /></label>
            <label>ACCOUNT EMAIL<input value={session.user.email || ""} readOnly aria-readonly="true" /></label>
            <div className="profile-actions">
              <button className="account-submit" type="submit" disabled={profileBusy}>{profileBusy ? "SAVING..." : "SAVE PROFILE"}</button>
              <button className="account-switch" type="button" onClick={signOut}>SIGN OUT</button>
            </div>
            {profileMessage && <p className="account-message profile-feedback" role="status">{profileMessage}</p>}
          </form>
          <small className="account-footnote">Your email is read-only here. Console connections and reward features remain disabled.</small>
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

function TownWorld({ onEnter, playerName }: { onEnter: (page: string) => void; playerName: string }) {
  const places = [
    { name: "Esports Arena", page: "Leaderboards", x: 11.5, y: 37.5, w: 18, h: 22 },
    { name: "Games Arena", page: "My consoles", x: 27, y: 35, w: 14, h: 19 },
    { name: "Player HQ", page: "Dashboard", x: 43, y: 28, w: 14, h: 20 },
    { name: "Earn Hub", page: "Rewards shop", x: 62, y: 34, w: 14, h: 20 },
    { name: "Marketplace", page: "Rewards shop", x: 82, y: 34, w: 16, h: 20 },
    { name: "The Docks", page: "My consoles", x: 10, y: 54, w: 10, h: 15 },
    { name: "AI Lab", page: "Challenges", x: 23, y: 51, w: 15, h: 17 },
    { name: "The Vault", page: "Wallet", x: 68, y: 51, w: 13, h: 18 },
    { name: "Leaderboards", page: "Leaderboards", x: 82, y: 56, w: 16, h: 15 },
    { name: "Profile", page: "Profile", x: 3, y: 85, w: 11, h: 12 },
    { name: "My Consoles", page: "My consoles", x: 14, y: 85, w: 11, h: 12 },
    { name: "Activity", page: "Gaming activity", x: 25, y: 85, w: 11, h: 12 },
    { name: "Achievements", page: "Achievements", x: 36, y: 85, w: 11, h: 12 },
    { name: "Explore Puke Town", page: "Dashboard", x: 43, y: 82, w: 14, h: 16 },
    { name: "Wallet", page: "Wallet", x: 57, y: 85, w: 11, h: 12 },
    { name: "Inventory", page: "Rewards shop", x: 68, y: 85, w: 11, h: 12 },
    { name: "Clans", page: "Challenges", x: 79, y: 85, w: 10, h: 12 },
    { name: "Settings", page: "Profile", x: 89, y: 85, w: 9, h: 12 }
  ];
  const topNav = [
    { name: "Home", page: "Dashboard", x: 2, w: 12 },
    { name: "Games Arena", page: "My consoles", x: 14, w: 13 },
    { name: "Challenges", page: "Challenges", x: 27, w: 13 },
    { name: "Leaderboards", page: "Leaderboards", x: 40, w: 13 },
    { name: "Rewards", page: "Rewards shop", x: 53, w: 12 },
    { name: "Marketplace", page: "Rewards shop", x: 65, w: 14 },
    { name: "AI Lab", page: "Challenges", x: 79, w: 10 },
    { name: "Esports", page: "Leaderboards", x: 89, w: 10 }
  ];
  return (
    <section className="world-screen artwork-world" aria-label="Puke Town interactive home">
      <div className="artwork-frame">
        <img className="town-artwork" src="/images/puketown-neon-hub.png" alt="Puke Town Gaming neon city hub with gaming districts and navigation" />
        <div className="artwork-hotspots" aria-label="Town navigation">
          {topNav.map(item => <button key={item.name} className="artwork-hotspot top-nav-hotspot" style={{ left: item.x + "%", width: item.w + "%" }} type="button" aria-label={"Open " + item.name} onClick={() => onEnter(item.page)} />)}
          {places.map(item => <button key={item.name} className="artwork-hotspot" style={{ left: item.x + "%", top: item.y + "%", width: item.w + "%", height: item.h + "%" }} type="button" aria-label={"Open " + item.name} title={item.name} onClick={() => onEnter(item.page)} />)}
          <button className="artwork-hotspot notification-hotspot" type="button" aria-label="Open notifications" onClick={() => onEnter("Gaming activity")} />
          <button className="artwork-hotspot settings-hotspot" type="button" aria-label="Open profile and settings" onClick={() => onEnter("Profile")} />
        </div>
      </div>
      <div className="artwork-caption"><span><i /> TOWN NETWORK ONLINE</span><span>Welcome back, {playerName}</span><span>Tap a district to enter</span></div>
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
          {active === "Dashboard" && null}
          {active !== "Dashboard" && <div className="page-heading">
            <div><h1>{active === "Dashboard" ? "Your gaming command centre." : active}</h1>
              <p>Track progress. Complete challenges. Build your player profile.</p></div>
            <div className="player-chip"><div className="avatar">PT</div><div><strong>{playerData.displayName}</strong><span>{playerData.signedIn ? "ACCOUNT CONNECTED" : "Not connected"}</span></div></div>
          </div>}

          {active !== "Dashboard" && <div className="notice">
            <ShieldCheck size={20} />
            <div><strong>Foundation mode — integrations are disabled</strong>
              <p>No console accounts, adverts or reward transactions are connected. This preview uses demonstration data only.</p></div>
          </div>}

          {active === "Dashboard" ? (
            <TownWorld onEnter={setActive} playerName={playerData.displayName} />
          ) : active === "Leaderboards" ? (
            <LeaderboardsPanel />
          ) : active === "Achievements" ? (
            <AchievementsPanel />
          ) : active === "Gaming activity" ? (
            <GamingActivityPanel />
          ) : active === "My consoles" ? (
            <section className="console-hub">
              <div className="console-intro">
                <span className="panel-kicker">PLATFORM CONNECTIONS</span>
                <h2>Bring your gaming accounts together.</h2>
                <p>Connect supported gaming platforms to build one player profile. Connections are not available yet while provider access and commercial permissions are reviewed.</p>
              </div>
              <div className="console-grid">
                <article className="panel console-card console-xbox">
                  <div className="console-brand"><span className="console-symbol xbox-symbol">X</span><div><span className="panel-kicker">PRIORITY PLATFORM</span><h3>Xbox</h3></div></div>
                  <div className="console-status"><span className="status-pill pending">NOT CONNECTED</span><span className="status-detail">Connection unavailable</span></div>
                  <p>Xbox is the first planned platform. A supported and commercially approved data route must be confirmed before account linking can be enabled.</p>
                  <ul><li>Player identity and gamertag</li><li>Supported achievement data</li><li>Eligible gaming activity data</li></ul>
                  <button className="console-disabled" type="button" disabled>CONNECT XBOX — COMING LATER</button>
                </article>
                <article className="panel console-card console-playstation">
                  <div className="console-brand"><span className="console-symbol ps-symbol">PS</span><div><span className="panel-kicker">SECOND PLATFORM</span><h3>PlayStation</h3></div></div>
                  <div className="console-status"><span className="status-pill pending">NOT CONNECTED</span><span className="status-detail">Connection unavailable</span></div>
                  <p>PlayStation is planned after the Xbox work. An official data access route and any required partner approval must be established first.</p>
                  <ul><li>Player identity where permitted</li><li>Supported trophy data</li><li>Eligible gaming activity data</li></ul>
                  <button className="console-disabled" type="button" disabled>CONNECT PLAYSTATION — COMING LATER</button>
                </article>
                <article className="panel console-card console-steam">
                  <div className="console-brand"><span className="console-symbol steam-symbol">S</span><div><span className="panel-kicker">THIRD PLATFORM</span><h3>Steam</h3></div></div>
                  <div className="console-status"><span className="status-pill pending">NOT CONNECTED</span><span className="status-detail">Connection unavailable</span></div>
                  <p>Steam is now included in the platform roadmap. Account linking will use an approved Steam sign-in method, with profile visibility and available data checked before any activity is treated as verified.</p>
                  <ul><li>Steam account identity and profile</li><li>Public game and achievement data where available</li><li>Eligible activity data, subject to verification</li></ul>
                  <button className="console-disabled" type="button" disabled>CONNECT STEAM — COMING LATER</button>
                </article>
              </div>
              <div className="panel console-next">
                <ShieldCheck size={20} />
                <div><strong>Why connections are not enabled</strong><p>No passwords or console credentials are collected by Puke Town Gaming. Account linking will only be introduced through an approved provider authorisation flow after access, privacy and commercial requirements are satisfied.</p></div>
              </div>
            </section>
          ) : (
            <>
          <AccountPanel />

          <div className="stat-grid">
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

            </>
          )}
          <footer><span>PUKE TOWN GAMING</span><span>BUILT FOR PLAYERS · DESIGNED WITH CONTROL</span><span>{isSupabaseConfigured ? "BACKEND CONFIGURED" : "DEMO MODE"}</span></footer>
        </section>
      </main>
    </div>
  );
}