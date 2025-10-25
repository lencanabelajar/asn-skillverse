/* ==========================
   ASN SkillVerse - script.js (verbose, full)
   - Config driven (config.json)
   - Mode demo (localStorage) or switch to backend via config
   - Features: training+quiz, materi viewer, badges, shop, clubs, leaderboard, ledger, leveling
   ========================== */

/* ---------- CONFIG ---------- */
const CONFIG_PATH = "config.json";
let CONFIG = { mode: "demo", backend_ready: false, api_base: "/api" };

/* ---------- LOCAL STORAGE KEYS ---------- */
const KEY_USER = "asn_user";
const KEY_BADGES = "asn_badges";
const KEY_LEDGER = "asn_ledger";

/* ---------- DEFAULT USER ---------- */
const DEFAULT_USER = {
  name: "ASN User",
  points: 0,
  xp: 0,
  level: 1,
  club: null
};

/* ---------- DOM ELEMENTS ---------- */
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".content-section");
const trainingListEl = document.getElementById("training-list");
const badgeListEl = document.getElementById("badge-list");
const ledgerBox = document.getElementById("ledger-log");
const shopListEl = document.getElementById("shop-list");
const clubListEl = document.getElementById("club-list");
const leaderboardListEl = document.getElementById("leaderboard-list");

let quizModal = null;

/* ---------- INIT ---------- */
document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  ensureUser();
  setupNavigation();
  await refreshAll();
});

/* ---------- HELPERS ---------- */

function logDebug(...args) {
  // Uncomment to debug
  // console.debug(...args);
}

async function loadConfig() {
  try {
    const res = await fetch(CONFIG_PATH);
    if (res.ok) {
      CONFIG = await res.json();
      logDebug("Config loaded", CONFIG);
    }
  } catch (err) {
    console.warn("No config.json — using defaults");
  }
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem(KEY_USER)) || { ...DEFAULT_USER };
  } catch {
    return { ...DEFAULT_USER };
  }
}
function saveUser(u) {
  localStorage.setItem(KEY_USER, JSON.stringify(u));
}

function getBadges() {
  try {
    return JSON.parse(localStorage.getItem(KEY_BADGES)) || null;
  } catch {
    return null;
  }
}
function saveBadges(b) {
  localStorage.setItem(KEY_BADGES, JSON.stringify(b));
}

function getLedger() {
  try {
    return JSON.parse(localStorage.getItem(KEY_LEDGER)) || null;
  } catch {
    return null;
  }
}
function saveLedger(l) {
  localStorage.setItem(KEY_LEDGER, JSON.stringify(l));
}

function ensureUser() {
  const u = getUser();
  if (!u || !u.name) {
    saveUser({ ...DEFAULT_USER });
  }
  // ensure ledger exists too (seed from file will be loaded later)
  if (!getLedger()) {
    // do not overwrite file-based ledger here — we'll merge on first read
    saveLedger(null);
  }
}

/* ---------- NAVIGATION ---------- */

function setupNavigation() {
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const section = btn.getAttribute("data-section");
      // toggle active class
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      // show/hide sections
      sections.forEach(s => s.classList.remove("active"));
      const target = document.getElementById(section);
      if (target) target.classList.add("active");
      // some lazy refresh hooks
      if (section === "badges") loadBadges();
      if (section === "shop") loadShop();
      if (section === "clubs") loadClubs();
      if (section === "leaderboard") loadLeaderboard();
    });
  });
}

/* ---------- USER UI & LEVEL ---------- */

function calculateLevelFromXP(xp) {
  // simple progressive system: each level needs +500xp more (can be tuned)
  return Math.floor(xp / 500) + 1;
}

function updateUserStatsUI() {
  const user = getUser();
  // derive level from xp
  user.level = calculateLevelFromXP(user.xp || 0);
  saveUser(user);

  const nameEl = document.getElementById("user-name");
  const levelEl = document.getElementById("user-level");
  const pointsEl = document.getElementById("user-points");

  if (nameEl) nameEl.textContent = user.name;
  if (levelEl) levelEl.textContent = user.level;
  if (pointsEl) pointsEl.textContent = user.points;
}

/* ---------- LOAD / REFRESH ---------- */

async function refreshAll() {
  updateUserStatsUI();
  await loadTraining();
  await loadBadges();
  await loadShop();
  await loadClubs();
  await loadLeaderboard();
  await loadLedger();
}

/* ---------- TRAINING (list + click handlers) ---------- */

async function loadTraining() {
  try {
    const trainings = await fetchJSONFlexible("data/training.json", "/training");
    trainingListEl.innerHTML = "";

    const user = getUser();

    trainings.forEach(t => {
      const locked = t.requires_level && user.level < t.requires_level;
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${escapeHtml(t.title)}</h3>
        <p style="margin:6px 0;color:${locked ? '#b00020' : '#666'}">${escapeHtml(t.description)}</p>
        <p><strong>Kategori:</strong> ${escapeHtml(t.category || '-')}</p>
        <p><strong>Durasi:</strong> ${escapeHtml(t.duration || '-')}</p>
        <p class="points">+${escapeHtml(String(t.points || 0))} poin</p>
        <div style="margin-top:0.6rem;">
          <button class="btn-quiz" ${locked ? 'disabled' : ''} data-id="${t.id}">${locked ? '🔒 Terkunci' : 'Mulai Pelatihan (Quiz)'}</button>
          <button class="btn-materi" data-id="${t.id}" style="margin-left:8px;">Baca Materi</button>
        </div>
      `;
      trainingListEl.appendChild(card);
    });

    // bind events
    trainingListEl.querySelectorAll(".btn-materi").forEach(b => {
      b.addEventListener("click", e => openMateri(e.target.dataset.id));
    });
    trainingListEl.querySelectorAll(".btn-quiz").forEach(b => {
      b.addEventListener("click", e => startQuiz(e.target.dataset.id));
    });

  } catch (err) {
    trainingListEl.innerHTML = "<p>Gagal memuat daftar pelatihan.</p>";
    console.error(err);
  }
}

/* ---------- MATERI ---------- */

function openMateri(id) {
  // open materi viewer page (materi.html?id=xxx)
  window.open(`materi.html?id=${encodeURIComponent(id)}`, "_blank");
}

/* ---------- QUIZ (modal) ---------- */

async function startQuiz(id) {
  try {
    // fetch quiz
    const quiz = await fetchJSONFlexible(`trainings/${id}/quiz.json`, `/training/${id}/quiz`);
    if (!quiz || !Array.isArray(quiz) || quiz.length === 0) {
      alert("Tidak ada quiz yang tersedia untuk modul ini.");
      return;
    }
    showQuizModal(id, quiz);
  } catch (err) {
    alert("Gagal memuat quiz.");
    console.error(err);
  }
}

function showQuizModal(id, quiz) {
  if (quizModal) quizModal.remove();

  quizModal = document.createElement("div");
  quizModal.id = "quiz-modal";
  quizModal.style = `
    position:fixed; inset:0; display:flex; align-items:center; justify-content:center;
    background: rgba(0,0,0,0.5); z-index:9999;
  `;

  const box = document.createElement("div");
  box.style = `
    width: 95%; max-width:820px; max-height:85vh; overflow:auto;
    background:#fff; padding:16px; border-radius:12px; box-shadow:0 6px 18px rgba(0,0,0,0.12);
  `;

  const header = document.createElement("div");
  header.innerHTML = `<h3 style="margin:0 0 6px 0;">Quiz: ${escapeHtml(id)}</h3>
                      <p style="margin:0 0 12px 0;color:#666">Jawablah pertanyaan berikut. Nilai minimal 70% untuk lulus.</p>`;

  const form = document.createElement("form");
  form.id = "quiz-form";

  quiz.forEach((q, i) => {
    const qWrap = document.createElement("div");
    qWrap.style = "padding:10px;border-radius:8px;border:1px solid #eee;margin-bottom:10px;";
    qWrap.innerHTML = `<strong>${i + 1}. ${escapeHtml(q.question)}</strong>`;
    const opts = document.createElement("div");
    opts.style = "margin-top:8px;";
    q.options.forEach((opt, j) => {
      const rid = `q_${i}_${j}_${Date.now()}`; // unique
      const label = document.createElement("label");
      label.style = "display:block;margin-bottom:6px;cursor:pointer;";
      label.innerHTML = `<input type="radio" name="q_${i}" value="${j}" id="${rid}" /> ${escapeHtml(opt)}`;
      opts.appendChild(label);
    });
    qWrap.appendChild(opts);
    form.appendChild(qWrap);
  });

  const footer = document.createElement("div");
  footer.style = "display:flex;gap:10px;justify-content:flex-end;margin-top:8px";
  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Batal";
  cancelBtn.onclick = () => quizModal.remove();

  const submitBtn = document.createElement("button");
  submitBtn.type = "button";
  submitBtn.textContent = "Kirim Jawaban";
  submitBtn.style = "background:#0033a0;color:white;padding:8px 12px;border-radius:8px;border:none;";
  submitBtn.onclick = async () => {
    await submitQuiz(id, quiz, form);
  };

  footer.appendChild(cancelBtn);
  footer.appendChild(submitBtn);

  box.appendChild(header);
  box.appendChild(form);
  box.appendChild(footer);
  quizModal.appendChild(box);
  document.body.appendChild(quizModal);
}

async function submitQuiz(id, quiz, form) {
  // scoring
  let correct = 0;
  quiz.forEach((q, i) => {
    const el = form.querySelector(`input[name="q_${i}"]:checked`);
    const val = el ? parseInt(el.value, 10) : null;
    if (val === q.answer) correct++;
  });
  const total = quiz.length;
  const score = total ? Math.round((correct / total) * 100) : 0;
  const pass = score >= 70;

  alert(`Skor: ${score}% (${correct}/${total}) — ${pass ? "LULUS" : "TIDAK LULUS"}`);

  if (pass) {
    await issueBadgeAfterQuiz(id);
  } else {
    if (confirm("Belum lulus. Buka materi untuk belajar lagi?")) {
      openMateri(id);
    }
  }

  if (quizModal) quizModal.remove();
}

/* ---------- BADGE ISSUE ---------- */

async function issueBadgeAfterQuiz(id) {
  try {
    const trainings = await fetchJSONFlexible("data/training.json", "/training");
    const t = trainings.find(x => x.id === id);
    if (!t) {
      alert("Data modul tidak ditemukan.");
      return;
    }

    const badges = JSON.parse(localStorage.getItem(KEY_BADGES) || "[]");
    if (badges.some(b => b.id === id)) {
      alert("Badge sudah pernah diterbitkan untukmu.");
      return;
    }

    const newBadge = {
      id: t.id,
      title: t.title,
      points: t.points || 0,
      date: new Date().toLocaleString(),
      issuer: t.author || "ASN SkillVerse",
      cid: null
    };

    badges.push(newBadge);
    saveBadges(badges);

    // update user points & xp & level
    const u = getUser();
    u.points = (u.points || 0) + (t.points || 0);
    u.xp = (u.xp || 0) + (t.points || 0);
    u.level = calculateLevelFromXP(u.xp || 0);
    saveUser(u);
    updateUserStatsUI();

    // ledger
    await logToLedger(`ISSUE_BADGE:${t.id}:${t.title}`);

    // feedback
    alert(`Selamat! Badge "${t.title}" diterbitkan. Poin +${t.points || 0}`);

    // refresh badges ui
    await loadBadges();
    // switch to badges tab
    document.querySelector('[data-section="badges"]').click();

  } catch (err) {
    console.error(err);
    alert("Gagal menerbitkan badge.");
  }
}

/* ---------- BADGES UI ---------- */

async function loadBadges() {
  // prefer localStorage (user badges)
  let badges = JSON.parse(localStorage.getItem(KEY_BADGES) || "null");
  if (!badges) {
    try {
      const res = await fetch("data/badges.json");
      if (res.ok) badges = await res.json();
      else badges = [];
    } catch {
      badges = [];
    }
  }
  badgeListEl.innerHTML = "";
  if (!badges || badges.length === 0) {
    badgeListEl.innerHTML = "<p>Belum ada badge.</p>";
    return;
  }

  badges.forEach(b => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${escapeHtml(b.title)}</h3>
      <img src="trainings/${b.id}/badge.png" alt="badge" width="80" style="margin:8px 0;" onerror="this.style.display='none'"/>
      <p><strong>Diperoleh:</strong> ${escapeHtml(b.date || b.issued_at || '-')}</p>
      <p class="points">+${escapeHtml(String(b.points || 0))} poin</p>
      <p style="font-size:0.85rem;color:#666;margin-top:6px;">${escapeHtml(b.note || b.issuer || '')}</p>
    `;
    badgeListEl.appendChild(card);
  });
}

/* ---------- LEDGER (hash chaining, demo) ---------- */

async function loadLedger() {
  try {
    // prefer localStorage if present (we allow ledger persistence)
    const local = getLedger();
    if (local && Array.isArray(local)) {
      renderLedger(local);
      return;
    }
    // else load from data file
    const res = await fetch("data/ledger-log.json");
    if (!res.ok) {
      ledgerBox.textContent = "Belum ada ledger.";
      return;
    }
    const base = await res.json();
    // store a copy in local storage so subsequent updates append
    saveLedger(base);
    renderLedger(base);
  } catch (err) {
    console.error("loadLedger error", err);
    ledgerBox.textContent = "Gagal memuat ledger.";
  }
}

function renderLedger(ledgerArr) {
  ledgerBox.innerHTML = "";
  ledgerArr.slice().reverse().forEach((entry, idx) => {
    ledgerBox.innerHTML += `
[${ledgerArr.length - idx}] ${entry.timestamp}
Aksi: ${entry.action}
Hash: ${entry.hash}
Prev: ${entry.prevHash}
------------------------------
`;
  });
}

async function logToLedger(action) {
  try {
    // read current ledger (merge from data if necessary)
    let ledgerArr = getLedger();
    if (!ledgerArr || !Array.isArray(ledgerArr)) {
      try {
        const res = await fetch("data/ledger-log.json");
        ledgerArr = res.ok ? await res.json() : [];
      } catch {
        ledgerArr = [];
      }
    }
    const prev = ledgerArr.length ? ledgerArr[ledgerArr.length - 1].hash : "0";
    const hash = await generateHash(action + prev + Date.now());
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      hash,
      prevHash: prev
    };
    ledgerArr.push(entry);
    saveLedger(ledgerArr);
    renderLedger(ledgerArr);
    return entry;
  } catch (err) {
    console.error("logToLedger error", err);
    return null;
  }
}

async function generateHash(text) {
  const enc = new TextEncoder();
  const buf = enc.encode(text);
  const hashBuf = await crypto.subtle.digest("SHA-256", buf);
  const arr = Array.from(new Uint8Array(hashBuf));
  return arr.map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ---------- SHOP (redeem) ---------- */

async function loadShop() {
  try {
    const items = await fetchJSONFlexible("data/shop.json", "/shop");
    shopListEl.innerHTML = "";
    const user = getUser();

    items.forEach(it => {
      const affordable = user.points >= (it.price || 0);
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${escapeHtml(it.name)}</h3>
        <img src="${escapeHtml(it.image || '')}" alt="${escapeHtml(it.name)}" width="90" style="margin:8px 0;" onerror="this.style.display='none'"/>
        <p style="color:#666">${escapeHtml(it.description)}</p>
        <p class="points">${escapeHtml(String(it.price))} poin</p>
        <div style="margin-top:8px;">
          <button class="btn-buy" ${affordable ? '' : 'disabled'} data-id="${it.id}" data-price="${it.price}">${affordable ? 'Tukar' : 'Poin Kurang'}</button>
        </div>
      `;
      shopListEl.appendChild(card);
    });

    shopListEl.querySelectorAll(".btn-buy").forEach(b => {
      b.addEventListener("click", async e => {
        const id = e.target.dataset.id;
        const price = parseInt(e.target.dataset.price, 10) || 0;
        await buyItem(id, price);
      });
    });

  } catch (err) {
    console.error("loadShop err", err);
    shopListEl.innerHTML = "<p>Gagal memuat shop.</p>";
  }
}

async function buyItem(id, price) {
  const user = getUser();
  if (user.points < price) {
    alert("Poin tidak cukup.");
    return;
  }
  if (!confirm(`Tukar item seharga ${price} poin?`)) return;

  user.points -= price;
  // xp unaffected by shop
  saveUser(user);
  updateUserStatsUI();
  await logToLedger(`REDEEM:${id}:${price}`);
  alert("Transaksi berhasil. Item virtual ditukar.");
  await loadShop();
}

/* ---------- CLUBS (join, scoring) ---------- */

async function loadClubs() {
  try {
    const clubs = await fetchJSONFlexible("data/clubs.json", "/clubs");
    clubListEl.innerHTML = "";
    const user = getUser();

    clubs.forEach(club => {
      const joined = user.club === club.id;
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${escapeHtml(club.name)}</h3>
        <p style="color:#666">${escapeHtml(club.description)}</p>
        <p>Anggota: ${escapeHtml(String(club.members || 0))} · Poin klub: ${escapeHtml(String(club.points || 0))}</p>
        <div style="margin-top:8px;">
          <button class="btn-join" data-id="${club.id}" ${joined ? 'disabled' : ''}>${joined ? 'Sudah Bergabung' : 'Gabung Klub'}</button>
        </div>
      `;
      clubListEl.appendChild(card);
    });

    clubListEl.querySelectorAll(".btn-join").forEach(b => {
      b.addEventListener("click", async e => {
        const clubId = e.target.dataset.id;
        const u = getUser();
        u.club = clubId;
        saveUser(u);
        updateUserStatsUI();
        await logToLedger(`JOIN_CLUB:${clubId}`);
        alert(`Kamu berhasil bergabung ke klub ${clubId}`);
        await loadClubs();
      });
    });

  } catch (err) {
    console.error("loadClubs err", err);
    clubListEl.innerHTML = "<p>Gagal memuat klub.</p>";
  }
}

/* ---------- LEADERBOARD ---------- */

async function loadLeaderboard() {
  try {
    const clubs = await fetchJSONFlexible("data/clubs.json", "/clubs");
    const user = getUser();

    // users ranking: we'll use sample users + current user (extendable later)
    const sampleUsers = [
      { name: "Andi", points: 950 },
      { name: "Sinta", points: 820 },
      { name: "Budi", points: 780 }
    ];
    sampleUsers.push({ name: user.name, points: user.points });

    const usersSorted = sampleUsers.sort((a, b) => b.points - a.points);

    // clubs ranking: from data
    const clubsSorted = (clubs || []).slice().sort((a, b) => (b.points || 0) - (a.points || 0));

    // render
    leaderboardListEl.innerHTML = "";

    // users
    const usersCard = document.createElement("div");
    usersCard.className = "card";
    usersCard.innerHTML = `<h3>Top ASN</h3>`;
    usersSorted.forEach((u, idx) => {
      usersCard.innerHTML += `<p>#${idx + 1} ${escapeHtml(u.name)} — ${escapeHtml(String(u.points))} poin</p>`;
    });
    leaderboardListEl.appendChild(usersCard);

    // clubs
    const clubsCard = document.createElement("div");
    clubsCard.className = "card";
    clubsCard.innerHTML = `<h3>Top Klub</h3>`;
    clubsSorted.forEach((c, idx) => {
      clubsCard.innerHTML += `<p>#${idx + 1} ${escapeHtml(c.name)} — ${escapeHtml(String(c.points || 0))} poin</p>`;
    });
    leaderboardListEl.appendChild(clubsCard);

  } catch (err) {
    console.error("loadLeaderboard err", err);
    leaderboardListEl.innerHTML = "<p>Gagal memuat leaderboard.</p>";
  }
}

/* ---------- UTIL: fetchJSONFlexible ---------- */
/* Tries local file first, then optional backend route if CONFIG.backend_ready true.
   This keeps frontend working on GitHub Pages (demo) and switchable to backend later. */
async function fetchJSONFlexible(localPath, apiRoute = "") {
  // prefer local (demo) mode
  if (!CONFIG.backend_ready) {
    const res = await fetch(localPath);
    if (res.ok) return await res.json();
    throw new Error(`Local resource not found: ${localPath}`);
  } else {
    // attempt API fetch
    try {
      const apiUrl = (CONFIG.api_base || "").replace(/\/$/, "") + apiRoute;
      const res = await fetch(apiUrl);
      if (res.ok) return await res.json();
      // fallback to local if available
      const res2 = await fetch(localPath);
      if (res2.ok) return await res2.json();
      throw new Error("No data");
    } catch (err) {
      console.warn("fetchJSONFlexible fallback to local", err);
      const res2 = await fetch(localPath);
      if (res2.ok) return await res2.json();
      throw err;
    }
  }
}

/* ---------- UTIL: escapeHtml ---------- */
function escapeHtml(s) {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
