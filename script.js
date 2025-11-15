/* script.js – US 24355 app: core logic + JSON loading + PDF + share */

// Local storage
const STORAGE_KEY = "TECH_DATA";
let data;
try {
  data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { answers: {} };
} catch (_) {
  data = { answers: {} };
}

// State
let currentAssessment = null;
let finalData = null;

// Simple XOR obfuscation for answers
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

// Filled from questions.json
let APP_TITLE, APP_SUBTITLE, TEACHERS, ASSESSMENTS;

/*
 * The assessment configuration can be delivered either via the external
 * questions.json file or via this embedded fallback object. When served
 * over HTTP/S the app will fetch questions.json so that updating the
 * questions only requires editing the JSON file. If the fetch fails
 * (for example when loaded over the file:// protocol) the embedded
 * questions below will be used as a fallback. To update the embedded
 * copy, regenerate this object from the latest questions.json file.
 */
const EMBEDDED_QUESTIONS = {
  "APP_TITLE": "US 24355 – Materials Knowledge",
  "APP_SUBTITLE": "Pukekohe High School – All 5 Parts",
  "TEACHERS": [
    { "id": "RY", "name": "Mr Reynolds", "email": "ry@pukekohehigh.school.nz" },
    { "id": "RNR", "name": "Mr Ranford", "email": "rnr@pukekohehigh.school.nz" },
    { "id": "Other", "name": "Other Teacher", "email": "technology@pukekohehigh.school.nz" }
  ],
  "ASSESSMENTS": [
    {
      "id": "24355-part1",
      "title": "US 24355 Materials – Part 1",
      "subtitle": "New Zealand Timbers (9 marks)",
      "totalPoints": 9,
      "questions": [
        { "id": "q1", "text": "What is the most common exotic timber that is grown in plantations in New Zealand?", "type": "short", "maxPoints": 2, "hint": "Fast-growing softwood, name includes 'pine', planted everywhere since the 1930s – check Radiata pine on page 13 of the booklet.", "rubric": [ { "points": 2, "check": "\\b(radiata\\s+pine|pinus\\s+radiata)\\b" } ] },
        { "id": "q2", "text": "Name 2 types of New Zealand native timbers that can be used for high-quality furniture.", "type": "short", "maxPoints": 2, "hint": "One starts with R (warm golden colour) on page 12, one with K (light brown, also used for furniture) on page 13.", "rubric": [ { "points": 1, "check": "\\brimu\\b" }, { "points": 1, "check": "\\bkauri\\b" } ] },
        { "id": "q3", "text": "Name an imported timber that can be used for decking and outdoor furniture.", "type": "short", "maxPoints": 2, "hint": "Dense, reddish-brown Southeast Asian hardwood – see the dot points about imported timbers on page 14.", "rubric": [ { "points": 2, "check": "\\b(kwila|merbau)\\b" } ] },
        { "id": "q4", "text": "List 3 types of timber that are commonly used for woodturning.", "type": "short", "maxPoints": 3, "hint": "Have another look at the native and swamp timbers (especially swamp kauri) described on pages 12–13.", "rubric": [ { "points": 1, "check": "\\bkauri\\b" }, { "points": 1, "check": "\\bmatai\\b" }, { "points": 1, "check": "\\b(rewarewa|rimu|puriri|totara)\\b" } ] }
      ]
    },
    {
      "id": "24355-part2",
      "title": "US 24355 Materials – Part 2",
      "subtitle": "Manufactured Boards & Plastics (9 marks)",
      "totalPoints": 9,
      "questions": [
        { "id": "q5", "text": "Describe the effects of moisture on MDF.", "type": "long", "maxPoints": 3, "hint": "Look at the disadvantages of MDF in the Manufactured Boards section on page 18 – what happens when it gets wet?", "rubric": [ { "points": 1, "check": "\\b(swell|expand)" }, { "points": 1, "check": "fibre|fiber|break|degrade" }, { "points": 1, "check": "weak|lose.*strength" } ] },
        { "id": "q6", "text": "Name a lightweight expanded plastic used for insulation and buoyancy.", "type": "short", "maxPoints": 2, "hint": "Check the Plastics (Thermoplastics) section on page 22 – white beady foam sheets used for packaging and insulation.", "rubric": [ { "points": 2, "check": "\\b(polystyrene|eps|styrofoam)\\b" } ] },
        { "id": "q7", "text": "Name a hard, transparent plastic that can be bulletproof and noise-resistant.", "type": "short", "maxPoints": 2, "hint": "This one goes beyond the booklet (which talks about glass on page 24) – think of the clear plastic used for riot shields and bus shelters.", "rubric": [ { "points": 2, "check": "\\b(polycarbonate|lexan|makrolon)\\b" } ] },
        { "id": "q8", "text": "Name the plastic sheet used as a waterproof membrane under concrete slabs.", "type": "short", "maxPoints": 2, "hint": "See the note about polythene being used as a damp-proof membrane (DPM) in the Plastics section on page 22.", "rubric": [ { "points": 2, "check": "\\b(polythene|polyethylene|dpm|damp.?proof)\\b" } ] }
      ]
    },
    {
      "id": "24355-part3",
      "title": "US 24355 Materials – Part 3",
      "subtitle": "Metals & Concrete (5 marks)",
      "totalPoints": 5,
      "questions": [
        { "id": "q9", "text": "Name a commonly used metal that can be easily joined by welding.", "type": "short", "maxPoints": 2, "hint": "Check the first bullet list under Mild steel on page 20 – it says it is easily worked and welded.", "rubric": [ { "points": 2, "check": "\\b(mild\\s+steel|low\\s+carbon)\\b" } ] },
        { "id": "q10", "text": "Name a non-ferrous metal known for being light, corrosion-resistant and shiny.", "type": "short", "maxPoints": 2, "hint": "It's used to make ladders and window frames – check the Non-ferrous metals section on page 21.", "rubric": [ { "points": 2, "check": "\\b(aluminium|aluminum)\\b" } ] },
        { "id": "q11", "text": "Name a type of steel reinforcement used in concrete.", "type": "short", "maxPoints": 1, "hint": "See the Concrete section on page 22 – the answer is short, like the mesh used to reinforce slabs.", "rubric": [ { "points": 1, "check": "\\brebar|reinforcing\\s+bar|mesh\\b" } ] }
      ]
    },
    {
      "id": "24355-part4",
      "title": "US 24355 Materials – Part 4",
      "subtitle": "Glass & Ceramics (6 marks)",
      "totalPoints": 6,
      "questions": [
        { "id": "q12", "text": "What makes toughened (tempered) glass safer than normal glass?", "type": "long", "maxPoints": 3, "hint": "Think about how it breaks into small, less dangerous pieces, and what happens to the surface under stress.", "rubric": [ { "points": 1, "check": "small\\s+pieces|crumbles|granular" }, { "points": 1, "check": "compress.*surface|pre-stress" }, { "points": 1, "check": "break.*smooth.*edges" } ] },
        { "id": "q13", "text": "Name a type of ceramic used for insulating electrical components.", "type": "short", "maxPoints": 2, "hint": "You find it in spark plugs and circuit boards. Often white or translucent.", "rubric": [ { "points": 2, "check": "\\b(porcelain|alumina|steatite)\\b" } ] },
        { "id": "q14", "text": "Why are ceramics generally brittle?", "type": "long", "maxPoints": 1, "hint": "Relate to their internal structure – they don't bend like metals.", "rubric": [ { "points": 1, "check": "(crystal|ionic).*bond|no\\s+slip|lack\\s+ductility" } ] }
      ]
    },
    {
      "id": "24355-part5",
      "title": "US 24355 Materials – Part 5",
      "subtitle": "Composites & New Materials (7 marks)",
      "totalPoints": 7,
      "questions": [
        { "id": "q15", "text": "Name a composite material made of two different metals.", "type": "short", "maxPoints": 2, "hint": "Think of structural supports or building materials formed by gluing aluminium and plywood – you might find them in signage or aircraft.", "rubric": [ { "points": 2, "check": "\\b(alucobond|aluminum composite panel|acp)\\b" } ] },
        { "id": "q16", "text": "What property makes carbon fibre composites so popular?", "type": "short", "maxPoints": 2, "hint": "They’re used extensively in bicycles and racing cars because they are very …", "rubric": [ { "points": 2, "check": "\\b(strong\\s+and\\s+light|strength-to-weight)\\b" } ] },
        { "id": "q17", "text": "Name one biopolymer (plastic) derived from renewable resources.", "type": "short", "maxPoints": 2, "hint": "Made from corn starch or sugarcane; brands include PLA and Mater-Bi.", "rubric": [ { "points": 2, "check": "\\b(pla|polylactic|mater\\-?bi|starch\\s+based)\\b" } ] },
        { "id": "q18", "text": "Explain why Kevlar is used in bulletproof vests.", "type": "long", "maxPoints": 1, "hint": "Relate to its high tensile strength and toughness; think about energy absorption.", "rubric": [ { "points": 1, "check": "tensile|strength|light|absorb|energy" } ] }
      ]
    }
  ]
};
/* EMBEDDED QUESTIONS END */

/* --------------------------------------------------------------
   Load questions.json
   -------------------------------------------------------------- */
async function loadQuestions() {
  try {
    // Attempt to fetch the questions from the external JSON file. This
    // allows teachers to update the assessment by editing questions.json
    // without modifying this script. The service worker will cache
    // questions.json for offline use when served over HTTP.
    const res = await fetch('questions.json');
    if (!res.ok) throw new Error(`HTTP ${res.status} while fetching questions.json`);
    const json = await res.json();

    // Populate globals from the fetched JSON
    APP_TITLE = json.APP_TITLE;
    APP_SUBTITLE = json.APP_SUBTITLE;
    TEACHERS = json.TEACHERS;
    ASSESSMENTS = json.ASSESSMENTS.map(ass => ({
      ...ass,
      questions: ass.questions.map(q => ({
        ...q,
        // Convert string patterns into case-insensitive RegExp objects
        rubric:
          q.rubric?.map(r => ({
            ...r,
            check: new RegExp(r.check, 'i')
          })) || []
      }))
    }));
  } catch (err) {
    // If fetching fails (e.g. when loaded over file://), fall back to the
    // embedded questions. Log the error to the console for debugging.
    console.warn('Failed to fetch questions.json; using embedded questions instead', err);
    const json = EMBEDDED_QUESTIONS;
    APP_TITLE = json.APP_TITLE;
    APP_SUBTITLE = json.APP_SUBTITLE;
    TEACHERS = json.TEACHERS;
    ASSESSMENTS = json.ASSESSMENTS.map(ass => ({
      ...ass,
      questions: ass.questions.map(q => ({
        ...q,
        rubric:
          q.rubric?.map(r => ({
            ...r,
            check: new RegExp(r.check, 'i')
          })) || []
      }))
    }));
  }
}

/* --------------------------------------------------------------
   initApp – runs after JSON is loaded
   -------------------------------------------------------------- */
function initApp() {
  document.getElementById("loading")?.remove();

  document.getElementById("page-title").textContent = APP_TITLE;
  document.getElementById("header-title").textContent = APP_TITLE;
  document.getElementById("header-subtitle").textContent = APP_SUBTITLE;

  const nameEl = document.getElementById("name");
  const idEl = document.getElementById("id");
  nameEl.value = data.name || "";
  idEl.value = data.id || "";
  if (data.teacher) document.getElementById("teacher").value = data.teacher;

  // Lock ID if already set
  if (data.id) {
    document.getElementById("locked-msg").classList.remove("hidden");
    document.getElementById("locked-id").textContent = data.id;
    idEl.readOnly = true;
  }

  // Teacher list
  const teacherSel = document.getElementById("teacher");
  TEACHERS.forEach(t => {
    const o = document.createElement("option");
    o.value = t.email;
    o.textContent = t.name;
    teacherSel.appendChild(o);
  });

  // Assessment selector
  const assSel = document.getElementById("assessmentSelector");
  ASSESSMENTS.forEach((a, i) => {
    const o = document.createElement("option");
    o.value = i;
    o.textContent = `${a.title} – ${a.subtitle}`;
    assSel.appendChild(o);
  });
}

/* --------------------------------------------------------------
   Core functions
   -------------------------------------------------------------- */
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
  // Clear any previous questions
  container.innerHTML = "";

  // Add assessment header
  const headerDiv = document.createElement("div");
  headerDiv.className = "assessment-header";
  const h2 = document.createElement("h2");
  h2.textContent = currentAssessment.title;
  const p = document.createElement("p");
  p.textContent = currentAssessment.subtitle;
  headerDiv.appendChild(h2);
  headerDiv.appendChild(p);
  container.appendChild(headerDiv);

  // For each question, build the DOM elements explicitly rather than
  // injecting HTML strings.  Using createElement avoids subtle issues
  // with event handling on dynamically inserted markup and ensures
  // inputs behave consistently across browsers.
  currentAssessment.questions.forEach(q => {
    const saved = data.answers[currentAssessment.id]?.[q.id]
      ? unxor(data.answers[currentAssessment.id][q.id])
      : "";
    const qDiv = document.createElement("div");
    qDiv.className = "q";

    // Label (e.g. "Q1 (2 pts)")
    const label = document.createElement("strong");
    label.textContent = `${q.id.toUpperCase()} (${q.maxPoints} pts)`;
    qDiv.appendChild(label);
    qDiv.appendChild(document.createElement("br"));

    // Question text
    const questionSpan = document.createElement("span");
    questionSpan.textContent = q.text;
    qDiv.appendChild(questionSpan);
    qDiv.appendChild(document.createElement("br"));

    // Answer field (input or textarea)
    let inputEl;
    if (q.type === "long") {
      inputEl = document.createElement("textarea");
      inputEl.rows = 5;
    } else {
      inputEl = document.createElement("input");
      inputEl.type = "text";
    }
    inputEl.id = "a" + q.id;
    inputEl.className = "answer-field";
    // Populate any saved answer
    inputEl.value = saved;
    qDiv.appendChild(inputEl);
    container.appendChild(qDiv);
  });

  // Attach event handlers to the freshly created answer fields
  attachProtection();
}

function saveAnswer(qid) {
  const el = document.getElementById("a" + qid);
  if (!el) return;
  const val = el.value;
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
    const hints = [];

    if (q.rubric) {
      q.rubric.forEach(r => {
        if (r.check.test(ans)) {
          earned += r.points;
        } else if (r.hint) {
          hints.push(r.hint);
        }
      });
    }

    // Cap at maxPoints for safety
    earned = Math.min(earned, q.maxPoints);

    total += earned;
    const isCorrect = earned === q.maxPoints;
    results.push({
      id: q.id.toUpperCase(),
      question: q.text,
      answer: ans || "(blank)",
      earned,
      max: q.maxPoints,
      markText: isCorrect
        ? "Correct"
        : earned > 0
        ? "Incorrect (partial)"
        : "Incorrect",
      hint: hints.length
        ? hints.join(" • ")
        : isCorrect
        ? ""
        : q.hint || "Check your answer"
    });
  });

  return { total, results };
}

/* --------------------------------------------------------------
   Submit & show results
   -------------------------------------------------------------- */
function submitWork() {
  saveStudentInfo();
  const name = data.name;
  const id = data.id;

  if (!name || !id || !data.teacher) {
    return alert("Fill Name, ID and Teacher");
  }
  if (!currentAssessment) return alert("Select an assessment");
  if (data.id && document.getElementById("id").value !== data.id) {
    return alert("ID locked to: " + data.id);
  }

  const { total, results } = gradeIt();
  // Always compute the total points from the questions themselves.
  // Relying on a hard-coded totalPoints value risks mismatches when
  // the question weights change. Summing ensures the math stays correct
  // automatically.
  const totalPoints = currentAssessment.questions.reduce(
    (sum, q) => sum + (q.maxPoints || 0),
    0
  );
  const pct = totalPoints ? Math.round((total / totalPoints) * 100) : 0;

  finalData = {
    name,
    id,
    teacherName:
      document.getElementById("teacher").selectedOptions[0].textContent,
    teacherEmail: data.teacher,
    assessment: currentAssessment,
    points: total,
    totalPoints,
    pct,
    submittedAt: new Date().toLocaleString(),
    results
  };

  document.getElementById("student").textContent = name;
  document.getElementById("teacher-name").textContent = finalData.teacherName;
  document.getElementById(
    "grade"
  ).innerHTML = `${total}/${totalPoints}<br><small>(${pct}%)</small>`;

  const ansDiv = document.getElementById("answers");
  ansDiv.innerHTML = `
    <h3>${currentAssessment.title}<br>
    <small>${currentAssessment.subtitle}</small></h3>`;
  results.forEach(r => {
    const d = document.createElement("div");
    d.className = `feedback ${
      r.earned === r.max ? "correct" : r.earned > 0 ? "partial" : "wrong"
    }`;
    d.innerHTML = `
      <strong>${r.id}: ${r.earned}/${r.max} — ${r.markText}</strong><br>
      Your answer: <em>${r.answer}</em><br>
      ${r.earned < r.max ? "<strong>Tip:</strong> " + r.hint : "Perfect!"}`;
    ansDiv.appendChild(d);
  });

  document.getElementById("form").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");
}

function back() {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("form").classList.remove("hidden");
}

/* --------------------------------------------------------------
   Build printable / email body from finalData
   -------------------------------------------------------------- */
function buildEmailBody(fd) {
  const lines = [];

  lines.push(`Pukekohe High School – ${APP_TITLE}`);
  lines.push(APP_SUBTITLE);
  lines.push("");
  lines.push(`Assessment: ${fd.assessment.title} – ${fd.assessment.subtitle}`);
  lines.push(`Student: ${fd.name} (ID: ${fd.id})`);
  lines.push(`Teacher: ${fd.teacherName} <${fd.teacherEmail}>`);
  lines.push(`Submitted: ${fd.submittedAt}`);
  lines.push("");
  lines.push(`Score: ${fd.points}/${fd.totalPoints} (${fd.pct}%)`);
  lines.push("=".repeat(60));
  lines.push("");

  fd.results.forEach(r => {
    lines.push(`${r.id}: ${r.earned}/${r.max} — ${r.markText}`);
    lines.push(`Question: ${r.question}`);
    lines.push(`Answer: ${r.answer}`);
    if (r.earned < r.max && r.hint) {
      lines.push(`Tip: ${r.hint}`);
    }
    lines.push("-".repeat(60));
    lines.push("");
  });

  lines.push("Generated by Pukekohe High School Technology Dept");
  return lines.join("\n");
}

/* --------------------------------------------------------------
   Share helper – PDF + text body, fallback to mailto (short)
   -------------------------------------------------------------- */
async function sharePDF(file) {
  if (!finalData) return;

  // Dynamic subject from questions.json title
  const subject = `${finalData.assessment.title} – ${finalData.name} (${finalData.id})`;

  const fullBody = buildEmailBody(finalData);

  const shareData = {
    files: [file],
    title: subject,
    text: fullBody
  };

  // Preferred: Web Share with file + full body text
  if (navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      showToast("Shared");
    } catch (err) {
      console.warn(err);
      if (!String(err).includes("AbortError")) {
        showToast("Share failed", false);
      }
    }
    return;
  }

  // Fallback → download the PDF
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);

  // Shorter body for mailto (avoid huge URL)
  const shortBodyLines = [
    `Assessment: ${finalData.assessment.title}`,
    `Student: ${finalData.name} (ID: ${finalData.id})`,
    `Teacher: ${finalData.teacherName}`,
    `Submitted: ${finalData.submittedAt}`,
    `Score: ${finalData.points}/${finalData.totalPoints} (${finalData.pct}%)`,
    "",
    "The full marked report is in the attached PDF (or in the downloaded file)."
  ];
  const shortBody = shortBodyLines.join("\n");

  const mailto =
    `mailto:${encodeURIComponent(finalData.teacherEmail)}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(shortBody)}`;

  // This opens the mail client; body is small enough not to choke it
  window.location.href = mailto;

  showToast("Downloaded (share not supported)");
}

async function emailWork() {
  if (!finalData) return alert("Submit first!");

  const load = src => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });

  try {
    await load("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    await load("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  } catch (e) {
    return showToast("Failed to load PDF tools", false);
  }

  const { jsPDF } = window.jspdf;
  const resultEl = document.getElementById("result");
  const btns = document.querySelectorAll(".btn-group");
  btns.forEach(b => b.style.display = "none");

  const canvas = await html2canvas(resultEl, { scale: 2 });
  btns.forEach(b => b.style.display = "");

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 28; // 14mm margin on each side
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Header function
  const addHeader = async () => {
    // Draw a maroon banner across the top of each PDF page
    pdf.setFillColor(110, 24, 24);
    pdf.rect(0, 0, pageWidth, 35, "F");
    // White text on the maroon header
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(APP_TITLE, 14, 20);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(APP_SUBTITLE, 14, 28);
    // Optional crest in the header; load the cropped shield
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "crest_shield.png?t=" + Date.now();
      const loaded = new Promise(res => { img.onload = img.onerror = res; });
      await loaded;
      if (img.width) pdf.addImage(img, "PNG", pageWidth - 38, 5, 28, 28);
    } catch (_) {
      /* ignore crest load failures */
    }
  };

  // Add first page header
  await addHeader();

  // Student info
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.text(`${finalData.name} (ID: ${finalData.id}) • ${finalData.teacherName} • ${finalData.submittedAt}`, 14, 40);

  // Grade box
  pdf.setFillColor(240, 248, 255);
  pdf.rect(14, 45, 60, 15, "F");
  pdf.setTextColor(110, 24, 24);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${finalData.points}/${finalData.totalPoints} (${finalData.pct}%)`, 18, 55);

  // Image placement
  let yPosition = 70;
  const availableHeight = pageHeight - yPosition - 20; // bottom margin

  if (imgHeight <= availableHeight) {
    // Fits on first page
    pdf.addImage(imgData, "PNG", 14, yPosition, imgWidth, imgHeight);
  } else {
    // Split across pages
    let heightLeft = imgHeight;
    let sourceY = 0;

    while (heightLeft > 0) {
      const sliceHeight = Math.min(availableHeight, heightLeft);
      const scaledSliceHeight = (sliceHeight * canvas.width) / imgWidth;

      // Create canvas slice
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = scaledSliceHeight;
      const ctx = sliceCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, sourceY, canvas.width, scaledSliceHeight, 0, 0, canvas.width, scaledSliceHeight);

      pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 14, yPosition, imgWidth, sliceHeight);

      heightLeft -= sliceHeight;
      sourceY += scaledSliceHeight;

      if (heightLeft > 0) {
        pdf.addPage();
        await addHeader();
        yPosition = 50; // new page start
      }
    }
  }

  // Footer
  pdf.setFontSize(9);
  pdf.setTextColor(100, 100, 100);
  pdf.text("Generated by Pukekohe High Tech Dept", 14, pageHeight - 10);

  const filename = `${finalData.name.replace(/\s+/g, "_")}_${finalData.assessment.id}_${finalData.pct}%.pdf`;
  const pdfBlob = pdf.output("blob");
  const file = new File([pdfBlob], filename, { type: "application/pdf" });
  await sharePDF(file);
}


/* --------------------------------------------------------------
   Toast helper
   -------------------------------------------------------------- */
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
  t.className = "toast";
  t.role = "status";
  t.setAttribute("aria-live", "polite");
  t.style.cssText = `
    display: none; padding: 10px 12px; border-radius: 6px;
    background: #16a34a; color: #fff; position: fixed; bottom: 20px; left: 50%;
    transform: translateX(-50%); z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: inherit; font-size: 0.95rem;
  `;
  document.body.appendChild(t);
  return t;
}

/* --------------------------------------------------------------
   Protection (no copy/paste)
   -------------------------------------------------------------- */
const PASTE_BLOCKED_MESSAGE = "Pasting blocked!";
async function clearClipboard() {
  if (!navigator.clipboard || !navigator.clipboard.writeText) return;
  try {
    await navigator.clipboard.writeText("");
  } catch (_) {}
}
(async () => {
  await clearClipboard();
})();

function attachProtection() {
  document.querySelectorAll(".answer-field").forEach(f => {
    f.addEventListener("input", () => saveAnswer(f.id.slice(1)));
    f.addEventListener("paste", e => {
      e.preventDefault();
      showToast(PASTE_BLOCKED_MESSAGE, false);
      clearClipboard();
    });
    f.addEventListener("copy", e => e.preventDefault());
    f.addEventListener("cut", e => e.preventDefault());
  });
}

document.addEventListener("contextmenu", e => {
  if (!e.target.matches("input, textarea")) e.preventDefault();
});/* script.js – US 24355 app: core logic + JSON loading + PDF + share */
// Local storage
const STORAGE_KEY = "TECH_DATA";
let data;
try {
  data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || { answers: {} };
} catch (_) {
  data = { answers: {} };
}
// State
let currentAssessment = null;
let finalData = null;
// Simple XOR obfuscation for answers
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
// Filled from questions.json
let APP_TITLE, APP_SUBTITLE, TEACHERS, ASSESSMENTS;
/*
 * The assessment configuration can be delivered either via the external
 * questions.json file or via this embedded fallback object. When served
 * over HTTP/S the app will fetch questions.json so that updating the
 * questions only requires editing the JSON file. If the fetch fails
 * (for example when loaded over the file:// protocol) the embedded
 * questions below will be used as a fallback. To update the embedded
 * copy, regenerate this object from the latest questions.json file.
 */
const EMBEDDED_QUESTIONS = {
  "APP_TITLE": "US 24355 – Materials Knowledge",
  "APP_SUBTITLE": "Pukekohe High School – All 5 Parts",
  "TEACHERS": [
    { "id": "RY", "name": "Mr Reynolds", "email": "ry@pukekohehigh.school.nz" },
    { "id": "RNR", "name": "Mr Ranford", "email": "rnr@pukekohehigh.school.nz" },
    { "id": "Other", "name": "Other Teacher", "email": "technology@pukekohehigh.school.nz" }
  ],
  "ASSESSMENTS": [
    {
      "id": "24355-part1",
      "title": "US 24355 Materials – Part 1",
      "subtitle": "New Zealand Timbers (9 marks)",
      "totalPoints": 9,
      "questions": [
        { "id": "q1", "text": "What is the most common exotic timber that is grown in plantations in New Zealand?", "type": "short", "maxPoints": 2, "hint": "Fast-growing softwood, name includes 'pine', planted everywhere since the 1930s – check Radiata pine on page 13 of the booklet.", "rubric": [ { "points": 2, "check": "\\\\b(radiata\\\\s+pine|pinus\\\\s+radiata)\\\\b" } ] },
        { "id": "q2", "text": "Name 2 types of New Zealand native timbers that can be used for high-quality furniture.", "type": "short", "maxPoints": 2, "hint": "One starts with R (warm golden colour) on page 12, one with K (light brown, also used for furniture) on page 13.", "rubric": [ { "points": 1, "check": "\\\\brimu\\\\b" }, { "points": 1, "check": "\\\\bkauri\\\\b" } ] },
        { "id": "q3", "text": "Name an imported timber that can be used for decking and outdoor furniture.", "type": "short", "maxPoints": 2, "hint": "Dense, reddish-brown Southeast Asian hardwood – see the dot points about imported timbers on page 14.", "rubric": [ { "points": 2, "check": "\\\\b(kwila|merbau)\\\\b" } ] },
        { "id": "q4", "text": "List 3 types of timber that are commonly used for woodturning.", "type": "short", "maxPoints": 3, "hint": "Have another look at the native and swamp timbers (especially swamp kauri) described on pages 12–13.", "rubric": [ { "points": 1, "check": "\\\\bkauri\\\\b" }, { "points": 1, "check": "\\\\bmatai\\\\b" }, { "points": 1, "check": "\\\\b(rewarewa|rimu|puriri|totara)\\\\b" } ] }
      ]
    },
    {
      "id": "24355-part2",
      "title": "US 24355 Materials – Part 2",
      "subtitle": "Manufactured Boards & Plastics (9 marks)",
      "totalPoints": 9,
      "questions": [
        { "id": "q5", "text": "Describe the effects of moisture on MDF.", "type": "long", "maxPoints": 3, "hint": "Look at the disadvantages of MDF in the Manufactured Boards section on page 18 – what happens when it gets wet?", "rubric": [ { "points": 1, "check": "\\\\b(swell|expand)" }, { "points": 1, "check": "fibre|fiber|break|degrade" }, { "points": 1, "check": "weak|lose.*strength" } ] },
        { "id": "q6", "text": "Name a lightweight expanded plastic used for insulation and buoyancy.", "type": "short", "maxPoints": 2, "hint": "Check the Plastics (Thermoplastics) section on page 22 – white beady foam sheets used for packaging and insulation.", "rubric": [ { "points": 2, "check": "\\\\b(polystyrene|eps|styrofoam)\\\\b" } ] },
        { "id": "q7", "text": "Name a hard, transparent plastic that can be bulletproof and noise-resistant.", "type": "short", "maxPoints": 2, "hint": "This one goes beyond the booklet (which talks about glass on page 24) – think of the clear plastic used for riot shields and bus shelters.", "rubric": [ { "points": 2, "check": "\\\\b(polycarbonate|lexan|makrolon)\\\\b" } ] },
        { "id": "q8", "text": "Name the plastic sheet used as a waterproof membrane under concrete slabs.", "type": "short", "maxPoints": 2, "hint": "See the note about polythene being used as a damp-proof membrane (DPM) in the Plastics section on page 22.", "rubric": [ { "points": 2, "check": "\\\\b(polythene|polyethylene|dpm|damp.?proof)\\\\b" } ] }
      ]
    },
    {
      "id": "24355-part3",
      "title": "US 24355 Materials – Part 3",
      "subtitle": "Metals & Concrete (5 marks)",
      "totalPoints": 5,
      "questions": [
        { "id": "q9", "text": "Name a commonly used metal that can be easily joined by welding.", "type": "short", "maxPoints": 2, "hint": "Check the first bullet list under Mild steel on page 20 – it says it is easily worked and welded.", "rubric": [ { "points": 2, "check": "\\\\b(mild\\\\s+steel|low\\\\s+carbon)\\\\b" } ] },
        { "id": "q10", "text": "What are the 3 main materials that make up concrete?", "type": "short", "maxPoints": 3, "hint": "Read the first paragraph under Concrete on page 25 – it lists the three ingredients mixed together.", "rubric": [ { "points": 1, "check": "\\\\bcement\\\\b" }, { "points": 1, "check": "\\\\bwater\\\\b" }, { "points": 1, "check  "\\\\b(aggregate|sand|gravel|stone)\\\\b" } ] }
      ]
    },
    {
      "id": "24355-part4",
      "title": "US 24355 Materials – Part 4",
      "subtitle": "Paint Finishes (5 marks)",
      "totalPoints": 5,
      "questions": [
        { "id": "q11", "text": "What is the function of a primer coat when painting?", "type": "long", "maxPoints": 2, "hint": "Check the description of Primer in the Paint section on page 26 – it talks about adhesion and protection.", "rubric": [ { "points": 1, "check": "\\\\b(seal|porous)" }, { "points": 1, "check": "\\\\b(adhesion|bond|stick|key)" } ] },
        { "id": "q12", "text": "Identify 3 methods commonly used to apply paint.", "type": "short", "maxPoints": 3, "hint": "See the first paragraph under Surface finishes/ Paint on page 26 – three methods are listed there.", "rubric": [ { "points": 1, "check": "\\\\bbrush\\\\b" }, { "points": 1, "check": "\\\\broller\\\\b" }, { "points": 1, "check": "\\\\bspray\\\\b" } ] }
      ]
    },
    {
      "id": "24355-part5",
      "title": "US 24355 Materials – Part 5",
      "subtitle": "Polishes & Varnishes (7 marks)",
      "totalPoints": 7,
      "questions": [
        { "id": "q13", "text": "Name 2 types of polishes and state an advantage over oil finishes.", "type": "long", "maxPoints": 3, "hint": "Compare the Oil section on page 27 with the Polish section on page 28 – look at wax polish and French polish.", "rubric": [ { "points": 1, "check": "\\\\b(wax|paste\\\\s+wax|beeswax)\\\\b" }, { "points": 1, "check": "\\\\b(french\\\\s+polish|shellac)\\\\b" }, { "points": 1, "check": "\\\\b(hard|durable|gloss|protective|resist)" } ] },
        { "id": "q14", "text": "Name 2 types of varnishes and state an advantage of each.", "type": "long", "maxPoints": 4, "hint": "Read the Varnish section on page 27 – look for acrylic varnish and polyurethane and what each is good at.", "rubric": [ { "points": 1, "check": "\\\\bpolyurethane\\\\b" }, { "points": 1, "check": "polyurethane.*\\\\b(durable|tough|scratch|wear)" }, { "points": 1, "check": "\\\\b(water.?based|acrylic)\\\\b" }, { "points": 1, "check": "water.?based.*\\\\b(quick|fast.*dry|low.*odou?r|clear|non.?yellow)" } ] }
      ]
    }
  ]
};
/* EMBEDDED QUESTIONS END */
/* --------------------------------------------------------------
   Load questions.json
   -------------------------------------------------------------- */
async function loadQuestions() {
  try {
    const res = await fetch('questions.json');
    if (!res.ok) throw new Error(`HTTP ${res.status} while fetching questions.json`);
    const json = await res.json();
    APP_TITLE = json.APP_TITLE;
    APP_SUBTITLE = json.APP_SUBTITLE;
    TEACHERS = json.TEACHERS;
    ASSESSMENTS = json.ASSESSMENTS.map(ass => ({
      ...ass,
      questions: ass.questions.map(q => ({
        ...q,
        rubric: q.rubric?.map(r => ({
          ...r,
          check: new RegExp(r.check, 'i')
        })) || []
      }))
    }));
  } catch (err) {
    console.warn('Failed to fetch questions.json; using embedded questions instead', err);
    const json = EMBEDDED_QUESTIONS;
    APP_TITLE = json.APP_TITLE;
    APP_SUBTITLE = json.APP_SUBTITLE;
    TEACHERS = json.TEACHERS;
    ASSESSMENTS = json.ASSESSMENTS.map(ass => ({
      ...ass,
      questions: ass.questions.map(q => ({
        ...q,
        rubric: q.rubric?.map(r => ({
          ...r,
          check: new RegExp(r.check, 'i')
        })) || []
      }))
    }));
  }
}
/* --------------------------------------------------------------
   initApp – runs after JSON is loaded
   -------------------------------------------------------------- */
function initApp() {
  document.getElementById("loading")?.remove();
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
/* --------------------------------------------------------------
   Core functions
   -------------------------------------------------------------- */
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
  container.innerHTML = "";
  const headerDiv = document.createElement("div");
  headerDiv.className = "assessment-header";
  const h2 = document.createElement("h2");
  h2.textContent = currentAssessment.title;
  const p = document.createElement("p");
  p.textContent = currentAssessment.subtitle;
  headerDiv.appendChild(h2);
  headerDiv.appendChild(p);
  container.appendChild(headerDiv);
  currentAssessment.questions.forEach(q => {
    const saved = data.answers[currentAssessment.id]?.[q.id]
      ? unxor(data.answers[currentAssessment.id][q.id])
      : "";
    const qDiv = document.createElement("div");
    qDiv.className = "q";
    const label = document.createElement("strong");
    label.textContent = `${q.id.toUpperCase()} (${q.maxPoints} pts)`;
    qDiv.appendChild(label);
    qDiv.appendChild(document.createElement("br"));
    const questionSpan = document.createElement("span");
    questionSpan.textContent = q.text;
    qDiv.appendChild(questionSpan);
    qDiv.appendChild(document.createElement("br"));
    let inputEl;
    if (q.type === "long") {
      inputEl = document.createElement("textarea");
      inputEl.rows = 5;
    } else {
      inputEl = document.createElement("input");
      inputEl.type = "text";
    }
    inputEl.id = "a" + q.id;
    inputEl.className = "answer-field";
    inputEl.value = saved;
    qDiv.appendChild(inputEl);
    container.appendChild(qDiv);
  });
  attachProtection();
}
function saveAnswer(qid) {
  const el = document.getElementById("a" + qid);
  if (!el) return;
  const val = el.value;
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
    const hints = [];
    if (q.rubric) {
      q.rubric.forEach(r => {
        if (r.check.test(ans)) {
          earned += r.points;
        } else if (r.hint) {
          hints.push(r.hint);
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
      markText: isCorrect ? "Correct" : earned > 0 ? "Incorrect (partial)" : "Incorrect",
      hint: hints.length ? hints.join(" • ") : isCorrect ? "" : q.hint || "Check your answer"
    });
  });
  return { total, results };
}
/* --------------------------------------------------------------
   Submit & show results
   -------------------------------------------------------------- */
function submitWork() {
  saveStudentInfo();
  const name = data.name;
  const id = data.id;
  if (!name || !id || !data.teacher) {
    return alert("Fill Name, ID and Teacher");
  }
  if (!currentAssessment) return alert("Select an assessment");
  if (data.id && document.getElementById("id").value !== data.id) {
    return alert("ID locked to: " + data.id);
  }
  const { total, results } = gradeIt();
  const totalPoints = currentAssessment.questions.reduce((sum, q) => sum + (q.maxPoints || 0), 0);
  const pct = totalPoints ? Math.round((total / totalPoints) * 100) : 0;
  finalData = {
    name,
    id,
    teacherName: document.getElementById("teacher").selectedOptions[0].textContent,
    teacherEmail: data.teacher,
    assessment: currentAssessment,
    points: total,
    totalPoints,
    pct,
    submittedAt: new Date().toLocaleString(),
    results
  };
  document.getElementById("student").textContent = name;
  document.getElementById("teacher-name").textContent = finalData.teacherName;
  document.getElementById("grade").innerHTML = `${total}/${totalPoints}<br><small>(${pct}%)</small>`;
  const ansDiv = document.getElementById("answers");
  ansDiv.innerHTML = `<h3>${currentAssessment.title}<br><small>${currentAssessment.subtitle}</small></h3>`;
  results.forEach(r => {
    const d = document.createElement("div");
    d.className = `feedback ${r.earned === r.max ? "correct" : r.earned > 0 ? "partial" : "wrong"}`;
    d.innerHTML = `
      <strong>${r.id}: ${r.earned}/${r.max} — ${r.markText}</strong><br>
      Your answer: <em>${r.answer}</em><br>
      ${r.earned < r.max ? "<strong>Tip:</strong> " + r.hint : "Perfect!"}`;
    ansDiv.appendChild(d);
  });
  document.getElementById("form").classList.add("hidden");
  document.getElementById("result").classList.remove("hidden");
}
function back() {
  document.getElementById("result").classList.add("hidden");
  document.getElementById("form").classList.remove("hidden");
}
/* --------------------------------------------------------------
   Build printable / email body from finalData
   -------------------------------------------------------------- */
function buildEmailBody(fd) {
  const lines = [];
  lines.push(`Pukekohe High School – ${APP_TITLE}`);
  lines.push(APP_SUBTITLE);
  lines.push("");
  lines.push(`Assessment: ${fd.assessment.title} – ${fd.assessment.subtitle}`);
  lines.push(`Student: ${fd.name} (ID: ${fd.id})`);
  lines.push(`Teacher: ${fd.teacherName} <${fd.teacherEmail}>`);
  lines.push(`Submitted: ${fd.submittedAt}`);
  lines.push("");
  lines.push(`Score: ${fd.points}/${fd.totalPoints} (${fd.pct}%)`);
  lines.push("=".repeat(60));
  lines.push("");
  fd.results.forEach(r => {
    lines.push(`${r.id}: ${r.earned}/${r.max} — ${r.markText}`);
    lines.push(`Question: ${r.question}`);
    lines.push(`Answer: ${r.answer}`);
    if (r.earned < r.max && r.hint) {
      lines.push(`Tip: ${r.hint}`);
    }
    lines.push("-".repeat(60));
    lines.push("");
  });
  lines.push("Generated by Pukekohe High School Technology Dept");
  return lines.join("\n");
}
/* --------------------------------------------------------------
   Share helper – PDF + text body, fallback to mailto (short)
   -------------------------------------------------------------- */
async function sharePDF(file) {
  if (!finalData) return;
  const subject = `${finalData.assessment.title} – ${finalData.name} (${finalData.id})`;
  const fullBody = buildEmailBody(finalData);
  const shareData = { files: [file], title: subject, text: fullBody };
  if (navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      showToast("Shared");
    } catch (err) {
      console.warn(err);
      if (!String(err).includes("AbortError")) {
        showToast("Share failed", false);
      }
    }
    return;
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  const shortBodyLines = [
    `Assessment: ${finalData.assessment.title}`,
    `Student: ${finalData.name} (ID: ${finalData.id})`,
    `Teacher: ${finalData.teacherName}`,
    `Submitted: ${finalData.submittedAt}`,
    `Score: ${finalData.points}/${finalData.totalPoints} (${finalData.pct}%)`,
    "",
    "The full marked report is in the attached PDF (or in the downloaded file)."
  ];
  const shortBody = shortBodyLines.join("\n");
  const mailto = `mailto:${encodeURIComponent(finalData.teacherEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(shortBody)}`;
  window.location.href = mailto;
  showToast("Downloaded (share not supported)");
}
async function emailWork() {
  if (!finalData) return alert("Submit first!");
  const load = src => new Promise((res, rej) => {
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  try {
    await load("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    await load("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
  } catch (e) {
    return showToast("Failed to load PDF tools", false);
  }
  const { jsPDF } = window.jspdf;
  const resultEl = document.getElementById("result");
  const btns = document.querySelectorAll(".btn-group");
  btns.forEach(b => b.style.display = "none");
  const canvas = await html2canvas(resultEl, { scale: 2 });
  btns.forEach(b => b.style.display = "");
  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 28;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const addHeader = async () => {
    pdf.setFillColor(110, 24, 24);
    pdf.rect(0, 0, pageWidth, 35, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.text(APP_TITLE, 14, 20);
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text(APP_SUBTITLE, 14, 28);
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = "crest_shield.png?t=" + Date.now();
      const loaded = new Promise(res => { img.onload = img.onerror = res; });
      await loaded;
      if (img.width) pdf.addImage(img, "PNG", pageWidth - 38, 5, 28, 28);
    } catch (_) {}
  };
  await addHeader();
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(11);
  pdf.text(`${finalData.name} (ID: ${finalData.id}) • ${finalData.teacherName} • ${finalData.submittedAt}`, 14, 40);
  pdf.setFillColor(240, 248, 255);
  pdf.rect(14, 45, 60, 15, "F");
  pdf.setTextColor(110, 24, 24);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${finalData.points}/${finalData.totalPoints} (${finalData.pct}%)`, 18, 55);
  let yPosition = 70;
  const availableHeight = pageHeight - yPosition - 20;
  if (imgHeight <= availableHeight) {
    pdf.addImage(imgData, "PNG", 14, yPosition, imgWidth, imgHeight);
  } else {
    let heightLeft = imgHeight;
    let sourceY = 0;
    while (heightLeft > 0) {
      const sliceHeight = Math.min(availableHeight, heightLeft);
      const scaledSliceHeight = (sliceHeight * canvas.width) / imgWidth;
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = scaledSliceHeight;
      const ctx = sliceCanvas.getContext("2d");
      ctx.drawImage(canvas, 0, sourceY, canvas.width, scaledSliceHeight, 0, 0, canvas.width, scaledSliceHeight);
      pdf.addImage(sliceCanvas.toDataURL("image/png"), "PNG", 14, yPosition, imgWidth, sliceHeight);
      heightLeft -= sliceHeight;
      sourceY += scaledSliceHeight;
      if (heightLeft > 0) {
        pdf.addPage();
        await addHeader();
        yPosition = 50;
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
/* --------------------------------------------------------------
   Toast helper
   -------------------------------------------------------------- */
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
  t.className = "toast";
  t.role = "status";
  t.setAttribute("aria-live", "polite");
  t.style.cssText = `
    display: none; padding: 10px 12px; border-radius: 6px;
    background: #16a34a; color: #fff; position: fixed; bottom: 20px; left: 50%;
    transform: translateX(-50%); z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-family: inherit; font-size: 0.95rem;
  `;
  document.body.appendChild(t);
  return t;
}
/* --------------------------------------------------------------
   Protection (no copy/paste)
   -------------------------------------------------------------- */
const PASTE_BLOCKED_MESSAGE = "Pasting blocked!";
async function clearClipboard() {
  if (!navigator.clipboard || !navigator.clipboard.writeText) return;
  try {
    await navigator.clipboard.writeText("");
  } catch (_) {}
}
(async () => {
  await clearClipboard();
})();
function attachProtection() {
  document.querySelectorAll(".answer-field").forEach(f => {
    f.addEventListener("input", () => saveAnswer(f.id.slice(1)));
    f.addEventListener("paste", e => {
      e.preventDefault();
      showToast(PASTE_BLOCKED_MESSAGE, false);
      clearClipboard();
    });
    f.addEventListener("copy", e => e.preventDefault());
    f.addEventListener("cut", e => e.preventDefault());
  });
}
document.addEventListener("contextmenu", e => {
  if (!e.target.matches("input, textarea")) e.preventDefault();
});
/* --------------------------------------------------------------
   Export functions for HTML onclick
   -------------------------------------------------------------- */
window.loadAssessment = loadAssessment;
window.submitWork = submitWork;
window.back = back;
window.emailWork = emailWork;
/* --------------------------------------------------------------
   Start the app
   -------------------------------------------------------------- */
(async () => {
  try {
    await loadQuestions();
    initApp();
  } catch (err) {}
})();

/* --------------------------------------------------------------
   Export functions for HTML onclick
   -------------------------------------------------------------- */
window.loadAssessment = loadAssessment;
window.submitWork = submitWork;
window.back = back;
window.emailWork = emailWork;

/* --------------------------------------------------------------
   Start the app
   -------------------------------------------------------------- */
(async () => {
  try {
    await loadQuestions();
    initApp();
  } catch (err) {
    // Error already shown in loadQuestions
  }
})();
