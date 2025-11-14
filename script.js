// =============================
// script.js – SECURE & FULL (with PDF Email)
// =============================

// =============================
// 1. CORE DATA & STORAGE
// =============================
const STORAGE_KEY = "TECH_DATA";               // EDIT: localStorage key name
let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { answers: {} };
let currentAssessment = null;                  // currently loaded assessment

// ----- XOR OBFUSCATION (light security) -----
const XOR_KEY = 42;                            // EDIT: change the XOR key (0‑255)
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
  document.getElementById("id").readOnly = true;               // EDIT: set false to allow editing
}

// ----- POPULATE TEACHER DROPDOWN -----
TEACHERS.forEach(t => {
  const o = document.createElement("option");
  o.value = t.email;                 // uses email (required for mailto)
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

  // Show results
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
// 6. EMAIL WORK – PDF GENERATION & MAILTO
// =============================
window.emailWork = async function () {
  if (!finalData) return alert("Submit first!");

  // Load jsPDF + html2canvas from CDN
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  };

  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
  } catch (e) {
    return alert("Failed to load PDF library. Check internet connection.");
  }

  const { jsPDF } = window.jspdf;

  // Hide buttons before capture
  const buttons = document.querySelectorAll('.btn-group');
  buttons.forEach(b => b.style.display = 'none');

  // Capture result section
  const resultEl = document.getElementById('result');
  const canvas = await html2canvas(resultEl, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');

  // Restore buttons
  buttons.forEach(b => b.style.display = '');

  // Create PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - 20;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;
  }

  // Generate filename
  const filename = `${finalData.name.replace(/\s+/g, '_')}_${finalData.assessment.id}_${finalData.pct}%.pdf`;
  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  // Create mailto link with attachment
  const subject = encodeURIComponent(`US 24355 Results – ${finalData.name} (${finalData.pct}%)`);
  const body = encodeURIComponent(
    `Hi ${finalData.teacherName},\n\n` +
    `Please find attached the completed assessment for ${finalData.name} (ID: ${finalData.id}).\n\n` +
    `Assessment: ${finalData.assessment.title}\n` +
    `Score: ${finalData.points}/${finalData.totalPoints} (${finalData.pct}%)\n` +
    `Submitted: ${finalData.submittedAt}\n\n` +
    `Regards,\nPukekohe High Tech Dept`
  );

  // For desktop: mailto with attachment (works in Outlook, Thunderbird)
  const mailtoLink = document.createElement('a');
  mailtoLink.href = `mailto:${finalData.teacherEmail}?subject=${subject}&body=${body}`;
  
  // Try to attach file (limited support)
  const file = new File([pdfBlob], filename, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({
      files: [file],
      title: filename,
      text: body
    }).catch(() => {
      // Fallback to download
      mailtoLink.download = filename;
      mailtoLink.click();
    });
  } else {
    // Fallback: download + open email
    const downloadLink = document.createElement('a');
    downloadLink.href = pdfUrl;
    downloadLink.download = filename;
    downloadLink.click();

    setTimeout(() => {
      window.location.href = mailtoLink.href;
    }, 1000);
  }
};

// =============================
// 7. COPY-PASTE PROTECTION (CONFIGURABLE)
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

if (CLEAR_CLIPBOARD_ON_LOAD) {
  (async () => { await clearClipboard(); })();
}

function attachProtection() {
  document.querySelectorAll('.answer-field').forEach(field => {
    field.addEventListener('input', function () {
      const qid = this.id.slice(1);
      saveAnswer(qid);
    });

    field.addEventListener('paste', async e => {
      e.preventDefault();
      showToast(PASTE_BLOCKED_MESSAGE);
      if (CLEAR_CLIPBOARD_AFTER_PASTE) await clearClipboard();
    });

    if (BLOCK_COPY_CUT) {
      field.addEventListener('copy', e => e.preventDefault());
      field.addEventListener('cut',  e => e.preventDefault());
    }
  });
}

document.addEventListener('contextmenu', e => {
  if (!e.target.matches('input, textarea')) e.preventDefault();
});
