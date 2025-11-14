// =============================
// script.js – SECURE & DYNAMIC (PDF + Email)
// =============================

// =============================
// 1. CORE DATA & STORAGE
// =============================
const STORAGE_KEY = "TECH_DATA";
let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { answers: {} };
let currentAssessment = null;

// ----- XOR OBFUSCATION (light security) -----
const XOR_KEY = 42;                            // EDIT: change the XOR key
const xor = s => btoa([...s].map(c => String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY)).join(''));
const unxor = s => atob(s).split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ XOR_KEY)).join('');

// =============================
// 2. INITIAL UI SETUP
// =============================
document.getElementById("name").value = data.name || "";
document.getElementById("id").value   = data.id   || "";
if (data.teacher) document.getElementById("teacher").value = data.teacher;

// ----- LOCK ID WHEN ALREADY SAVED -----
if (data.id) {
  document.getElementById("locked-msg").classList.remove("hidden");
  document.getElementById("locked-id").textContent = data.id;
  document.getElementById("id").readOnly = true;
}

// ----- POPULATE TEACHER DROPDOWN -----
TEACHERS.forEach(t => {
  const o = document.createElement("option");
  o.value = t.email;
  o.textContent = t.name;
  document.getElementById("teacher").appendChild(o);
});

// ----- POPULATE ASSESSMENT SELECTOR -----
ASSESSMENTS.forEach((assess, i) => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = `${assess.title} – ${assess.subtitle}`;
  document.getElementById("assessmentSelector").appendChild(opt);
});

// =============================
// 3. STUDENT INFO & ASSESSMENT LOADING
// =============================
function saveStudentInfo() {
  data.name    = document.getElementById("name").value.trim();
  data.id      = document.getElementById("id").value.trim();
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
    const saved = data.answers[currentAssessment.id]?.[q.id] ? unxor(data.answers[currentAssessment.id][q.id]) : "";
    const div   = document.createElement("div");
    div.className = "q";

    const fieldHTML = q.type === "long"
      ? `<textarea rows="5" id="a${q.id}" class="answer-field">${saved}</textarea>`
      : `<input type="text" id="a${q.id}" value="${saved}" class="answer-field">`;

    div.innerHTML = `<strong>${q.id.toUpperCase()} (${q.maxPoints} pts)</strong><br>${q.text}<br>${fieldHTML}`;
    container.appendChild(div);
  });

  attachProtection();
}

// =============================
// 4. ANSWER SAVING & GRADING
// =============================
function saveAnswer(qid) {
  const val = document.getElementById("a" + qid).value;
  if (!data.answers[currentAssessment.id]) data.answers[currentAssessment.id] = {};
  data.answers[currentAssessment.id][qid] = xor(val);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function getAnswer(id) {
  const raw = data.answers[currentAssessment.id]?.[id] || "";
  return raw ? unxor(raw) : "";
}
function gradeIt() {
  let total = 0;
  const results = [];

  currentAssessment.questions.forEach(q => {
    const ans = getAnswer(q.id);
    let earned = 0;
    let hints  = [];

    if (q.rubric) {
      q.rubric.forEach(rule => {
        if (rule.check.test(ans)) earned += rule.points;
        else if (rule.hint) hints.push(rule.hint);
      });
    }

    total += earned;
    const isCorrect = earned === q.maxPoints;

    results.push({
      id: q.id.toUpperCase(),
      question: q.text,
      answer: ans || "(blank)",
      earned,
      max: q.maxPoints,
      markText: isCorrect ? "Correct" : earned > 0 ? "Incorrect (partial)" : "Incorrect",
      hint: hints.length ? hints.join(" • ") : (isCorrect ? "" : q.hint || "Check your answer")
    });
  });

  return { total, results };
}

// =============================
// 5. SUBMIT & RESULTS
// =============================
let finalData = null;

window.submitWork = function () {
  saveStudentInfo();
  const name = data.name, id = data.id;
  if (!name || !id || !data.teacher) return alert("Fill Name, ID and Teacher");
  if (!currentAssessment) return alert("Select an assessment");
  if (data.id && document.getElementById("id").value !== data.id) return alert("ID locked to: " + data.id);

  const { total, results } = gradeIt();
  const pct = Math.round((total / currentAssessment.totalPoints) * 100);

  finalData = {
    name, id,
    teacherName: document.getElementById("teacher").selectedOptions[0].textContent,
    teacherEmail: data.teacher,
    assessment: currentAssessment,
    points: total,
    totalPoints: currentAssessment.totalPoints,
    pct,
    submittedAt: new Date().toLocaleString(),
    results
  };

  // ---- UI RESULTS (uses assessment.title) ----
  document.getElementById("student").textContent = name;
  document.getElementById("teacher-name").textContent = finalData.teacherName;
  document.getElementById("grade").innerHTML = `${total}/${currentAssessment.totalPoints}<br><small>(${pct}%)</small>`;

  const ansDiv = document.getElementById("answers");
  ansDiv.innerHTML = `<h3>${currentAssessment.title}<br><small>${currentAssessment.subtitle}</small></h3>`;

  results.forEach(r => {
    const div = document.createElement("div");
    div.className = `feedback ${r.earned === r.max ? "correct" : r.earned > 0 ? "partial" : "wrong"}`;
    div.innerHTML = `
      <strong>${r.id}: ${r.earned}/${r.max} — ${r.markText}</strong><br>
      Your answer: <em>${r.answer}</em><br>
      ${r.earned < r.max ? "<strong>Tip:</strong> " + r.hint : "Perfect!"}`;
    ansDiv.appendChild(div);
  });

  document.getElementById("form").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");
};

window.back = () => {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("form").classList.remove("hidden");
};

// =============================
// 6. EMAIL WORK – PDF (DYNAMIC TITLE + CREST)
// =============================
window.emailWork = async function () {
  if (!finalData) return alert("Submit first!");

  // ---- Load PDF libraries on demand ----
  const loadScript = src => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });

  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  } catch (e) {
    return alert("Failed to load PDF library. Check internet.");
  }

  const { jsPDF } = window.jspdf;

  // Hide buttons
  const btns = document.querySelectorAll('.btn-group');
  btns.forEach(b => b.style.display = 'none');

  // Capture result area
  const resultEl = document.getElementById('result');
  const canvas = await html2canvas(resultEl, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  btns.forEach(b => b.style.display = '');

  // ---- PDF setup ----
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  // ---- Load crest (optional) ----
  const crestUrl = 'PHS_Crest.png';
  let crestImg = null;
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise((res, rej) => {
      img.onload = res;
      img.onerror = () => { console.warn("Crest not loaded"); res(); };
      img.src = crestUrl + '?t=' + Date.now();
    });
    if (img.width) crestImg = img;
  } catch (_) {}

  // ---- Helper: draw header (re‑used on every page) ----
  const drawHeader = (yOffset = 0) => {
    pdf.setFillColor(26, 73, 113);
    pdf.rect(0, yOffset, pageW, 35, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text(finalData.assessment.title, 14, yOffset + 20);   // DYNAMIC

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(`${finalData.assessment.subtitle}`, 14, yOffset + 28);

    if (crestImg) {
      const sz = 28;
      pdf.addImage(crestImg, 'PNG', pageW - sz - 10, yOffset + 5, sz, sz);
    } else {
      pdf.setFontSize(10);
      pdf.text("PHS", pageW - 25, yOffset + 20);
    }
  };

  // ---- First page header ----
  drawHeader();

  // ---- Student line ----
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  const info = `${finalData.name} (ID: ${finalData.id}) • ${finalData.teacherName} • ${finalData.submittedAt}`;
  pdf.text(info, 14, 40);

  // ---- Grade box ----
  pdf.setFillColor(240, 248, 255);
  pdf.rect(14, 45, 60, 15, 'F');
  pdf.setTextColor(26, 73, 113);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`${finalize.points}/${finalData.totalPoints} (${finalData.pct}%)`, 18, 55);

  // ---- Add captured image (results) ----
  const imgW = pageW - 28;
  const imgH = (canvas.height * imgW) / canvas.width;
  let heightLeft = imgH;
  let posY = 70;

  pdf.addImage(imgData, 'PNG', 14, posY, imgW, imgH);
  heightLeft -= pageH - posY - 10;

  while (heightLeft > 0) {
    posY = heightLeft - imgH;
    pdf.addPage();
    drawHeader();                         // repeat header on new pages
    pdf.addImage(imgData, 'PNG', 14, posY, imgW, imgH);
    heightLeft -= pageH - 40;
  }

  // ---- Footer ----
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Generated by Pukekohe High Tech Dept", 14, pageH - 10);

  // ---- Save / Email ----
  const filename = `${finalData.name.replace(/\s+/g, '_')}_${finalData.assessment.id}_${finalData.pct}%.pdf`;
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  const subject = encodeURIComponent(`${finalData.assessment.title} – ${finalData.name} (${finalData.pct}%)`);
  const body = encodeURIComponent(
    `Hi ${finalData.teacherName},\n\n` +
    `Attached: completed assessment for ${finalData.name} (ID: ${finalData.id}).\n\n` +
    `Part: ${finalData.assessment.title}\n` +
    `Score: ${finalData.points}/${finalData.totalPoints} (${finalData.pct}%)\n` +
    `Submitted: ${finalData.submittedAt}\n\n` +
    `Regards,\nPukekohe High Technology Department`
  );

  const mailto = `mailto:${finalData.teacherEmail}?subject=${subject}&body=${body}`;

  // Modern share (mobile)
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename, text: body.replace(/%20/g, ' ') }); return; }
    catch (_) {}
  }

  // Desktop fallback
  const dl = document.createElement('a');
  dl.href = pdfUrl; dl.download = filename; dl.click();
  setTimeout(() => window.location.href = mailto, 1000);
};

// =============================
// 7. COPY‑PASTE PROTECTION
// =============================
const PASTE_BLOCKED_MESSAGE      = 'Pasting blocked!';
const CLEAR_CLIPBOARD_ON_LOAD    = true;
const CLEAR_CLIPBOARD_AFTER_PASTE = true;
const BLOCK_COPY_CUT             = true;

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.className = 'toast';
  document.body.appendChild(t);
  requestAnimationFrame(() => t.style.opacity = 1);
  setTimeout(() => t.style.opacity = 0, 1800);
  setTimeout(() => t.remove(), 2200);
}
async function clearClipboard() {
  try { await navigator.clipboard.writeText(''); } catch (_) {}
}
if (CLEAR_CLIPBOARD_ON_LOAD) (async () => { await clearClipboard(); })();

function attachProtection() {
  document.querySelectorAll('.answer-field').forEach(f => {
    f.addEventListener('input', function () {
      const qid = this.id.slice(1);
      saveAnswer(qid);
    });
    f.addEventListener('paste', async e => {
      e.preventDefault();
      showToast(PASTE_BLOCKED_MESSAGE);
      if (CLEAR_CLIPBOARD_AFTER_PASTE) await clearClipboard();
    });
    if (BLOCK_COPY_CUT) {
      f.addEventListener('copy', e => e.preventDefault());
      f.addEventListener('cut',  e => e.preventDefault());
    }
  });
}
document.addEventListener('contextmenu', e => {
  if (!e.target.matches('input, textarea')) e.preventDefault();
});
