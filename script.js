/* script.js – US 24355 Materials Technology Assessment App (2025) */
/* Updated: View-only mode after deadline + full offline PWA support */

let STORAGE_KEY;
let data = { answers: {} };

function initStorage(appId, version = 'noversion') {
  STORAGE_KEY = `${appId}_${version}_DATA`;

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

let APP_TITLE, APP_SUBTITLE, TEACHERS, ASSESSMENTS;
let DEADLINE = null;

const DEBUG = true;
const MIN_PCT_FOR_SUBMIT = 100;

async function loadQuestions() {
  const loadingEl = document.getElementById("loading");
  if (loadingEl) loadingEl.textContent = "Loading questions…";
  try {
    const res = await fetch("questions.json?t=" + Date.now(), { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (DEBUG) console.log("JSON loaded:", json);

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
    document.body.innerHTML = `
      <div style="text-align:center;padding:40px;color:#e74c3c;font-family:sans-serif;">
        <h2>Failed to load assessment</h2>
        <p><strong>Error:</strong> ${err.message}</p>
        <p>Check: <code>questions.json</code> exists and is valid JSON.</p>
      </div>`;
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

  setupDeadlineBanner();
  applyDeadlineLockIfNeeded();
}

function getDeadlineStatus(now = new Date()) {
  if (!DEADLINE) return null;
  const dl = new Date(now.getFullYear(), DEADLINE.month - 1, DEADLINE.day, 23, 59, 59);
  const diffDays = Math.floor((dl - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: "overdue",
      overdueDays: -diffDays,
      dateStr: dl.toLocaleDateString("en-NZ")
    };
  } if (diffDays === 0) {
    return { status: "today", dateStr: dl.toLocaleDateString("en-NZ") };
  } else {
    return {
      status: "upcoming",
      daysLeft: diffDays,
      dateStr: dl.toLocaleDateString("en-NZ")
    };
  }
}

function setupDeadlineBanner() {
  const banner = document.getElementById("deadline-banner");
  if (!banner || !DEADLINE) {
    banner?.classList.add("hidden");
    return;
  }

  const info = getDeadlineStatus();
  banner.classList.remove("hidden", "info", "warn", "hot", "over");

  if (!info) {
    banner.classList.add("info");
    banner.textContent = `No deadline set — you can submit anytime.";
  } else if (info.status === "overdue") {
    banner.classList.add("over");
    banner.textContent = `Deadline was ${info.dateStr} — ${info.overdueDays} day${info.overdueDays > 1 ? "s" : ""} ago. View-only mode.`;
  } else if (info.status === "today") {
    banner.classList.add("hot");
    banner.textContent = `Due TODAY — ${info.dateStr}`;
  } else {
    banner.classList.add("warn");
    banner.textContent = `Due in ${info.daysLeft} day${info.daysLeft > 1 ? "s" : ""} — ${info.dateStr}`;
  }
}

function applyDeadlineLockIfNeeded() {
  const info = getDeadlineStatus(new Date());
  if (!info || info.status !== "overdue") return;

  // Lock editing but allow viewing
  document.querySelectorAll(".answer-field").forEach(f => {
    f.readOnly = true;
    f.classList.add("locked-field");
  });

  const nameEl = document.getElementById("name");
  const idEl = document.getElementById("id");
  const teacherSel = document.getElementById("teacher");

  if (nameEl) nameEl.readOnly = true;
  if (idEl) idEl.readOnly = true;
  if (teacherSel) teacherSel.disabled = true;

  // Keep assessment selector & Load button enabled for viewing
  const submitBtn = document.querySelector('.btn[onclick="loadAssessment()"]');
  if (loadBtn) loadBtn.disabled = false; // ensure it's clickable

  // Disable submit/email
  const submitBtn = document.querySelector('.btn[onclick="submitWork()"]');
  const emailBtn = document.getElementById("emailBtn");
  if (submitBtn) submitBtn.disabled = true;
  if (emailBtn) emailBtn.disabled = true;

  showToast("Deadline passed — view-only mode", false);
}

function saveStudentInfo() {
  data.name = document.getElementById("name").value.trim();
  data.id = document.getElementById("id").value.trim();
  data.teacher = document.getElementById("teacher").value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function saveAnswer(qid) {
  const field = document.getElementById("a" + qid);
  if (!field) return;
  const value = field.value;
  if (!data.answers[currentAssessment.id]) data.answers[currentAssessment.id] = {};
  data.answers[currentAssessment.id][qid] = value;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadAssessment() {
  const idx = document.getElementById("assessmentSelector").value;
  if (idx === "") {
    showToast("Please select an assessment", false);
    return;
  }

  saveStudentInfo();
  currentAssessment = ASSESSMENTS[idx];

  const container = document.getElementById("questions");
  container.innerHTML = "";

  currentAssessment.questions.forEach(q => {
    const div = document.createElement("div");
    div.className = "q";

    let html = `<strong>${q.text}</strong>`;
    if (q.image && q.image !== "blank.jpg") {
      html += `<img src="${q.image}" class="q-img" alt="Question image">`;
    }
    if (q.hint) {
      html += `<div class="hint-inline">Hint: ${q.hint}</div>`;
    }

    if (q.type === "mc") {
      q.options.forEach(opt => {
        const checked = (data.answers[currentAssessment.id]?.[q.id] || "") === opt ? "checked" : "";
        html += `
          <label style="display:block;margin:8px 0;">
            <input type="radio" name="${q.id}" value="${opt}" ${checked} onchange="saveAnswer('${q.id}');">
            ${opt}
          </label>`;
      });
    } else {
      const saved = (data.answers[currentAssessment.id]?.[q.id] || "");
      html += `<textarea class="answer-field" id="a${q.id}" placeholder="Type your answer here…" rows="4">${saved}</textarea>`;
    }

    div.innerHTML = html;
    container.appendChild(div);

    const field = document.getElementById("a" + q.id);
    if (field) {
      field.addEventListener("input", () => saveAnswer(q.id));
    }
  });

  document.getElementById("form").classList.add("hidden");
  document.getElementById("result").classList.add("hidden");
  container.classList.remove("hidden");

  attachProtection();

  // CRITICAL: Apply view-only lock if deadline passed
  const deadlineInfo = getDeadlineStatus(new Date());
  if (deadlineInfo && deadlineInfo.status === "overdue") {
    document.querySelectorAll(".answer-field").forEach(field => {
      field.readOnly = true;
      field.classList.add("locked-field");
    });

    const submitBtn = document.querySelector('.btn[onclick="submitWork()"]');
    if (submitBtn) submitBtn.disabled = true;

    showToast("Assessment loaded — view-only (deadline passed)", false);
  }
}

function attachProtection() {
  document.querySelectorAll(".answer-field").forEach(f => {
    f.addEventListener("input", () => saveAnswer(f.id.slice(1)));
    f.addEventListener("paste", e => {
      e.preventDefault();
      showToast("Pasting blocked!", false);
    });
    f.addEventListener("copy", e => e.preventDefault());
    f.addEventListener("cut", e => e.preventDefault());
  });
}

function submitWork() {
  saveStudentInfo();
  if (!currentAssessment) return;

  const answers = data.answers[currentAssessment.id] || {};
  let points = 0;
  let totalPoints = 0;

  const results = currentAssessment.questions.map(q => {
    const answer = (answers[q.id] || "").trim();
    let earned = 0;

    if (q.rubric) {
      q.rubric.forEach(rule => {
        if (rule.check.test(answer)) earned += rule.points;
      });
    }
    earned = Math.min(earned, q.maxPoints);
    points += earned;
    totalPoints += q.maxPoints;

    return {
      id: q.id,
      question: q.text.replace(/<[^>]+>/g, ""),
      answer,
      earned,
      max: q.maxPoints,
      markText: earned === q.maxPoints ? "Correct" : earned > 0 ? "Partial" : "Incorrect"
    };
  });

  const pct = Math.round((points / totalPoints) * 100);

  if (pct < MIN_PCT_FOR_SUBMIT) {
    showToast(`You need at least ${MIN_PCT_FOR_SUBMIT}% to submit`, false);
    return;
  }

  finalData = {
    name: data.name,
    id: data.id,
    teacherEmail: data.teacher,
    teacherName: document.querySelector("#teacher option:checked").textContent,
    assessment: currentAssessment,
    points,
    totalPoints,
    pct,
    results,
    submittedAt: new Date().toLocaleString("en-NZ"),
    deadlineInfo: getDeadlineStatus()
  };

  displayResults();
}

function displayResults() {
  document.getElementById("student").textContent = `${finalData.name} (${finalData.id})`;
  document.getElementById("teacher-name").textContent = finalData.teacherName;
  document.getElementById("grade").innerHTML = `${finalData.pct}<small>%</small>`;

  const container = document.getElementById("answers");
  container.innerHTML = "";

  finalData.results.forEach(r => {
    const div = document.createElement("div");
    div.className = `feedback ${r.markText.toLowerCase()}`;
    div.innerHTML = `
      <strong>${r.id} — ${r.earned}/${r.max} marks</strong>
      <p><em>${r.question}</em></p>
      <p><strong>Your answer:</strong> ${r.answer || "<em>no answer</em>"}</p>
    `;
    container.appendChild(div);
  });

  document.getElementById("form").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");

  if (finalData.deadlineInfo?.status === "overdue") {
    document.getElementById("emailBtn").disabled = true;
  }
}

async function emailWork() {
  if (!finalData) return;
  await generatePDF();
}

async function generatePDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - 2 * margin;

  const canvas = await html2canvas(document.querySelector(".container"), {
    scale: 2,
    useCORS: true,
    allowTaint: true
  });

  function addHeader() {
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(APP_TITLE, margin, 20);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(APP_SUBTITLE, margin, 28);

    pdf.setFontSize(14);
    pdf.text(`Student: ${finalData.name} (${finalData.id})`, margin, 40);
    pdf.text(`Teacher: ${finalData.teacherName}`, margin, 48);
    pdf.text(`Assessment: ${finalData.assessment.title}`, margin, 56);
    pdf.text(`Score: ${finalData.points}/${finalData.totalPoints} (${finalData.pct}%)`, margin, 64);
  }

  addHeader();

  let infoY = 80;
  if (finalData.deadlineInfo) {
    if (finalData.deadlineInfo.status === "overdue" && finalData.deadlineInfo.overdueDays > 0) {
      pdf.setTextColor(231, 76, 60);
      pdf.setFontSize(11);
      pdf.text(
        `Late submission: ${finalData.deadlineInfo.overdueDays} day${finalData.deadlineInfo.overdueDays === 1 ? "" : "s"} after deadline (${finalData.deadlineInfo.dateStr}).`,
        margin, infoY
      );
    } else if (finalData.deadlineInfo.status === "today") {
      pdf.setTextColor(243, 156, 18);
      pdf.text(`Submitted on the deadline date (${finalData.deadlineInfo.dateStr}).`, margin, infoY);
    } else if (finalData.deadlineInfo.status === "upcoming") {
      pdf.setTextColor(52, 152, 219);
      pdf.text(
        `Submitted ${finalData.deadlineInfo.daysLeft} day${finalData.deadlineInfo.daysLeft === 1 ? "" : "s"} before deadline (${finalData.deadlineInfo.dateStr}).`,
        margin, infoY
      );
    }
  }

  const imgWidth = usableWidth;
  const imgHeight = canvas.height * (imgWidth / canvas.width);
  const pageContentHeight = pageHeight - 65 - 15;

  let positionY = 65;
  let remainingHeight = imgHeight;
  let sourceY = 0;

  while (remainingHeight > 0) {
    const currentSliceHeight = Math.min(pageContentHeight, remainingHeight);
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

  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text("Generated by Pukekohe High School Technology Department", margin, pageHeight - 8);

  const filename = `${finalData.name.replace(/\s+/g, "_")}_${finalData.assessment.id}_${finalData.pct}%.pdf`;
  const file = new File([pdf.output("blob")], filename, { type: "application/pdf" });
  await sharePDF(file);
}

async function sharePDF(file) {
  if (!finalData) return;
  const subject = `${finalData.assessment.title} – ${finalData.name} (${finalData.id})`;
  const fullBody = buildEmailBody(finalData);
  const shareData = { files: [file], title: subject, text: fullBody };

  if (navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      showToast("Shared successfully");
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
  if (fd.deadlineInfo?.status === "overdue") {
    l.push(`Deadline: ${fd.deadlineInfo.dateStr} — submitted ${fd.deadlineInfo.overdueDays} day(s) late.`);
  }
  l.push("");
  l.push(`Score: ${fd.points}/${fd.totalPoints} (${fd.pct}%)`);
  l.push("=".repeat(60));
  l.push("");
  fd.results.forEach(r => {
    l.push(`${r.id}: ${r.earned}/${r.max} — ${r.markText}`);
    l.push(`Question: ${r.question}`);
    l.push(`Answer: ${r.answer || "(no answer)"}`);
    l.push("-".repeat(60));
    l.push("");
  });
  l.push("Generated by Pukekohe High School Technology Dept");
  return l.join("\n");
}

function showToast(text, ok = true) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    Object.assign(toast.style, {
      position: "fixed",
      bottom: "30px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#2c3e50",
      color: "#fff",
      padding: "12px 24px",
      borderRadius: "30px",
      fontSize: ".95rem",
      zIndex: "1000",
      boxShadow: "0 4px 12px rgba(0,0,0,.2)",
      display: "none"
    });
    document.body.appendChild(toast);
  }
  toast.textContent = text;
  toast.classList.toggle("error", !ok);
  toast.style.display = "block";
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.style.display = "none", 3200);
}

function back() {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("questions").innerHTML = "";
  document.getElementById("form").classList.remove("hidden");
  currentAssessment = null;
}

document.addEventListener("contextmenu", e => {
  if (!e.target.matches("input, textarea")) e.preventDefault();
});

window.loadAssessment = loadAssessment;
window.submitWork = submitWork;
window.back = back;
window.emailWork = emailWork;

(async () => {
  try {
    await loadQuestions();
    initApp();
  } catch (err) {
    console.error("App failed to start:", err);
  }
})();
