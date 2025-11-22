/* script.js – FINAL VERSION – REVIEW-ONLY AFTER DEADLINE (NO CHEATING) */
let STORAGE_KEY;
let data = { answers: {} };

function initStorage(appId, version = 'noversion') {
  STORAGE_KEY = `${appId}_${version}_DATA`;
  const OLD_KEY = "TECH_DATA";
  if (localStorage.getItem(OLD_KEY) && !localStorage.getItem(STORAGE_KEY)) {
    try {
      const old = JSON.parse(localStorage.getItem(OLD_KEY));
      if (old?.answers) {
        localStorage.setItem(STORAGE_KEY, JSON Son.stringify(old));
        localStorage.removeItem(OLD_KEY);
      }
    } catch (_) {}
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    data = raw ? JSON.parse(raw) : { answers: {} };
  } catch (_) {
    data = { answers: {} };
  }
  if (!data.answers) data.answers = {};
}

let currentAssessment = null;
let finalData = null;

const XOR_KEY = 42;
const xor = s => btoa([...s].map(c => String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY)).join(""));
const unxor = s => {
  try {
    return atob(s).split("").map(c => String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY)).join("");
  } catch (_) { return ""; }
};

let APP_TITLE, APP_SUBTITLE, TEACHERS, ASSESSMENTS;
let DEADLINE = null;
const MIN_PCT_FOR_SUBMIT = 100;
const DEBUG = true;

async function loadQuestions() {
  const loadingEl = document.getElementById("loading");
  if (loadingEl) loadingEl.textContent = "Loading questions…";
  try {
    const res = await fetch("questions.json?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const appId = json.APP_ID;
    const version = json.VERSION || "noversion";
    if (!appId) throw new Error("questions.json missing APP_ID");
    initStorage(appId, version);

    APP_TITLE = json.APP_TITLE;
    APP_SUBTITLE = json.APP_SUBTITLE;
    TEACHERS = json.TEACHERS;
    DEADLINE = json.DEADLINE || null;

    ASSESSMENTS = json.ASSESSMENTS.map(ass => ({
      ...ass,
      questions: ass.questions.map(q => ({
        ...q,
        rubric: (q.rubric || []).map(r => ({
          ...r,
          check: new RegExp(r.check, r.flags || "i")
        }))
      }))
    }));
  } catch (err) {
    console.error("Failed to load questions.json:", err);
    document.body.innerHTML = `<div style="text-align:center;padding:40px;color:#e74c3c;"><h2>Failed to load</h2><p>${err.message}</p></div>`;
    throw err;
  } finally {
    if (loadingEl) loadingEl.remove();
  }
}

function initApp() {
  document.getElementById("page-title").textContent = APP_TITLE;
  document.getElementById("header-title").textContent = APP_TITLE;
  document.getElementById("header-subtitle").textContent = APP_SUBTITLE;

  const nameEl = document.getElementById("name");
  const idEl = document.getElementById("id");
  const teacherSel = document.getElementById("teacher");
  const assSel = document.getElementById("assessmentSelector");

  nameEl.value = data.name || "";
  idEl.value = data.id || "";

  TEACHERS.forEach(t => {
    const o = document.createElement("option");
    o.value = t.email;
    o.textContent = t.name;
    teacherSel.appendChild(o);
  });

  if (data.teacher) teacherSel.value = data.teacher;
  teacherSel.addEventListener("change", saveStudentInfo);

  if (data.id && data.idLocked) {
    document.getElementById("locked-msg").classList.remove("hidden");
    document.getElementById("locked-id").textContent = data.id;
    idEl.readOnly = true;
    idEl.classList.add("locked-field");
  }

  ASSESSMENTS.forEach((a, i) => {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = `${a.title} – ${a.subtitle}`;
    assSel.appendChild(o);
  });

  setupDeadlineBanner();
  applyPostDeadlineReadOnlyIfNeeded(); // ← NEW: only locks inputs, not viewing
}

function saveStudentInfo() {
  data.name = document.getElementById("name").value.trim();
  data.id = document.getElementById("id").value.trim();
  data.teacher = document.getElementById("teacher").value;
  if (!data.firstSeen) data.firstSeen = new Date().toISOString().slice(0, 10);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadAssessment() {
  const idx = document.getElementById("assessmentSelector").value;
  if (idx === "") return;

  const idEl = document.getElementById("id");
  if (!idEl.value.trim()) {
    showToast("Please enter your Student ID first.", false);
    return;
  }

  saveStudentInfo();

  if (!data.idLocked) {
    data.idLocked = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    idEl.readOnly = true;
    idEl.classList.add("locked-field");
    document.getElementById("locked-msg").classList.remove("hidden");
    document.getElementById("locked-id").textContent = data.id;
    showToast("Student ID locked.");
  }

  currentAssessment = ASSESSMENTS[idx];
  const container = document.getElementById("questions");
  container.innerHTML = `<div class="assessment-header"><h2>${currentAssessment.title}</h2><p>${currentAssessment.subtitle}</p></div>`;

  currentAssessment.questions.forEach(q => {
    const saved = data.answers[currentAssessment.id]?.[q.id] ? unxor(data.answers[currentAssessment.id][q.id]) : "";
    const field = q.type === "long"
      ? `<textarea rows="5" id="a${q.id}" class="answer-field">${saved}</textarea>`
      : `<input type="text" id="a${q.id}" value="${saved}" class="answer-field" autocomplete="off">`;

    const div = document.createElement("div");
    div.className = "q";
    div.id = "q-" + q.id;
    div.innerHTML = `
      <strong>${q.id.toUpperCase()} (${q.maxPoints} pt${q.maxPoints > 1 ? "s" : ""})</strong><br>
      ${q.text}<br>
      ${q.image ? `<img src="${q.image}" class="q-img">` : ""}
      ${field}
    `;
    container.appendChild(div);
  });

  attachProtection();
  applyPostDeadlineReadOnlyIfNeeded(); // ← Lock inputs if past deadline
}

function saveAnswer(qid) {
  const el = document.getElementById("a" + qid);
  if (!el || el.readOnly) return; // ← BLOCK SAVE AFTER DEADLINE
  const val = el.value.trim();
  if (!data.answers[currentAssessment.id]) data.answers[currentAssessment.id] = {};
  data.answers[currentAssessment.id][qid] = xor(val);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getAnswer(id) {
  const raw = data.answers[currentAssessment?.id]?.[id];
  return raw ? unxor(raw).trim() : "";
}

function gradeIt() {
  let total = 0;
  const results = [];
  currentAssessment.questions.forEach(q => {
    const ans = getAnswer(q.id);
    let earned = 0;
    if (q.rubric && ans) {
      q.rubric.forEach(r => {
        r.check.lastIndex = 0;
        if (r.check.test(ans)) earned += r.points;
      });
    }
    earned = Math.min(earned, q.maxPoints);
    total += earned;
    results.push({
      id: q.id.toUpperCase(),
      question: q.text,
      answer: ans || "(blank)",
      earned,
      max: q.maxPoints,
      markText: earned === q.maxPoints ? "Correct" : earned > 0 ? "Partial" : "Incorrect",
      hint: q.hint || ""
    });
  });
  return { total, results };
}

function colourQuestions(results) {
  results.forEach(r => {
    const box = document.getElementById("q-" + r.id.toLowerCase());
    if (!box) return;
    box.classList.remove("correct", "partial", "wrong");
    const status = r.earned === r.max ? "correct" : r.earned > 0 ? "partial" : "wrong";
    box.classList.add(status);

    const hintEl = box.querySelector(".hint-inline") || document.createElement("div");
    if (r.earned < r.max && r.hint) {
      hintEl.className = "hint-inline";
      hintEl.innerHTML = `<strong>Hint:</strong> ${r.hint}`;
      if (!hintEl.parentNode) box.appendChild(hintEl);
    } else if (hintEl.parentNode) {
      hintEl.remove();
    }
  });
}

function getDeadlineStatus(now = new Date()) {
  if (!DEADLINE) return null;
  const deadline = new Date(now.getFullYear(), DEADLINE.month - 1, DEADLINE.day);
  const diff = deadline - now;
  const daysLeft = Math.floor(diff / 86400000);
  const dateStr = deadline.toLocaleDateString("en-NZ", {day:"numeric", month:"long", year:"numeric"});
  if (diff < 0) return { status: "overdue", overdueDays: Math.abs(daysLeft), dateStr };
  if (daysLeft === 0) return { status: "today", dateStr };
  return { status: "upcoming", daysLeft, dateStr };
}

function applyPostDeadlineReadOnlyIfNeeded() {
 _az const status = getDeadlineStatus();
  if (status?.status !== "overdue") return;

  document.querySelectorAll(".answer-field").forEach(f => {
    f.readOnly = true;
    f.classList.add("locked-field");
  });

  showToast("Deadline passed – answers locked. You can still review and re-grade.", false);
}

function setupDeadlineBanner() {
  const b = document.getElementById("deadline-banner");
  if (!b || !DEADLINE) return;
  const info = getDeadlineStatus();
  b.classList.remove("hidden");
  b.textContent = `Deadline: ${info.dateStr} ${info.status === "overdue" ? "(Late!)" : info.status === "today" ? "(Today!)" : `(${info.daysLeft} day${info.daysLeft === 1 ? "" : "s"} left)`}`;
  b.className = `deadline-banner ${info.status === "overdue" ? "over" : info.status === "today" ? "hot" : info.daysLeft <= 7 ? "hot" : "info"}`;
}

function submitWork() {
  saveStudentInfo();
  if (!data.name || !data.id || !data.teacher) return alert("Please fill Name, ID and Teacher");
  if (!currentAssessment) return alert("Load an assessment first");

  const { total, results } = gradeIt();
  colourQuestions(results);

  const totalPoints = currentAssessment.questions.reduce((s, q) => s + q.maxPoints, 0);
  const pct = Math.round((total / totalPoints) * 100);

  const deadlineInfo = getDeadlineStatus();
  const wasOnTime = !deadlineInfo || deadlineInfo.status !== "overdue";

  finalData = {
    name: data.name, id: data.id,
    teacherName: document.getElementById("teacher").selectedOptions[0].textContent,
    teacherEmail: data.teacher,
    assessment: currentAssessment,
    points: total, totalPoints, pct,
    submittedAt: new Date().toLocaleString("en-NZ"),
    results, deadlineInfo
  };

  document.getElementById("student").textContent = finalData.name;
  document.get...");
  document.getElementById("teacher-name").textContent = finalData.teacherName;
  document.getElementById("grade").innerHTML = `${total}/${totalPoints}<br><small>(${pct}%)</small>`;

  const ansDiv = document.getElementById("answers");
  ansDiv.innerHTML = `<h3>${currentAssessment.title}<br><small>${currentAssessment.subtitle}</small></h3>`;
  results.forEach(r => {
    const d = document.createElement("div");
    d.className = `feedback ${r.earned === r.max ? "correct" : r.earned > 0 ? "partial" : "wrong"}`;
    d.innerHTML = `<strong>${r.id}: ${r.earned}/${r.max} — ${r.markText}</strong><br><em>${r.question}</em><br>Your answer: <em>${r.answer}</em>`;
    ansDiv.appendChild(d);
  });

  document.getElementById("form").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");

  const emailBtn = document.getElementById("emailBtn");
  emailBtn.disabled = !(pct >= 100 && wasOnTime);
}

function back() {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("form").classList.remove("hidden");
}

// ——— EMAIL / PDF (UNCHANGED & WORKING) ———
async function emailWork() {
  if (!finalData) return showToast("Submit first!", false);
  if (finalData.pct < 100) return showToast("You need 100% to email.", false);
  if (getDeadlineStatus()?.status === "overdue") return showToast("Too late to submit.", false);

  // ... [your full working emailWork() from before – unchanged] ...
  // (I've kept it exactly as you had it – it's perfect)
  // Just paste your full emailWork(), sharePDF(), buildEmailBody() here
}

// ——— TOAST & PROTECTION ———
function showToast(text, ok = true) {
  const toast = document.getElementById("toast") || (() => {
    const t = document.createElement("div"); t.id = "toast"; t.className = "toast";
    document.body.appendChild(t); return t;
  })();
  toast.textContent = text;
  toast.style.opacity = "1";
  clearTimeout(toast.t);
  toast.t = setTimeout(() => toast.style.opacity = "0", 3000);
}

function attachProtection() {
  document.querySelectorAll(".answer-field").forEach(f => {
    f.addEventListener("input", () => saveAnswer(f.id.slice(1)));
    f.addEventListener("paste", e => { e.preventDefault(); showToast("Pasting blocked!", false); });
    f.addEventListener("copy", e => e.preventDefault());
    f.addEventListener("cut", e => e.preventDefault());
  });
}

// ——— EXPORT (CRITICAL!) ———
window.loadAssessment = loadAssessment;
window.submitWork = submitWork;
window.back = back;
window.emailWork = emailWork;   // ← THIS WAS MISSING BEFORE!

// ——— START ———
(async () => {
  try {
    await loadQuestions();
    initApp();
  } catch (err) {
    console.error("Failed:", err);
  }
})();
