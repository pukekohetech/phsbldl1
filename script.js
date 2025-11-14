// =============================
//   script.js – FINAL VERSION
//   Your favorite clipboard sabotage
// =============================

const STORAGE_KEY = "TECH_DATA";
let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { answers: {} };
let currentAssessment = null;

// XOR encrypt answers
const xor = s => btoa([...s].map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join(''));
const unxor = s => atob(s).split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join('');

// Load saved
document.getElementById("name").value = data.name || "";
document.getElementById("id").value = data.id || "";
if (data.teacher) document.getElementById("teacher").value = data.teacher;

// Lock ID
if (data.id) {
  document.getElementById("locked-msg").classList.remove("hidden");
  document.getElementById("locked-id").textContent = data.id;
  document.getElementById("id").readOnly = true;
}

// Teachers & Assessments
TEACHERS.forEach(t => {
  const o = document.createElement("option");
  o.value = t.email; o.textContent = t.name;
  document.getElementById("teacher").appendChild(o);
});
ASSESSMENTS.forEach((assess, i) => {
  const opt = document.createElement("option");
  opt.value = i;
  opt.textContent = assess.title + " – " + assess.subtitle;
  document.getElementById("assessmentSelector").appendChild(opt);
});

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
    <div style="background:#3949ab;color:white;padding:15px;border-radius:10px;margin:20px 0;">
      <h2 style="margin:0;color:white;">${currentAssessment.title}</h2>
      <p style="margin:5px 0 0;font-size:16px;">${currentAssessment.subtitle}</p>
    </div>`;

  currentAssessment.questions.forEach(q => {
    const saved = data.answers[currentAssessment.id]?.[q.id] ? unxor(data.answers[currentAssessment.id][q.id]) : "";
    const div = document.createElement("div");
    div.className = "q";
    const fieldHTML = q.type === "long"
      ? `<textarea rows="5" id="a${q.id}" class="answer-field">${saved}</textarea>`
      : `<input type="text" id="a${q.id}" value="${saved}" class="answer-field">`;
    div.innerHTML = `<strong>${q.id.toUpperCase()} (${q.maxPoints} pts)</strong><br>${q.text}<br>${fieldHTML}`;
    container.appendChild(div);
  });

  attachProtection(); // <-- Your favorite part
}

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

// [gradeIt, submitWork, back, emailWork — same as before]
function gradeIt() { /* ... your original grading logic ... */ }
let finalData = null;
window.submitWork = function() { /* ... your original submit ... */ };
window.back = () => { document.getElementById("result").classList.add("hidden"); document.getElementById("form").classList.remove("hidden"); };
window.emailWork = async function() { if (!finalData) return alert("Submit first!"); alert("Re-add your full PDF code if needed."); };

// =============================
//   YOUR FAVORITE PASTE PROTECTION
// =============================
const WARNING = `Pasting is disabled. Type your own answer.`;

async function sabotageClipboard() {
  try { await navigator.clipboard.writeText(WARNING); } catch(e) {}
}

function showToast(msg) {
  const t = document.createElement('div');
  t.textContent = msg;
  t.className = 'toast';
  document.body.appendChild(t);
  requestAnimationFrame(() => t.style.opacity = 1);
  setTimeout(() => t.style.opacity = 0, 1800);
  setTimeout(() => t.remove(), 2200);
}

function attachProtection() {
  document.querySelectorAll('.answer-field').forEach(field => {
    field.addEventListener('focus', function() {
      sabotageClipboard(); // Overwrite clipboard
      if (!this.value.trim()) {
        this.value = WARNING;
        this.style.color = '#c0392b';
        this.style.fontStyle = 'italic';
      }
    });

    field.addEventListener('input', function() {
      if (this.value === WARNING) {
        this.value = '';
        this.style.color = '';
        this.style.fontStyle = '';
      }
      const qid = this.id.slice(1);
      saveAnswer(qid);
    });

    field.addEventListener('paste', e => {
      e.preventDefault();
      showToast('Pasting blocked!');
    });

    field.addEventListener('copy', e => e.preventDefault());
    field.addEventListener('cut', e => e.preventDefault());
  });
}

// Block right-click outside inputs
document.addEventListener('contextmenu', e => {
  if (!e.target.matches('input, textarea')) e.preventDefault();
});
