/* script.js – US 24355 app: FINAL + A4 PDF + HINTS ON RESULTS ONLY */
// ------------------------------------------------------------
// Local storage – now dynamic & versioned
// ------------------------------------------------------------
let STORAGE_KEY;               // will be set after questions load
//let data = { answers: {} };    // default
let data = { answers: {}, marks: {} };    // default now also tracks per-question status

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
    data = raw ? JSON.parse(raw) : { answers: {}, marks: {} };
  } catch (_) {
    data = { answers: {}, marks: {} };
  }

  // make sure both structures exist even in old saved data
  if (!data.answers) data.answers = {};
  if (!data.marks)   data.marks   = {};

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

// ------------------------------------------------------------
// DEBUG MODE
// ------------------------------------------------------------
const DEBUG = true; // ← Set to false in production

// ------------------------------------------------------------
// Load questions.json (now also extracts APP_ID & VERSION)
// ------------------------------------------------------------
async function loadQuestions() {
  const loadingEl = document.getElementById("loading");
  if (loadingEl) loadingEl.textContent = "Loading questions…";
  try {
    const res = await fetch("questions.json?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (DEBUG) console.log("JSON loaded:", json);

    // ---- NEW: read APP_ID & VERSION ----
    const appId = json.APP_ID;
    const version = json.VERSION || "noversion";
    if (!appId) throw new Error("questions.json missing APP_ID");
    initStorage(appId, version);   // ← creates STORAGE_KEY & loads data

    APP_TITLE = json.APP_TITLE;
    APP_SUBTITLE = json.APP_SUBTITLE;
    TEACHERS = json.TEACHERS;
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
  nameEl.value = data.name || "";
  idEl.value = data.id || "";
  if (data.teacher) document.getElementById("teacher").value = data.teacher;
  if (data.id) {
    document.getElementById("locked-msg").classList.remove("hidden");
    document.getElementById("locked-id").textContent = data.id;
    idEl.readOnly = true;
  }
  const teacherSel = document.getElementById("teacher");
  TEACHERS.forEach(t => {
    const o = document.createElement("option");
    o.value = t.email;
    o.textContent = t.name;
    teacherSel.appendChild(o);
  });
  const assSel = document.getElementById("assessmentSelector");
  ASSESSMENTS.forEach((a, i) => {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = `${a.title} – ${a.subtitle}`;
    assSel.appendChild(o);
  });
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
div.dataset.qid = q.id; // ← so we can find this question box later
div.innerHTML = `
  <strong>${q.id.toUpperCase()} (${q.maxPoints} pt${q.maxPoints > 1 ? "s" : ""})</strong><br>
  ${q.text}<br>
  ${q.image ? `<img src="${q.image}" class="q-img" alt="Question image for ${q.id}">` : ""}
  ${field}`;
container.appendChild(div);
  });
  attachProtection();
  applyQuestionStatuses();
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
// SUBMIT – HINTS ONLY ON RESULTS + ONLY IF WRONG
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
  const totalPoints = currentAssessment.questions.reduce((s, q) => s + q.maxPoints, 0);
  const pct = totalPoints ? Math.round((total / totalPoints) * 100) : 0;
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
    results
  };
  document.getElementById("student").textContent = name;
  document.getElementById("teacher-name").textContent = finalData.teacherName;
  document.getElementById("grade").innerHTML = `${total}/${totalPoints}<br><small>(${pct}%)</small>`;
  const ansDiv = document.getElementById("answers");
  ansDiv.innerHTML = `<h3>${currentAssessment.title}<br><small>${currentAssessment.subtitle}</small></h3>`;
  results.forEach(r => {
    const d = document.createElement("div");
    const q = currentAssessment.questions.find(q => q.id === r.id.toLowerCase());
    d.className = `feedback ${
      r.earned === r.max ? "correct" : r.earned > 0 ? "partial" : "wrong"
    }`;
    const hintLine = (r.earned < r.max && q?.hint)
      ? `<div class="hint-result"><strong>Hint:</strong> ${q.hint}</div>`
      : "";
    d.innerHTML = `
      <strong>${r.id}: ${r.earned}/${r.max} — ${r.markText}</strong><br>
      <div class="question-text"><em>${r.question}</em></div>
      Your answer: <em>${r.answer}</em><br>
      ${hintLine}
      ${r.earned === r.max ? "Well done!" : "Review the hint above."}`;
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
// Email / PDF – A4 + CREST
// ------------------------------------------------------------
async function emailWork() {
  if (!finalData) return alert("Submit first!");
  const load = src => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = res;
    s.onerror = rej;
    document.head.appendChild(s);
  });
  try {
    await load("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    await load("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  } catch (e) {
    return showToast("Failed to load PDF tools", false);
  }
  const { jsPDF } = window.jspdf;
  let crestImg = null;
  async function tryLoad(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = src + "?t=" + Date.now();
      img.onload = () => resolve(img);
      img.onerror = reject;
    });
  }
  try {
    try { crestImg = await tryLoad("icon-512.png"); }
    catch { crestImg = await tryLoad("icon-192.png"); }
  } catch (e) {
    crestImg = null;
  }
  const resultEl = document.getElementById("result");
  const btns = document.querySelectorAll(".btn-group");
  btns.forEach(b => b.style.display = "none");
  const canvas = await html2canvas(resultEl, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff"
  });
  btns.forEach(b => b.style.display = "");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 28;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const addHeader = () => {
    const leftMargin = 10;
    const rightMargin = 4;
    pdf.setFillColor(110, 24, 24);
    pdf.rect(0, 0, pageWidth, 35, "F");
    let textRightLimit = pageWidth - rightMargin;
    if (crestImg) {
      const maxHeight = 25;
      const aspect = crestImg.width / crestImg.height;
      const crestHeight = maxHeight;
      const crestWidth = maxHeight * aspect;
      const crestX = pageWidth - crestWidth - rightMargin;
      const crestY = 5;
      pdf.addImage(crestImg, "PNG", crestX, crestY, crestWidth, crestHeight);
      textRightLimit = crestX - 3;
    }
    const textMaxWidth = textRightLimit - leftMargin;
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(APP_TITLE, leftMargin, 20, { maxWidth: textMaxWidth });
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(12);
    pdf.text(APP_SUBTITLE, leftMargin, 28, { maxWidth: textMaxWidth });
  };
  addHeader();
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.text(
    `${finalData.name} (ID: ${finalData.id}) • ${finalData.teacherName} <${finalData.teacherEmail}> • ${finalData.submittedAt}`,
    14,
    40
  );
  pdf.setFillColor(240, 248, 255);
  pdf.rect(14, 45, 60, 15, "F");
  pdf.setTextColor(110, 24, 24);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${finalData.points}/${finalData.totalPoints} (${finalData.pct}%)`, 18, 55);
  let yPos = 70;
  const avail = pageHeight - yPos - 20;
  const imgData = canvas.toDataURL("image/png");
  if (imgHeight <= avail) {
    pdf.addImage(imgData, "PNG", 14, yPos, imgWidth, imgHeight);
  } else {
    let left = imgHeight;
    let srcY = 0;
    while (left > 0) {
      const sliceH = Math.min(avail, left);
      const scaledH = (sliceH * canvas.width) / imgWidth;
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = scaledH;
      const ctx = sliceCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, srcY, canvas.width, scaledH, 0, 0, canvas.width, scaledH);
      pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 14, yPos, imgWidth, sliceH);
      left -= sliceH;
      srcY += scaledH;
      if (left > 0) {
        pdf.addPage();
        addHeader();
        yPos = 50;
      }
    }
  }
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Generated by Pukekohe High Tech Dept", 14, pageHeight - 10);
  const filename = `${finalData.name.replace(/\s+/g, "_")}_${finalData.assessment.id}_${finalData.pct}%.pdf`;
  const pdfBlob = pdf.output("blob");
  const file = new File([pdfBlob], filename, { type: "application/pdf" });
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
  a.href = url; a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  const shortBody = [
    `Assessment: ${finalData.assessment.title}`,
    `Student: ${finalData.name} (ID: ${finalData.id})`,
    `Teacher: ${finalData.teacherName}`,
    `Score: ${finalData.points}/${finalData.totalPoints} (${finalData.pct}%)`,
    "", "Full report attached as PDF."
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
  l.push("");
  l.push(`Score: ${fd.points}/${fd.totalPoints} (${fd.pct}%)`);
  l.push("=".repeat(60));
  l.push("");
  fd.results.forEach(r => {
    l.push(`${r.id}: ${r.earned}/${r.max} — ${r.markText}`);
    l.push(`Question: ${r.question}`);
    l.push(`Answer: ${r.answer}`);
    const q = fd.assessment.questions.find(q => q.id.toUpperCase() === r.id);
    if (r.earned < r.max && q?.hint) l.push(`Hint: ${q.hint}`);
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
