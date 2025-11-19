/* script.js – US 24355 app: FINAL + DEADLINE + HINTS ONLY UNDER QUESTIONS */
// ------------------------------------------------------------
// Local storage – now dynamic & versioned
// ------------------------------------------------------------
let STORAGE_KEY;               // will be set after questions load
let data = { answers: {} };    // default

function initStorage(appId, version = 'noversion') {
  STORAGE_KEY = `${appId}_${version}_DATA`;

  // ---- migrate old TECH_DATA (run once) ----
  const OLD_KEY = "TECH_DATA";
  if (localStorage.getItem(OLD_KEY) && !localStorage.getItem(STORAGE_KEY)) {
    try {
      const old = JSON.parse(localStorage.getItem(OLD_KEY));
      if (old?.answers) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(old));
        localStorage.removeItem(OLD_KEY);
        console.info(`Migrated ${OLD_KEY} → ${STORAGE_KEY}`);
      }
    } catch (_) {}
  }
  // ---- load current data ----
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    data = raw ? JSON.parse(raw) : { answers: {} };
  } catch (_) {
    data = { answers: {} };
  }
  if (!data.answers) data.answers = {};
}

// ------------------------------------------------------------
// State
// ------------------------------------------------------------
let currentAssessment = null;
let finalData = null;

// ------------------------------------------------------------
// XOR obfuscation
// ------------------------------------------------------------
const XOR_KEY = 42;
const xor = s =>
  btoa(
    [...s]
      .map(c => String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY))
      .join("")
  );
const unxor = s => {
  try {
    return atob(s)
      .split("")
      .map(c => String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY))
      .join("");
  } catch (_) {
    return "";
  }
};

// ------------------------------------------------------------
// Globals
// ------------------------------------------------------------
let APP_TITLE, APP_SUBTITLE, TEACHERS, ASSESSMENTS;
let DEADLINE = null; // from questions.json.DEADLINE

// ------------------------------------------------------------
// DEBUG MODE
// ------------------------------------------------------------
const DEBUG = true; // ← Set to false in production

// ------------------------------------------------------------
// Requirements
// ------------------------------------------------------------
const MIN_PCT_FOR_SUBMIT = 100; 
// Change this to e.g. 80 if you want 80% or better

// ------------------------------------------------------------
// Load questions.json (now also extracts APP_ID & VERSION & DEADLINE)
// ------------------------------------------------------------
async function loadQuestions() {
  const loadingEl = document.getElementById("loading");
  if (loadingEl) loadingEl.textContent = "Loading questions…";
  try {
    const res = await fetch("questions.json?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (DEBUG) console.log("JSON loaded:", json);

    // ---- read APP_ID & VERSION ----
    const appId = json.APP_ID;
    const version = json.VERSION || "noversion";
    if (!appId) throw new Error("questions.json missing APP_ID");
    initStorage(appId, version);   // ← creates STORAGE_KEY & loads data

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
    if (DEBUG) console.log("ASSESSMENTS ready:", ASSESSMENTS);
  } catch (err) {
    console.error("Failed to load questions.json:", err);
    const msg = `
      <div style="text-align:center;padding:40px;color:#e74c3c;font-family:sans-serif;">
        <h2>Failed to load assessment</h2>
        <p><strong>Error:</strong> ${err.message}</p>
        <p>Check: <code>questions.json</code> exists, valid JSON, and you're using a web server.</p>
      </div>`;
    document.body.innerHTML = msg;
    throw err;
  } finally {
    if (loadingEl) loadingEl.remove();
  }
}

// ------------------------------------------------------------
// initApp
// ------------------------------------------------------------
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

  // Build teacher options
  TEACHERS.forEach(t => {
    const o = document.createElement("option");
    o.value = t.email;
    o.textContent = t.name;
    teacherSel.appendChild(o);
  });

  // Restore teacher selection if saved
  if (data.teacher) {
    teacherSel.value = data.teacher;
    if (teacherSel.value !== data.teacher) {
      const o = document.createElement("option");
      o.value = data.teacher;
      o.textContent = data.teacher;
      teacherSel.appendChild(o);
      teacherSel.value = data.teacher;
    }
  }

  // Auto-save when teacher changes
  teacherSel.addEventListener("change", saveStudentInfo);

  if (data.id) {
    document.getElementById("locked-msg").classList.remove("hidden");
    document.getElementById("locked-id").textContent = data.id;
    idEl.readOnly = true;
  }

  ASSESSMENTS.forEach((a, i) => {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = `${a.title} – ${a.subtitle}`;
    assSel.appendChild(o);
  });

  // NEW: set up firstSeen + deadline banner
  setupDeadlineBanner();
  // Also apply lock if already overdue
  applyDeadlineLockIfNeeded();
}

// ------------------------------------------------------------
// Deadline lock helpers
// ------------------------------------------------------------
function lockAllFieldsForDeadline() {
  // Lock answer fields (but keep them visible)
  document.querySelectorAll(".answer-field").forEach(f => {
    f.readOnly = true;              // can see but not edit
    f.classList.add("locked-field"); // optional for styling
  });

  // Lock student info
  const nameEl = document.getElementById("name");
  const idEl = document.getElementById("id");
  if (nameEl) nameEl.readOnly = true;
  if (idEl) idEl.readOnly = true;

  // Lock selectors
  const teacherSel = document.getElementById("teacher");
  const assSel = document.getElementById("assessmentSelector");
  if (teacherSel) teacherSel.disabled = true;
  if (assSel) assSel.disabled = true;

  // Lock buttons (requires these IDs in your HTML)
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.disabled = true;

  const emailBtn = document.getElementById("emailBtn");
  if (emailBtn) emailBtn.disabled = true;

  showToast("Deadline has passed – fields are now locked.", false);
}

function applyDeadlineLockIfNeeded() {
  const info = getDeadlineStatus(new Date());
  if (info && info.status === "overdue") {
    lockAllFieldsForDeadline();
  }
}

// ------------------------------------------------------------
// Core
// ------------------------------------------------------------
function saveStudentInfo() {
  data.name = document.getElementById("name").value.trim();
  data.id = document.getElementById("id").value.trim();
  data.teacher = document.getElementById("teacher").value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadAssessment() {
  const idx = document.getElementById("assessmentSelector").value;
  if (idx === "") return;
  saveStudentInfo();
  currentAssessment = ASSESSMENTS[idx];
  const container = document.getElementById("questions");
  container.innerHTML = `
    <div class="assessment-header">
      <h2>${currentAssessment.title}</h2>
      <p>${currentAssessment.subtitle}</p>
    </div>`;
  currentAssessment.questions.forEach(q => {
    const saved = data.answers[currentAssessment.id]?.[q.id]
      ? unxor(data.answers[currentAssessment.id][q.id])
      : "";
    const field =
      q.type === "long"
        ? `<textarea rows="5" id="a${q.id}" class="answer-field">${saved}</textarea>`
        : `<input type="text" id="a${q.id}" value="${saved}" class="answer-field" autocomplete="off">`;
    const div = document.createElement("div");
    div.className = "q";
    div.id = "q-" + q.id; 
    div.innerHTML = `
      <strong>${q.id.toUpperCase()} (${q.maxPoints} pt${q.maxPoints > 1 ? "s" : ""})</strong><br>
      ${q.text}<br>
      ${q.image ? `<img src="${q.image}" class="q-img" alt="Question image for ${q.id}">` : ""}
      ${field}`;
    container.appendChild(div);
  });
  attachProtection();

  // 🔒 In case the deadline is already passed, lock new fields too
  applyDeadlineLockIfNeeded();
}

function saveAnswer(qid) {
  const el = document.getElementById("a" + qid);
  if (!el) return;
  const val = el.value.trim();
  if (!data.answers[currentAssessment.id]) data.answers[currentAssessment.id] = {};
  data.answers[currentAssessment.id][qid] = xor(val);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function getAnswer(id) {
  const raw = data.answers[currentAssessment.id]?.[id] || "";
  return raw ? unxor(raw).trim() : "";
}

// ------------------------------------------------------------
// GRADING
// ------------------------------------------------------------
function gradeIt() {
  let total = 0;
  const results = [];
  currentAssessment.questions.forEach(q => {
    const ans = getAnswer(q.id);
    let earned = 0;
    if (q.rubric && ans) {
      q.rubric.forEach(r => {
        r.check.lastIndex = 0;
        if (r.check.test(ans)) {
          earned += r.points;
          if (DEBUG) console.log(`Match: ${q.id} → "${ans}" → +${r.points}`);
        }
      });
    }
    earned = Math.min(earned, q.maxPoints);
    total += earned;
    const isCorrect = earned === q.maxPoints;
    results.push({
      id: q.id.toUpperCase(),
      question: q.text,
      answer: ans || "(blank)",
      earned,
      max: q.maxPoints,
      markText: isCorrect ? "Correct" : earned > 0 ? "Partial" : "Incorrect",
      hint: q.hint || ""
    });
  });
  return { total, results };
}

// ------------------------------------------------------------
// Colour question cards + show hints UNDER questions only
// ------------------------------------------------------------
function colourQuestions(results) {
  results.forEach(r => {
    // r.id is from gradeIt(): q.id.toUpperCase(), e.g. "Q1" or "MAT1_Q1"
    const qid = r.id.toLowerCase(); // back to "q1", "mat1_q1"
    const box = document.getElementById("q-" + qid);
    if (!box) return;

    // Clear previous state
    box.classList.remove("correct", "partial", "wrong");

    // Decide status from marks
    const status =
      r.earned === r.max ? "correct" :
      r.earned > 0       ? "partial" :
                           "wrong";

    box.classList.add(status);

    // ----- HINT UNDER QUESTION (ON FORM ONLY) -----
    const hintClass = "hint-inline";
    let hintEl = box.querySelector("." + hintClass);

    if (r.earned < r.max && r.hint) {
      // Needs a hint: create/update the inline hint element
      if (!hintEl) {
        hintEl = document.createElement("div");
        hintEl.className = hintClass;
        box.appendChild(hintEl);
      }
      hintEl.innerHTML = `<strong>Hint:</strong> ${r.hint}`;
    } else {
      // Fully correct or no hint: remove inline hint if it exists
      if (hintEl) {
        hintEl.remove();
      }
    }
  });
}

// ------------------------------------------------------------
// DEADLINE / COUNTDOWN LOGIC
// ------------------------------------------------------------
// Returns an object describing deadline vs "this run" of the app.
//
// Uses:
//
// - DEADLINE.day, DEADLINE.month (no year)
//
// Output example:
// {
//   status: "upcoming" | "today" | "overdue",
//   daysLeft: number,       // for upcoming; 0 for today/overdue
//   overdueDays: number,    // for overdue; 0 otherwise
//   deadlineDate: Date,     // with a concrete year
//   label: string,          // DEADLINE.label or default
//   dateStr: "dd/mm/yyyy"
// }
function getDeadlineStatus(today = new Date()) {
  if (!DEADLINE || typeof DEADLINE.day !== "number" || typeof DEADLINE.month !== "number") {
    return null;
  }

  const day = DEADLINE.day;
  const monthIndex = DEADLINE.month - 1; // JS months 0–11

  // Use the current year so it resets every January 1st
  const baseYear = today.getFullYear();
  const deadlineDate = new Date(baseYear, monthIndex, day);

  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const deadlineMid = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate());

  const dayDiff = Math.floor((deadlineMid - todayMid) / MS_PER_DAY);
  let status, daysLeft = 0, overdueDays = 0;

  if (dayDiff > 0) {
    status = "upcoming";
    daysLeft = dayDiff;
  } else if (dayDiff === 0) {
    status = "today";
  } else {
    status = "overdue";
    overdueDays = -dayDiff;
  }

  const label = DEADLINE.label || "Deadline";
  const dateStr = `${String(day).padStart(2, "0")}/${String(DEADLINE.month).padStart(2, "0")}/${deadlineDate.getFullYear()}`;

  return { status, daysLeft, overdueDays, deadlineDate: deadlineMid, label, dateStr };
}

function setupDeadlineBanner() {
  const banner = document.getElementById("deadline-banner");
  if (!banner || !DEADLINE) return;

  // Ensure we have a "firstSeen" date for this run
  if (!data.firstSeen) {
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    data.firstSeen = todayStr;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  const today = new Date();
  const status = getDeadlineStatus(today);
  if (!status) {
    banner.classList.add("hidden");
    return;
  }

  const { status: st, daysLeft, overdueDays, label, dateStr } = status;

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  let daysSinceStart = null;
  if (data.firstSeen) {
    const fs = new Date(data.firstSeen);
    if (!isNaN(fs.getTime())) {
      const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const fsMid = new Date(fs.getFullYear(), fs.getMonth(), fs.getDate());
      daysSinceStart = Math.floor((todayMid - fsMid) / MS_PER_DAY);
    }
  }

  let text = "";
  let cls = "info";

  if (st === "upcoming") {
    if (daysLeft <= 7) cls = "hot";
    else if (daysLeft <= 28) cls = "warn";
    else cls = "info";

    text = `${label}: ${dateStr} – ${daysLeft} day${daysLeft === 1 ? "" : "s"} left.`;
    if (daysSinceStart !== null && daysSinceStart >= 0) {
      text += ` You started ${daysSinceStart} day${daysSinceStart === 1 ? "" : "s"} ago.`;
    }

    if (daysLeft > 0 && daysLeft <= 7) {
      showToast(`Only ${daysLeft} day${daysLeft === 1 ? "" : "s"} left to complete this assessment.`, false);
    }
  } else if (st === "today") {
    cls = "hot";
    text = `${label}: ${dateStr} – Deadline is today!`;
    showToast("Deadline is today – make sure you submit your work.", false);
  } else if (st === "overdue") {
    cls = "over";
    text = `${label}: ${dateStr} – Deadline has passed. You are ${overdueDays} day${overdueDays === 1 ? "" : "s"} late.`;

    // 🔒 Lock everything once the deadline has passed
    lockAllFieldsForDeadline();
  }

  banner.textContent = text;
  banner.className = `deadline-banner ${cls}`;
  banner.classList.remove("hidden");
}

// ------------------------------------------------------------
// SUBMIT – HINTS ONLY UNDER QUESTIONS (NOT IN PDF)
// ------------------------------------------------------------
function submitWork() {
  saveStudentInfo();
  const name = data.name;
  const id = data.id;
  if (!name || !id || !data.teacher) return alert("Fill Name, ID and Teacher");
  if (!currentAssessment) return alert("Select an assessment");
  if (data.id && document.getElementById("id").value !== data.id)
    return alert("ID locked to: " + data.id);

  const { total, results } = gradeIt();

  // Colour question boxes + show inline hints on the form
  colourQuestions(results);

  const totalPoints = currentAssessment.questions.reduce((s, q) => s + q.maxPoints, 0);
  const pct = totalPoints ? Math.round((total / totalPoints) * 100) : 0;

  // Compute deadline status at time of submission (for both display + email lock)
  const deadlineInfo = getDeadlineStatus(new Date());

  // Lock / unlock email button based on percentage AND deadline
  const emailBtn = document.getElementById("emailBtn");
  if (emailBtn) {
    const canEmail = pct >= MIN_PCT_FOR_SUBMIT && (!deadlineInfo || deadlineInfo.status !== "overdue");
    emailBtn.disabled = !canEmail;
  }

  finalData = {
    name, id,
    teacherName: document.getElementById("teacher").selectedOptions[0].textContent,
    teacherEmail: data.teacher,
    assessment: currentAssessment,
    points: total,
    totalPoints,
    pct,
    submittedAt: new Date().toLocaleString("en-NZ", {
      timeZone: "Pacific/Auckland",
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    }),
    results,
    deadlineInfo: deadlineInfo || null
  };
  document.getElementById("student").textContent = name;
  document.getElementById("teacher-name").textContent = finalData.teacherName;
  document.getElementById("grade").innerHTML = `${total}/${totalPoints}<br><small>(${pct}%)</small>`;
  const ansDiv = document.getElementById("answers");
  ansDiv.innerHTML = `<h3>${currentAssessment.title}<br><small>${currentAssessment.subtitle}</small></h3>`;
  results.forEach(r => {
    const d = document.createElement("div");
    d.className = `feedback ${
      r.earned === r.max ? "correct" : r.earned > 0 ? "partial" : "wrong"
    }`;
    d.innerHTML = `
      <strong>${r.id}: ${r.earned}/${r.max} — ${r.markText}</strong><br>
      <div class="question-text"><em>${r.question}</em></div>
      Your answer: <em>${r.answer}</em><br>
      ${r.earned === r.max ? "Well done!" : "Review this question on the form."}`;
    // ^ no hint added here, so no hints in result section/PDF
    ansDiv.appendChild(d);
  });
  document.getElementById("form").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");
}

function back() {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("form").classList.remove("hidden");
}

// ------------------------------------------------------------
// Email / PDF – FIXED 900px LAYOUT + CORRECT MULTI-PAGE SLICING
// ------------------------------------------------------------
async function emailWork() {
  if (!finalData) return alert("Submit first!");

  // Enforce minimum percentage before emailing
  if (finalData.pct < MIN_PCT_FOR_SUBMIT) {
    return alert(`You must reach at least ${MIN_PCT_FOR_SUBMIT}% before emailing your work.`);
  }

  // Enforce deadline: no emailing after the deadline for this year
  const deadlineNow = getDeadlineStatus(new Date());
  if (deadlineNow && deadlineNow.status === "overdue") {
    return alert("The submission deadline has passed – emailing is now disabled until next year.");
  }

  const load = src => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });

  try {
    if (!window.html2canvas) await load("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
    if (!window.jspdf) await load("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  } catch (e) {
    return showToast("Failed to load PDF tools", false);
  }

  const { jsPDF } = window.jspdf;

  // 1. Create fixed 900px-wide clone
  const original = document.getElementById("result");
  const clone = original.cloneNode(true);
  const FIXED_WIDTH = 900;

  Object.assign(clone.style, {
    position: "absolute",
    left: "-9999px",
    top: "0",
    width: `${FIXED_WIDTH}px`,
    maxWidth: "none",
    background: "#fff",
    padding: "40px 30px",
    boxSizing: "border-box",
    fontSize: "16px",
    lineHeight: "1.5"
  });
  clone.querySelectorAll(".btn-group, button").forEach(b => b.remove());
  document.body.appendChild(clone);

  // 2. Render canvas
  const canvas = await html2canvas(clone, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#fff",
    logging: false,
    width: FIXED_WIDTH,
    height: clone.scrollHeight,
    windowWidth: FIXED_WIDTH
  });
  document.body.removeChild(clone);

  // 3. Load crest (optional)
  let crestImg = null;
  const tryLoad = src => new Promise(r => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src + "?t=" + Date.now();
    img.onload = () => r(img);
    img.onerror = () => r(null);
  });
  crestImg = await tryLoad("crest_shield.png") || await tryLoad("icon-512.png");

  // 4. Create PDF
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = 210;   // A4 = 210 × 297 mm
  const pageHeight = 297;
  const margin = 10;
  const usableWidth = pageWidth - 2 * margin;

  const addHeader = () => {
    pdf.setFillColor(110, 24, 24);
    pdf.rect(0, 0, pageWidth, 35, "F");
    if (crestImg) {
      const h = 25;
      const w = h * crestImg.width / crestImg.height;
      pdf.addImage(crestImg, "PNG", pageWidth - w - 8, 5, w, h);
    }
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(APP_TITLE, 10, 20);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(APP_SUBTITLE, 10, 28);
  };

  addHeader();

  // Student info + score
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.text(
    `${finalData.name} (ID: ${finalData.id}) • ${finalData.teacherName} • ${finalData.submittedAt}`,
    10,
    42
  );
  pdf.setFillColor(240, 248, 255);
  pdf.rect(10, 47, 60, 12, "F");
  pdf.setTextColor(110, 24, 24);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${finalData.points}/${finalData.totalPoints} (${finalData.pct}%)`, 14, 55);

  // NEW: indicate if deadline was missed (late)
  let infoY = 62;
  if (finalData.deadlineInfo && finalData.deadlineInfo.status === "overdue" && finalData.deadlineInfo.overdueDays > 0) {
    pdf.setTextColor(231, 76, 60); // red
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Late submission: ${finalData.deadlineInfo.overdueDays} day${finalData.deadlineInfo.overdueDays === 1 ? "" : "s"} after deadline (${finalData.deadlineInfo.dateStr}).`,
      10,
      infoY
    );
  } else if (finalData.deadlineInfo && finalData.deadlineInfo.status === "today") {
    pdf.setTextColor(243, 156, 18); // amber
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(`Submitted on the deadline date (${finalData.deadlineInfo.dateStr}).`, 10, infoY);
  } else if (finalData.deadlineInfo && finalData.deadlineInfo.status === "upcoming") {
    pdf.setTextColor(52, 152, 219);
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(
      `Submitted ${finalData.deadlineInfo.daysLeft} day${finalData.deadlineInfo.daysLeft === 1 ? "" : "s"} before deadline (${finalData.deadlineInfo.dateStr}).`,
      10,
      infoY
    );
  }

  // 5. CORRECT multi-page slicing
  const imgWidth = usableWidth;
  const imgHeight = canvas.height * (imgWidth / canvas.width);   // height in mm

  const pageContentHeight = pageHeight - 65 - 15;  // top 65mm + bottom 15mm margin

  let positionY = 65;   // start below header + student info

  let remainingHeight = imgHeight;
  let sourceY = 0;      // where we are cropping from the original canvas (in mm)

  while (remainingHeight > 0) {
    const currentSliceHeight = Math.min(pageContentHeight, remainingHeight);

    // Crop the correct portion of the canvas
    const sourceSliceHeightPx = (currentSliceHeight / imgHeight) * canvas.height;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = sourceSliceHeightPx;
    const ctx = tempCanvas.getContext("2d");
    ctx.drawImage(
      canvas,
      0,
      (sourceY / imgHeight) * canvas.height,
      canvas.width,
      sourceSliceHeightPx,
      0,
      0,
      canvas.width,
      sourceSliceHeightPx
    );

    const sliceDataUrl = tempCanvas.toDataURL("image/jpeg", 0.95);

    pdf.addImage(sliceDataUrl, "JPEG", margin, positionY, imgWidth, currentSliceHeight);

    remainingHeight -= currentSliceHeight;
    sourceY += currentSliceHeight;

    if (remainingHeight > 0) {
      pdf.addPage();
      addHeader();
      positionY = 45;
    }
  }

  // Footer on last page
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text("Generated by Pukekohe High School Technology Department", 10, pageHeight - 8);

  // 6. Save & share
  const filename = `${finalData.name.replace(/\s+/g, "_")}_${finalData.assessment.id}_${finalData.pct}%.pdf`;
  const file = new File([pdf.output("blob")], filename, { type: "application/pdf" });
  await sharePDF(file);
}

// ------------------------------------------------------------
// Share / Email
// ------------------------------------------------------------
async function sharePDF(file) {
  if (!finalData) return;
  const subject = `${finalData.assessment.title} – ${finalData.name} (${finalData.id})`;
  const fullBody = buildEmailBody(finalData);
  const shareData = { files: [file], title: subject, text: fullBody };
  if (navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      showToast("Shared");
      return;
    } catch (err) {
      if (!String(err).includes("AbortError")) showToast("Share failed", false);
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  const shortBody = [
    `Assessment: ${finalData.assessment.title}`,
    `Student: ${finalData.name} (ID: ${finalData.id})`,
    `Teacher: ${finalData.teacherName}`,
    `Score: ${finalData.points}/${finalData.totalPoints} (${finalData.pct}%)`,
    "",
    "Full report attached as PDF."
  ].join("\n");
  window.location.href = `mailto:${encodeURIComponent(finalData.teacherEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shortBody)}`;
  showToast("Downloaded + email opened");
}

function buildEmailBody(fd) {
  const l = [];
  l.push(`Pukekohe High School – ${APP_TITLE}`);
  l.push(APP_SUBTITLE);
  l.push("");
  l.push(`Assessment: ${fd.assessment.title} – ${fd.assessment.subtitle}`);
  l.push(`Student: ${fd.name} (ID: ${fd.id})`);
  l.push(`Teacher: ${fd.teacherName} <${fd.teacherEmail}>`);
  l.push(`Submitted: ${fd.submittedAt}`);
  if (fd.deadlineInfo) {
    if (fd.deadlineInfo.status === "overdue" && fd.deadlineInfo.overdueDays > 0) {
      l.push(`Deadline: ${fd.deadlineInfo.dateStr} – submitted ${fd.deadlineInfo.overdueDays} day(s) late.`);
    } else if (fd.deadlineInfo.status === "today") {
      l.push(`Deadline: ${fd.deadlineInfo.dateStr} – submitted on the deadline date.`);
    } else if (fd.deadlineInfo.status === "upcoming") {
      l.push(`Deadline: ${fd.deadlineInfo.dateStr} – submitted ${fd.deadlineInfo.daysLeft} day(s) early.`);
    }
  }
  l.push("");
  l.push(`Score: ${fd.points}/${fd.totalPoints} (${fd.pct}%)`);
  l.push("=".repeat(60));
  l.push("");
  fd.results.forEach(r => {
    l.push(`${r.id}: ${r.earned}/${r.max} — ${r.markText}`);
    l.push(`Question: ${r.question}`);
    l.push(`Answer: ${r.answer}`);
    // No hint lines here – keep hints only on the form
    l.push("-".repeat(60));
    l.push("");
  });
  l.push("Generated by Pukekohe High School Technology Dept");
  return l.join("\n");
}

// ------------------------------------------------------------
// Toast
// ------------------------------------------------------------
function showToast(text, ok = true) {
  const toast = document.getElementById("toast") || createToastElement();
  toast.textContent = text;
  toast.classList.toggle("error", !ok);
  toast.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => (toast.style.display = "none"), 3200);
}

function createToastElement() {
  const t = document.createElement("div");
  t.id = "toast";
  t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:#2c3e50;color:#fff;padding:12px 24px;border-radius:30px;font-size:.95rem;z-index:1000;box-shadow:0 4px 12px rgba(0,0,0,.2);display:none;';
  document.body.appendChild(t);
  return t;
}

// ------------------------------------------------------------
// Protection
// ------------------------------------------------------------
const PASTE_BLOCKED_MESSAGE = "Pasting blocked!";
async function clearClipboard() {
  if (!navigator.clipboard?.writeText) return;
  try { await navigator.clipboard.writeText(""); } catch (_) {}
}
(async () => { await clearClipboard(); })();
function attachProtection() {
  document.querySelectorAll(".answer-field").forEach(f => {
    f.addEventListener("input", () => saveAnswer(f.id.slice(1)));
    f.addEventListener("paste", e => { e.preventDefault(); showToast(PASTE_BLOCKED_MESSAGE, false); clearClipboard(); });
    f.addEventListener("copy", e => e.preventDefault());
    f.addEventListener("cut", e => e.preventDefault());
  });
}
document.addEventListener("contextmenu", e => {
  if (!e.target.matches("input, textarea")) e.preventDefault();
});

// ------------------------------------------------------------
// Export
// ------------------------------------------------------------
window.loadAssessment = loadAssessment;
window.submitWork = submitWork;
window.back = back;
window.emailWork = emailWork;

// ------------------------------------------------------------
// Start
// ------------------------------------------------------------
(async () => {
  try {
    await loadQuestions();
    initApp();
  } catch (err) {
    console.error("App failed to start:", err);
  }
})();
