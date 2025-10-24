/* ==========================
   ASN SkillVerse - Script
   Mode: Demo (GitHub Pages)
   ========================== */

const configPath = "config.json";
let config = { mode: "demo", backend_ready: false };

// Elemen navigasi
const navButtons = document.querySelectorAll(".nav-btn");
const sections = document.querySelectorAll(".content-section");

// Elemen data
const trainingList = document.getElementById("training-list");
const badgeList = document.getElementById("badge-list");
const ledgerBox = document.getElementById("ledger-log");

// Inisialisasi halaman
document.addEventListener("DOMContentLoaded", async () => {
  await loadConfig();
  setupNavigation();
  await loadTraining();
  await loadBadges();
  await loadLedger();
});

/* ==========================
   Fungsi dasar
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

// Navigasi antar section
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
   Pelatihan
   ========================== */

async function loadTraining() {
  try {
    const res = await fetch("data/training.json");
    const trainings = await res.json();
    trainingList.innerHTML = "";

    trainings.forEach(t => {
      const card = document.createElement("div");
      card.className = "card";
      card.innerHTML = `
        <h3>${t.title}</h3>
        <p>${t.description}</p>
        <p><strong>Kategori:</strong> ${t.category}</p>
        <p><strong>Durasi:</strong> ${t.duration}</p>
        <p class="points">+${t.points} poin</p>
        <button class="start-btn" data-id="${t.id}">Mulai Pelatihan</button>
      `;
      trainingList.appendChild(card);
    });

    // Tombol mulai
    document.querySelectorAll(".start-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const id = e.target.dataset.id;
        startTraining(id);
      });
    });
  } catch (err) {
    trainingList.innerHTML = "<p>Gagal memuat daftar pelatihan.</p>";
  }
}

function startTraining(id) {
  const url = `trainings/${id}/materi.md`;
  window.open(url, "_blank");
  // Setelah membaca, simulasi penyelesaian
  setTimeout(() => completeTraining(id), 2000);
}

/* ==========================
   Badge (simulasi user)
   ========================== */

async function loadBadges() {
  const stored = JSON.parse(localStorage.getItem("asn_badges") || "[]");
  badgeList.innerHTML = "";

  if (stored.length === 0) {
    badgeList.innerHTML = "<p>Belum ada badge. Selesaikan pelatihan untuk mendapatkannya.</p>";
    return;
  }

  stored.forEach(b => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${b.title}</h3>
      <img src="trainings/${b.id}/badge.png" alt="badge" width="80" />
      <p><strong>Diperoleh:</strong> ${b.date}</p>
      <p class="points">+${b.points} poin</p>
    `;
    badgeList.appendChild(card);
  });
}

async function completeTraining(id) {
  try {
    const res = await fetch("data/training.json");
    const trainings = await res.json();
    const found = trainings.find(t => t.id === id);
    if (!found) return;

    const badges = JSON.parse(localStorage.getItem("asn_badges") || "[]");
    if (badges.some(b => b.id === id)) {
      alert("Pelatihan ini sudah kamu selesaikan sebelumnya!");
      return;
    }

    const newBadge = {
      id: found.id,
      title: found.title,
      points: found.points,
      date: new Date().toLocaleString()
    };

    badges.push(newBadge);
    localStorage.setItem("asn_badges", JSON.stringify(badges));

    // Catat ke ledger dummy
    await logToLedger(`Selesai pelatihan: ${found.title}`);

    alert(`Selamat! Kamu mendapatkan badge "${found.title}" (+${found.points} poin)`);
    await loadBadges();
  } catch (err) {
    console.error(err);
  }
}

/* ==========================
   Ledger Transparansi
   ========================== */

async function loadLedger() {
  try {
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
    const res = await fetch("data/ledger-log.json");
    const ledger = await res.json();

    const prev = ledger.length ? ledger[ledger.length - 1].hash : "0";
    const hash = await generateHash(action + prev + Date.now());

    const newEntry = {
      timestamp: new Date().toISOString(),
      action,
      hash,
      prevHash: prev
    };

    ledger.push(newEntry);

    // Simulasi update ledger lokal (tanpa tulis file)
    localStorage.setItem("asn_ledger", JSON.stringify(ledger));
    renderLedger(ledger);
  } catch (err) {
    console.error("Ledger update failed:", err);
  }
}

async function generateHash(text) {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
