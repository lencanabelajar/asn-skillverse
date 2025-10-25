/* ==========================
   ASN SkillVerse - Script (updated)
   Behavior:
   - "Mulai Pelatihan" -> buka QUIZ
   - Materi dibuka via tombol "Baca Materi"
   - Badge & poin diberikan hanya jika lulus quiz
   - Ledger dicatat saat badge issued
   ========================== */

const configPath = "config.json";
let config = { mode: "demo", backend_ready: false };

// Elements
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".content-section");
const trainingList = document.getElementById("training-list");
const badgeList = document.getElementById("badge-list");
const ledgerBox = document.getElementById("ledger-log");

// QUIZ modal container (created dynamically)
let quizModal = null;

// Init
document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  setupNavigation();
  await loadTraining();
  await loadBadges();
  await loadLedger();
});

/* ==========================
   Config & Navigation
   ========================== */

async function loadConfig() {
  try {
    const res = await fetch(configPath);
    config = await res.json();
    console.log("Config loaded:", config);
  } catch (err) {
    console.warn("Config not found, using default demo mode.");
  }
}

function setupNavigation() {
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.section;
      sections.forEach(sec => sec.classList.remove("active"));
      document.getElementById(target).classList.add("active");

      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

/* ==========================
   Training list & actions
   ========================== */

async function loadTraining() {
  try {
    // If backend_ready and api available, could fetch /api/training
    const res = await fetch("data/training.json");
    const trainings = await res.json();
    trainingList.innerHTML = "";

    trainings.forEach(t => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${escapeHtml(t.title)}</h3>
        <p>${escapeHtml(t.description)}</p>
        <p><strong>Kategori:</strong> ${escapeHtml(t.category)}</p>
        <p><strong>Durasi:</strong> ${escapeHtml(t.duration)}</p>
        <p class="points">+${t.points} poin</p>
        <div style="margin-top:0.8rem;">
          <button class="start-btn" data-id="${t.id}">Mulai Pelatihan (Quiz)</button>
          <button class="read-btn" data-id="${t.id}" style="margin-left:0.5rem;">Baca Materi</button>
        </div>
      `;
      trainingList.appendChild(card);
    });

    // Attach event listeners
    document.querySelectorAll(".start-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = e.target.dataset.id;
        startQuiz(id);
      });
    });
    document.querySelectorAll(".read-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = e.target.dataset.id;
        openMateri(id);
      });
    });

  } catch (err) {
    trainingList.innerHTML = "<p>Gagal memuat daftar pelatihan.</p>";
    console.error(err);
  }
}

/* ==========================
   Materi handling
   ========================== */

function openMateri(id) {
  // Open materi.md in new tab (raw file on GitHub Pages)
  const url = `trainings/${id}/materi.md`;
  window.open(url, "_blank");
}

/* ==========================
   Quiz flow (modal)
   ========================== */

async function startQuiz(id) {
  try {
    // Load quiz JSON
    const quizUrl = `trainings/${id}/quiz.json`;
    const res = await fetch(quizUrl);
    if (!res.ok) {
      alert("Quiz tidak ditemukan untuk modul ini.");
      return;
    }
    const quiz = await res.json();
    showQuizModal(id, quiz);
  } catch (err) {
    alert("Gagal memuat quiz.");
    console.error(err);
  }
}

function showQuizModal(id, quiz) {
  // If modal exists remove it first
  if (quizModal) quizModal.remove();

  // Create modal container
  quizModal = document.createElement("div");
  quizModal.id = "quiz-modal";
  quizModal.style = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    display:flex; align-items:center; justify-content:center; z-index:9999;
  `;

  // Modal content
  const content = document.createElement("div");
  content.style = `
    width: 90%; max-width:720px; max-height:85vh; overflow:auto;
    background: white; padding: 1.2rem; border-radius: 12px;
  `;

  // Header
  const header = document.createElement("div");
  header.innerHTML = `<h3 style="margin-bottom:6px;">Quiz: ${escapeHtml(id)}</h3>
                      <p style="color:#666;margin-top:0;font-size:0.95rem;">Jawab pertanyaan berikut. Nilai kelulusan 70%.</p>`;

  // Questions
  const form = document.createElement("form");
  form.id = "quiz-form";
  quiz.forEach((q, i) => {
    const qWrap = document.createElement("div");
    qWrap.style = "margin: 12px 0; padding:8px; border-radius:8px; border:1px solid #eee;";

    const qTitle = document.createElement("div");
    qTitle.innerHTML = `<strong>${i + 1}. ${escapeHtml(q.question)}</strong>`;
    qWrap.appendChild(qTitle);

    const opts = document.createElement("div");
    opts.style = "margin-top:8px;";
    q.options.forEach((opt, j) => {
      const idRadio = `q_${i}_opt_${j}`;
      const label = document.createElement("label");
      label.style = "display:block; margin-bottom:6px; cursor:pointer;";
      label.innerHTML = `<input type="radio" name="q_${i}" value="${j}" id="${idRadio}" /> ${escapeHtml(opt)}`;
      opts.appendChild(label);
    });
    qWrap.appendChild(opts);
    form.appendChild(qWrap);
  });

  // Buttons
  const btnRow = document.createElement("div");
  btnRow.style = "display:flex; gap:8px; margin-top:10px; justify-content:flex-end;";
  const btnCancel = document.createElement("button");
  btnCancel.type = "button";
  btnCancel.textContent = "Batal";
  btnCancel.style = "padding:0.5rem 0.8rem; border-radius:8px;";
  btnCancel.onclick = () => quizModal.remove();

  const btnSubmit = document.createElement("button");
  btnSubmit.type = "button";
  btnSubmit.textContent = "Kirim Jawaban";
  btnSubmit.style = "padding:0.5rem 0.9rem; border-radius:8px; background: #0033a0; color:white; border:none;";
  btnSubmit.onclick = async () => {
    await submitQuiz(id, quiz, form);
  };

  btnRow.appendChild(btnCancel);
  btnRow.appendChild(btnSubmit);

  content.appendChild(header);
  content.appendChild(form);
  content.appendChild(btnRow);
  quizModal.appendChild(content);
  document.body.appendChild(quizModal);
}

/* ==========================
   Submit quiz & grading
   ========================== */

async function submitQuiz(id, quiz, form) {
  // Collect answers and compute score
  let correct = 0;
  for (let i = 0; i < quiz.length; i++) {
    const el = form.querySelector(`input[name="q_${i}"]:checked`);
    const val = el ? parseInt(el.value, 10) : null;
    if (val === quiz[i].answer) correct++;
  }
  const total = quiz.length;
  const score = total ? Math.round((correct / total) * 100) : 0;

  // Decide pass threshold
  const passThreshold = 70;
  const passed = score >= passThreshold;

  // Show result
  alert(`Skor: ${score}% (${correct}/${total}) — ${passed ? 'LULUS' : 'TIDAK LULUS'}`);

  if (passed) {
    // Issue badge only if user hasn't received it
    await issueBadgeAfterQuiz(id);
  } else {
    // Offer to read materi
    if (confirm("Belum lulus. Mau buka materi untuk belajar lagi?")) {
      openMateri(id);
    }
  }

  // Close modal
  if (quizModal) quizModal.remove();
}

/* ==========================
   Badge issuing (localStorage + ledger)
   ========================== */

async function issueBadgeAfterQuiz(id) {
  try {
    // get training info
    const res = await fetch("data/training.json");
    const trainings = await res.json();
    const found = trainings.find(t => t.id === id);
    if (!found) {
      alert("Data modul tidak ditemukan.");
      return;
    }

    // check existing badge
    const badges = JSON.parse(localStorage.getItem("asn_badges") || "[]");
    if (badges.some(b => b.id === id)) {
      alert("Kamu sudah memiliki badge ini.");
      return;
    }

    // create badge object
    const newBadge = {
      id: found.id,
      title: found.title,
      points: found.points,
      date: new Date().toLocaleString(),
      issuer: found.author || "ASN SkillVerse",
      cid: null // will be set when IPFS integrated
    };

    // Save to localStorage
    badges.push(newBadge);
    localStorage.setItem("asn_badges", JSON.stringify(badges));

    // Update user points (simple counter in localStorage)
    const user = JSON.parse(localStorage.getItem("asn_user") || JSON.stringify({ name: "ASN User", points: 0 }));
    user.points = (user.points || 0) + (found.points || 0);
    localStorage.setItem("asn_user", JSON.stringify(user));

    // Add ledger entry (simulate)
    await logToLedger(`ISSUE_BADGE: ${found.title}`);

    alert(`Selamat! Badge "${found.title}" diterbitkan. Poin +${found.points}`);

    // Refresh badge list
    await loadBadges();
    // Optionally switch to Badge tab
    document.querySelector('[data-section="badges"]').click();

  } catch (err) {
    console.error(err);
    alert("Gagal menerbitkan badge.");
  }
}

/* ==========================
   Badges UI
   ========================== */

async function loadBadges() {
  // Prefer localStorage (user badges) else show sample data
  const stored = JSON.parse(localStorage.getItem("asn_badges") || "null");
  let badgesData = stored;
  if (!stored) {
    try {
      const res = await fetch("data/badges.json");
      if (res.ok) badgesData = await res.json();
      else badgesData = [];
    } catch {
      badgesData = [];
    }
  }
  badgeList.innerHTML = "";

  if (!badgesData || badgesData.length === 0) {
    badgeList.innerHTML = "<p>Belum ada badge. Selesaikan pelatihan untuk mendapatkannya.</p>";
    return;
  }

  badgesData.forEach(b => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${escapeHtml(b.title)}</h3>
      <img src="trainings/${b.id}/badge.png" alt="badge" width="80" style="margin:8px 0;" onerror="this.style.display='none'"/>
      <p><strong>Diperoleh:</strong> ${escapeHtml(b.date || b.issued_at || '-')}</p>
      <p class="points">+${escapeHtml(String(b.points))} poin</p>
      <p style="font-size:0.85rem;color:#666;margin-top:6px;">${escapeHtml(b.note || b.issuer || '')}</p>
    `;
    badgeList.appendChild(card);
  });
}

/* ==========================
   Ledger (demo mode)
   ========================== */

async function loadLedger() {
  try {
    // If user has local ledger (from actions), prefer that
    const local = JSON.parse(localStorage.getItem("asn_ledger") || "null");
    if (local) {
      renderLedger(local);
      return;
    }

    const res = await fetch("data/ledger-log.json");
    const ledger = await res.json();
    renderLedger(ledger);
  } catch {
    ledgerBox.textContent = "Belum ada log transparansi.";
  }
}

function renderLedger(ledger) {
  ledgerBox.innerHTML = "";
  ledger.slice().reverse().forEach((entry, idx) => {
    const block = `
[${ledger.length - idx}] ${entry.timestamp}
Aksi: ${entry.action}
Hash: ${entry.hash}
Prev: ${entry.prevHash}
------------------------------
`;
    ledgerBox.innerHTML += block;
  });
}

async function logToLedger(action) {
  try {
    // Load current ledger (either from data file or localStorage)
    const res = await fetch("data/ledger-log.json").catch(() => null);
    const base = res && res.ok ? await res.json() : [];
    const local = JSON.parse(localStorage.getItem("asn_ledger") || "null");
    const ledger = local ? local : base;

    const prev = ledger.length ? ledger[ledger.length - 1].hash : "0";
    const hash = await generateHash(action + prev + Date.now());

    const newEntry = {
      timestamp: new Date().toISOString(),
      action,
      hash,
      prevHash: prev
    };

    ledger.push(newEntry);
    localStorage.setItem("asn_ledger", JSON.stringify(ledger));
    renderLedger(ledger);

    return newEntry;
  } catch (err) {
    console.error("Ledger update failed:", err);
    return null;
  }
}

async function generateHash(text) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/* ==========================
   Utility
   ========================== */

function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
