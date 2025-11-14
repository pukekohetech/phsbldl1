// =============================
//   script.js – Secure Version
// =============================

const STORAGE_KEY = "TECH_DATA";
let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { answers: {} };
let currentAssessment = null;

// XOR encode/decode (obfuscate localStorage)
const xor = s => btoa([...s].map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join(''));
const unxor = s => atob(s).split('').map(c => String.fromCharCode(c.charCodeAt(0) ^ 42)).join('');

// Load saved data
document.getElementById("name").value = data.name || "";
document.getElementById("id").value = data.id || "";
if (data.teacher) document.getElementById("teacher").value = data.teacher;

// Lock ID
if (data.id) {
  document.getElementById("locked-msg").classList.remove("hidden");
  document.getElementById("locked-id").textContent = data.id;
  document.getElementById("id").readOnly = true;
}

// Teachers
TEACHERS.forEach(t => {
  const o = document.createElement("option");
  o.value = t.email; o.textContent = t.name;
  document.getElementById("teacher").appendChild(o);
});

// Assessments
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

  attachProtection();
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

function gradeIt() {
  let total = 0;
  const results = [];
  currentAssessment.questions.forEach(q => {
    const ans = getAnswer(q.id);
    let earned = 0;
    let hints = [];
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
      earned, max: q.maxPoints,
      markText: isCorrect ? "Correct" : earned > 0 ? "Incorrect (partial)" : "Incorrect",
      hint: hints.length ? hints.join(" • ") : (isCorrect ? "" : q.hint || "Check your answer")
    });
  });
  return { total, results };
}

let finalData = null;
window.submitWork = function() {
  saveStudentInfo();
  const name = data.name, id = data.id;
  if (!name || !id || !data.teacher) return alert("Fill Name, ID and Teacher");
  if (!currentAssessment) return alert("Select an assessment");
  if (data.id && document.getElementById("id").value !== data.id) return alert("ID locked to: " + data.id);
  const { total, results } = gradeIt();
  const pct = Math.round((total / currentAssessment.totalPoints) * 100);
  finalData = { name, id, teacherName: document.getElementById("teacher").selectedOptions[0].textContent, teacherEmail: data.teacher, assessment: currentAssessment, points: total, totalPoints: currentAssessment.totalPoints, pct, submittedAt: new Date().toLocaleString(), results };
  document.getElementById("student").textContent = name;
  document.getElementById("teacher-name").textContent = finalData.teacherName;
  document.getElementById("grade").innerHTML = total + "/" + currentAssessment.totalPoints + "<br><small>(" + pct + "%)</small>";
  const ansDiv = document.getElementById("answers");
  ansDiv.innerHTML = `<h3>${currentAssessment.title}<br><small>${currentAssessment.subtitle}</small></h3>`;
  results.forEach(r => {
    const div = document.createElement("div");
    div.className = `feedback ${r.earned === r.max ? "correct" : r.earned > 0 ? "partial" : "wrong"}`;
    div.innerHTML = `<strong>${r.id}: ${r.earned}/${r.max} — ${r.markText}</strong><br>Your answer: <em>${r.answer}</em><br>${r.earned < r.max ? "<strong>Tip:</strong> " + r.hint : "Perfect!"}`;
    ansDiv.appendChild(div);
  });
  document.getElementById("form").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");
};

window.back = () => {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("form").classList.remove("hidden");
};

// EMAIL WORK (PDF) – keep your original if needed
window.emailWork = async function() {
  if (!finalData) return alert("Submit first!");
  alert("PDF feature not included in minimal secure version. Re-add your emailWork() if needed.");
};
// =============================
// COPY-PASTE PROTECTION (revised)
// =============================
const WARNING = `Pasting is disabled. Type your own answer.`;

async function sabotageClipboard() {
  try { await navigator.clipboard.writeText(WARNING); } catch (_) {}
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

/* Attach protection to every .answer-field */
function attachProtection() {
  document.querySelectorAll('.answer-field').forEach(field => {

    // ---- 1. When the field gets focus → wipe clipboard
    field.addEventListener('focus', sabotageClipboard);

    // ---- 2. Normal typing → just save the answer
    field.addEventListener('input', function () {
      const qid = this.id.slice(1);          // "a12" → "12"
      saveAnswer(qid);
    });

    // ---- 3. Block paste, show toast, and keep clipboard sabotaged
    field.addEventListener('paste', e => {
      e.preventDefault();                    // stop the original paste
      showToast('Pasting blocked!');
   //   sabotageClipboard();                  // ensure clipboard stays "poisoned"
    });

    // ---- 4. Optional: also block copy/cut if you want
    field.addEventListener('copy', e => e.preventDefault());
    field.addEventListener('cut',  e => e.preventDefault());
  });
}

/* Keep the right-click block you already had */
document.addEventListener('contextmenu', e => {
  if (!e.target.matches('input, textarea')) e.preventDefault();
});
