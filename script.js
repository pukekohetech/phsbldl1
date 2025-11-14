// script.js – Complete with PDF Email, Anti-Cheat, Grading, All 5 Parts
const STORAGE_KEY = "TECH_DATA";
let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { answers: {} };
let currentAssessment = null;

// XOR encryption for localStorage
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

// Populate teachers
TEACHERS.forEach(t => {
  const o = document.createElement("option");
  o.value = t.email; o.textContent = t.name;
  document.getElementById("teacher").appendChild(o);
});

// Populate assessments
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

// FULL GRADING
function gradeIt() {
  let total = 0;
  const results = [];

  currentAssessment.questions.forEach(q => {
    const ans = getAnswer(q.id);
    let earned = 0;
    let hints = [];

    if (q.rubric) {
      q.rubric.forEach(rule => {
        if (rule.check.test(ans)) {
          earned += rule.points;
        } else if (rule.hint) {
          hints.push(rule.hint);
        }
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

let finalData = null;
window.submitWork = function() {
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

  document.getElementById("student").textContent = name;
  document.getElementById("teacher-name").textContent = finalData.teacherName;
  document.getElementById("grade").innerHTML = total + "/" + currentAssessment.totalPoints + "<br><small>(" + pct + "%)</small>";

  const ansDiv = document.getElementById("answers");
  ansDiv.innerHTML = `<h3>${currentAssessment.title}<br><small>${currentAssessment.subtitle}</small></h3>`;

  results.forEach(r => {
    const div = document.createElement("div");
    div.className = `feedback ${r.earned === r.max ? "correct" : r.earned > 0 ? "partial" : "wrong"}`;
    div.innerHTML = `<strong>${r.id}: ${r.earned}/${r.max} — ${r.markText}</strong><br>
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

// FULL EMAIL + PDF FUNCTION (RESTORED!)
window.emailWork = async function() {
  if (!finalData) return alert("Submit first!");

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = 15;

  // Optional: Add school crest
  try { doc.addImage("PHS-Crest.png", "PNG", 10, 8, 28, 28); } catch(e) {}

  // Header
  doc.setFontSize(18);
  const titleLines = doc.splitTextToSize(finalData.assessment.title, 150);
  titleLines.forEach((line, i) => doc.text(line, 45, 20 + i*8));

  doc.setFontSize(14);
  const subLines = doc.splitTextToSize(finalData.assessment.subtitle, 150);
  subLines.forEach((line, i) => doc.text(line, 45, 32 + titleLines.length*8 + i*7));

  let headerY = 35 + titleLines.length*8 + subLines.length*7;
  doc.setFontSize(26); doc.text(finalData.name, 45, headerY); headerY += 12;
  doc.setFontSize(16); doc.text("ID: " + finalData.id + " | Teacher: " + finalData.teacherName, 45, headerY); headerY += 8;
  doc.text("Submitted: " + finalData.submittedAt, 45, headerY); headerY += 15;
  doc.setFontSize(28); doc.text("GRADE: " + finalData.points + "/" + finalData.totalPoints + " (" + finalData.pct + "%)", 45, headerY);
  y = headerY + 18;

  // Questions
  finalData.results.forEach(r => {
    if (y > 265) { doc.addPage(); y = 20; try { doc.addImage("PHS-Crest.png", "PNG", 10, 8, 28, 28); } catch(e) {} }

    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    const qLines = doc.splitTextToSize(`${r.id}: ${r.question}`, 180);
    qLines.forEach(line => { doc.text(line, 15, y); y += 6; });

    doc.setFontSize(20);
    if (r.earned === r.max) {
      doc.setTextColor(0,120,0); doc.text("Correct", 140, y);
    } else {
      doc.setTextColor(180,0,0); doc.text(r.earned > 0 ? "Incorrect (partial)" : "Incorrect", 110, y);
    }
    doc.setTextColor(0,0,0); doc.setFontSize(13); doc.text(`${r.earned}/${r.max}`, 170, y - 3);
    y += 10;

    doc.setFontSize(10); doc.setFont("helvetica", "normal");
    const cleanAnswer = (r.answer || "(no answer)").replace(/!/g, "");
    const answerLines = doc.splitTextToSize(cleanAnswer, 170);
    answerLines.forEach(line => { doc.text("Answer: " + line, 20, y); y += 5.5; });

    if (r.earned < r.max && r.hint) {
      doc.setFontSize(9); doc.setTextColor(150,0,0);
      const tipLines = doc.splitTextToSize("Tip: " + r.hint, 165);
      tipLines.forEach(line => { doc.text(line, 22, y); y += 5; });
      doc.setTextColor(0,0,0);
    }
    y += 8;
  });

  const filename = finalData.id + "_" + finalData.name.replace(/ /g,"_") + "_" + finalData.assessment.id + ".pdf";
  const blob = doc.output('blob');
  const file = new File([blob], filename, {type:"application/pdf"});

  // Try Web Share API (mobile)
  if (navigator.canShare && navigator.canShare({files:[file]})) {
    try { await navigator.share({files:[file], title: finalData.name + " – " + finalData.assessment.title}); }
    catch { fallbackOutlook(file); }
  } else {
    fallbackOutlook(file);
  }

  function fallbackOutlook(file) {
    const reader = new FileReader();
    reader.onload = () => {
      window.open("https://outlook.office.com/mail/deeplink/compose?subject=" +
        encodeURIComponent(finalData.name + " – " + finalData.assessment.title) +
        "&body=" + encodeURIComponent(
          "Kia ora " + finalData.teacherName + ",\n\nPlease find my completed " + finalData.assessment.subtitle + " attached.\n\n" +
          "Grade: " + finalData.points + "/" + finalData.totalPoints + " (" + finalData.pct + "%)\n\nNgā mihi,\n" + finalData.name
        ) +
        "&attach=" + encodeURIComponent(reader.result), "_blank");
    };
    reader.readAsDataURL(file);
  }
};

// ANTI-CHEAT: Clipboard Sabotage (your favorite)
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
      sabotageClipboard();
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
