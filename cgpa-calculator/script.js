const STORAGE_KEY = "cgpa-calculator-real-data-v1";

const GRADE_POINTS = {
  O: 10,
  "A+": 9,
  A: 8,
  "B+": 7,
  B: 6,
  C: 5,
  F: 0,
};

const GRADE_ORDER = Object.keys(GRADE_POINTS);

const state = {
  semesters: [],
  simulationSemesters: [],
  view: "real",
};

const dom = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheDom();
  loadFromLocalStorage();
  bindEvents();
  renderAll();
});

function cacheDom() {
  dom.cgpaValue = document.getElementById("cgpaValue");
  dom.cgpaNote = document.getElementById("cgpaNote");
  dom.projectedCgpaValue = document.getElementById("projectedCgpaValue");
  dom.projectedCgpaNote = document.getElementById("projectedCgpaNote");
  dom.realTab = document.getElementById("realTab");
  dom.whatIfTab = document.getElementById("whatIfTab");
  dom.realPanel = document.getElementById("realPanel");
  dom.whatIfPanel = document.getElementById("whatIfPanel");
  dom.realSemesters = document.getElementById("realSemesters");
  dom.simulationSemesters = document.getElementById("simulationSemesters");
  dom.realBreakdownBody = document.getElementById("realBreakdownBody");
  dom.projectionBreakdownBody = document.getElementById("projectionBreakdownBody");
  dom.addSemesterBtn = document.getElementById("addSemesterBtn");
  dom.addSimulationBtn = document.getElementById("addSimulationBtn");
  dom.resetSimulationBtn = document.getElementById("resetSimulationBtn");
  dom.clearAllBtn = document.getElementById("clearAllBtn");
}

function bindEvents() {
  dom.realTab.addEventListener("click", () => setView("real"));
  dom.whatIfTab.addEventListener("click", () => setView("whatif"));

  dom.addSemesterBtn.addEventListener("click", () => {
    state.semesters.push(createEmptySemester(`Semester ${state.semesters.length + 1}`));
    saveToLocalStorage();
    renderRealSemesters();
    updateDerivedUI();
    focusSemesterName(state.semesters[state.semesters.length - 1].id, false);
  });

  dom.addSimulationBtn.addEventListener("click", () => {
    state.simulationSemesters.push(createEmptySimulationSemester(`Future ${state.simulationSemesters.length + 1}`));
    renderSimulationSemesters();
    updateDerivedUI();
    focusSemesterName(state.simulationSemesters[state.simulationSemesters.length - 1].id, true);
  });

  dom.resetSimulationBtn.addEventListener("click", () => {
    state.simulationSemesters = [];
    renderSimulationSemesters();
    updateDerivedUI();
  });

  dom.clearAllBtn.addEventListener("click", () => {
    const confirmed = window.confirm("Clear all real semester data and simulations?");
    if (!confirmed) return;
    state.semesters = [];
    state.simulationSemesters = [];
    localStorage.removeItem(STORAGE_KEY);
    renderAll();
  });

  dom.realSemesters.addEventListener("click", handleRealClick);
  dom.simulationSemesters.addEventListener("click", handleSimulationClick);

  dom.realSemesters.addEventListener("input", handleRealInput);
  dom.realSemesters.addEventListener("change", handleRealChange);

  dom.simulationSemesters.addEventListener("input", handleSimulationInput);
  dom.simulationSemesters.addEventListener("change", handleSimulationChange);
}

function setView(view) {
  state.view = view;
  const isReal = view === "real";
  dom.realTab.classList.toggle("is-active", isReal);
  dom.whatIfTab.classList.toggle("is-active", !isReal);
  dom.realTab.setAttribute("aria-selected", String(isReal));
  dom.whatIfTab.setAttribute("aria-selected", String(!isReal));

  dom.realPanel.hidden = !isReal;
  dom.whatIfPanel.hidden = isReal;
  dom.realPanel.classList.toggle("is-hidden", !isReal);
  dom.whatIfPanel.classList.toggle("is-hidden", isReal);
}

function renderAll() {
  renderRealSemesters();
  renderSimulationSemesters();
  updateDerivedUI();
  setView(state.view);
}

function renderRealSemesters() {
  dom.realSemesters.innerHTML = "";

  if (!state.semesters.length) {
    dom.realSemesters.appendChild(createEmptyMessage("Add your first semester to begin tracking grades."));
    return;
  }

  const fragment = document.createDocumentFragment();
  state.semesters.forEach((semester) => {
    fragment.appendChild(createSemesterCard(semester, { simulated: false }));
  });
  dom.realSemesters.appendChild(fragment);
}

function renderSimulationSemesters() {
  dom.simulationSemesters.innerHTML = "";

  if (!state.simulationSemesters.length) {
    dom.simulationSemesters.appendChild(createEmptyMessage("Build a future semester to see how it changes your CGPA."));
    return;
  }

  const fragment = document.createDocumentFragment();
  state.simulationSemesters.forEach((semester) => {
    fragment.appendChild(createSemesterCard(semester, { simulated: true }));
  });
  dom.simulationSemesters.appendChild(fragment);
}

function createEmptyMessage(text) {
  const div = document.createElement("div");
  div.className = "empty-state";
  div.textContent = text;
  return div;
}

function createSemesterCard(semester, { simulated }) {
  const article = document.createElement("article");
  article.className = `semester-card ${simulated ? "is-simulated" : ""}`;
  article.dataset.semesterId = semester.id;
  article.dataset.scope = simulated ? "simulation" : "real";

  const header = document.createElement("div");
  header.className = "semester-card-header";

  const titleWrap = document.createElement("div");
  titleWrap.className = "semester-title-wrap";

  const badge = document.createElement("span");
  badge.className = `badge ${simulated ? "badge-sim" : "badge-real"}`;
  badge.textContent = simulated ? "Simulated" : "Real";

  const title = document.createElement("h3");
  title.className = "semester-title";
  title.textContent = semester.name || (simulated ? "What-if semester" : "Semester");

  titleWrap.append(title, badge);

  const tools = document.createElement("div");
  tools.className = "semester-tools";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "inline-input";
  nameInput.value = semester.name || "";
  nameInput.placeholder = simulated ? "Future Semester" : "Semester 1";
  nameInput.dataset.action = "semester-name";
  nameInput.dataset.semesterId = semester.id;
  nameInput.setAttribute("aria-label", simulated ? "What-if semester name" : "Semester name");

  const modeSelect = document.createElement("select");
  modeSelect.className = "inline-select";
  modeSelect.dataset.action = "simulation-mode";
  modeSelect.dataset.semesterId = semester.id;
  modeSelect.setAttribute("aria-label", "What-if semester calculation mode");
  modeSelect.hidden = !simulated;

  if (simulated) {
    modeSelect.innerHTML = `
      <option value="detailed"${semester.mode === "detailed" ? " selected" : ""}>Detailed</option>
      <option value="quick"${semester.mode === "quick" ? " selected" : ""}>Quick</option>
    `;
  }

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "button remove-btn";
  removeBtn.dataset.action = simulated ? "remove-simulation" : "remove-semester";
  removeBtn.dataset.semesterId = semester.id;
  removeBtn.textContent = "Remove";

  tools.append(nameInput);
  if (simulated) tools.append(modeSelect);
  tools.append(removeBtn);

  header.append(titleWrap, tools);

  const body = document.createElement("div");
  body.className = "semester-body";

  if (simulated && semester.mode === "quick") {
    body.appendChild(createQuickModeFields(semester));
  } else {
    body.appendChild(createSubjectCollection(semester, simulated));
  }

  const footer = document.createElement("div");
  footer.className = "semester-footer";
  footer.dataset.footerFor = semester.id;
  footer.innerHTML = `
    <div class="footer-pair">
      <div class="footer-item"><span>Credits</span><strong data-role="credits">0.00</strong></div>
      <div class="footer-item"><span>GPA</span><strong data-role="gpa">0.00</strong></div>
    </div>
    <div class="footer-item">
      <span>Status</span><strong data-role="status">Ready</strong>
    </div>
  `;

  article.append(header, body, footer);
  return article;
}

function createQuickModeFields(semester) {
  const wrap = document.createElement("div");
  wrap.className = "subjects";
  wrap.innerHTML = `
    <div class="subject-row">
      <div class="subject-field">
        <label class="field-label" for="quickCredits-${semester.id}">Total credits</label>
        <input
          id="quickCredits-${semester.id}"
          class="field-input"
          type="number"
          min="0"
          step="1"
          inputmode="numeric"
          placeholder="18"
          value="${escapeAttr(semester.quickCredits)}"
          data-action="quick-credits"
          data-semester-id="${semester.id}"
        >
      </div>
      <div class="subject-field">
        <label class="field-label" for="quickGpa-${semester.id}">Expected average GPA</label>
        <input
          id="quickGpa-${semester.id}"
          class="field-input"
          type="number"
          min="0"
          max="10"
          step="0.01"
          inputmode="decimal"
          placeholder="8.50"
          value="${escapeAttr(semester.quickAverageGpa)}"
          data-action="quick-gpa"
          data-semester-id="${semester.id}"
        >
      </div>
    <div class="subject-field">
      <span class="field-label">Mode</span>
        <div class="empty-state quick-note">Quick mode uses a single weighted average.</div>
      </div>
    </div>
  `;
  return wrap;
}

function createSubjectCollection(semester, simulated) {
  const wrapper = document.createElement("div");
  wrapper.className = "subjects";

  const list = document.createElement("div");
  list.className = "subjects";

  if (!semester.subjects.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = simulated
      ? "Add hypothetical subjects to estimate the semester GPA."
      : "Add your first subject to get started.";
    list.appendChild(empty);
  } else {
    semester.subjects.forEach((subject) => {
      list.appendChild(createSubjectRow(semester.id, subject, simulated));
    });
  }

  const actions = document.createElement("div");
  actions.className = "semester-tools semester-actions";

  const addSubjectBtn = document.createElement("button");
  addSubjectBtn.type = "button";
  addSubjectBtn.className = "button button-secondary";
  addSubjectBtn.dataset.action = simulated ? "add-simulation-subject" : "add-subject";
  addSubjectBtn.dataset.semesterId = semester.id;
  addSubjectBtn.textContent = "Add Subject";

  actions.appendChild(addSubjectBtn);

  wrapper.append(list, actions);
  return wrapper;
}

function createSubjectRow(semesterId, subject, simulated) {
  const row = document.createElement("div");
  row.className = "subject-row is-new";
  row.dataset.subjectId = subject.id;
  row.dataset.semesterId = semesterId;
  row.dataset.scope = simulated ? "simulation" : "real";

  row.innerHTML = `
    <div class="subject-field">
      <label class="field-label" for="subjectName-${subject.id}">Subject name</label>
      <input
        id="subjectName-${subject.id}"
        class="field-input"
        type="text"
        placeholder="Subject name"
        value="${escapeAttr(subject.name)}"
        data-action="subject-name"
        data-semester-id="${semesterId}"
        data-subject-id="${subject.id}"
      >
    </div>
    <div class="subject-field">
      <label class="field-label" for="subjectCredits-${subject.id}">Credits</label>
      <input
        id="subjectCredits-${subject.id}"
        class="field-input"
        type="number"
        min="0"
        step="1"
        inputmode="numeric"
        placeholder="3"
        value="${escapeAttr(subject.credits)}"
        data-action="subject-credits"
        data-semester-id="${semesterId}"
        data-subject-id="${subject.id}"
      >
    </div>
    <div class="subject-field">
      <label class="field-label" for="subjectGrade-${subject.id}">Grade</label>
      <select
        id="subjectGrade-${subject.id}"
        class="field-select"
        data-action="subject-grade"
        data-semester-id="${semesterId}"
        data-subject-id="${subject.id}"
      >
        <option value="">Select grade</option>
        ${GRADE_ORDER.map((grade) => `<option value="${grade}"${subject.grade === grade ? " selected" : ""}>${grade} (${GRADE_POINTS[grade]})</option>`).join("")}
      </select>
    </div>
    <button
      type="button"
      class="button remove-btn"
      data-action="${simulated ? "remove-simulation-subject" : "remove-subject"}"
      data-semester-id="${semesterId}"
      data-subject-id="${subject.id}"
    >
      Remove
    </button>
  `;

  return row;
}

function updateDerivedUI() {
  const realTotals = calculateCGPA(state.semesters);
  const projectedTotals = calculateProjectedCGPA(state.semesters, state.simulationSemesters);

  dom.cgpaValue.textContent = formatGpa(realTotals.gpa);
  dom.cgpaNote.textContent = realTotals.credits > 0
    ? `${formatCredits(realTotals.credits)} credits across ${realTotals.completedSemesters} semester${realTotals.completedSemesters === 1 ? "" : "s"}.`
    : "No completed semester data yet.";

  dom.projectedCgpaValue.textContent = formatGpa(projectedTotals.gpa);
  dom.projectedCgpaNote.textContent = state.simulationSemesters.length
    ? `${formatCredits(projectedTotals.totalCredits)} projected credits including simulations.`
    : "Add simulated semesters to see the projection.";

  updateSemesterFooters();
  renderRealBreakdown(realTotals);
  renderProjectionBreakdown(realTotals, projectedTotals);
}

function updateSemesterFooters() {
  state.semesters.forEach((semester) => {
    const totals = calculateSemesterTotals(semester.subjects);
    updateFooter(semester.id, totals.credits, totals.gpa, totals.hasValidRows ? "Saved" : "Ready");
  });

  state.simulationSemesters.forEach((semester) => {
    const totals = calculateSimulationSemesterTotals(semester);
    updateFooter(semester.id, totals.credits, totals.gpa, totals.hasValidRows ? "Projected" : "Ready");
  });
}

function updateFooter(semesterId, credits, gpa, status) {
  const footer = document.querySelector(`[data-footer-for="${semesterId}"]`);
  if (!footer) return;
  const creditsNode = footer.querySelector('[data-role="credits"]');
  const gpaNode = footer.querySelector('[data-role="gpa"]');
  const statusNode = footer.querySelector('[data-role="status"]');
  if (creditsNode) creditsNode.textContent = formatCredits(credits);
  if (gpaNode) gpaNode.textContent = formatGpa(gpa);
  if (statusNode) statusNode.textContent = status;
}

function renderRealBreakdown(realTotals) {
  dom.realBreakdownBody.innerHTML = "";

  if (!state.semesters.length) {
    dom.realBreakdownBody.innerHTML = `
      <tr class="empty-table">
        <td colspan="3">No semesters yet.</td>
      </tr>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  state.semesters.forEach((semester) => {
    const totals = calculateSemesterTotals(semester.subjects);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(semester.name || "Semester")}</td>
      <td>${formatCredits(totals.credits)}</td>
      <td>${formatGpa(totals.gpa)}</td>
    `;
    fragment.appendChild(row);
  });
  dom.realBreakdownBody.appendChild(fragment);
}

function renderProjectionBreakdown(realTotals, projectedTotals) {
  dom.projectionBreakdownBody.innerHTML = "";
  const rows = [];

  state.semesters.forEach((semester) => {
    const totals = calculateSemesterTotals(semester.subjects);
    rows.push({
      name: semester.name || "Semester",
      type: "Real",
      credits: totals.credits,
      gpa: totals.gpa,
      kind: "real",
    });
  });

  state.simulationSemesters.forEach((semester) => {
    const totals = calculateSimulationSemesterTotals(semester);
    rows.push({
      name: semester.name || "What-if semester",
      type: "Simulated",
      credits: totals.credits,
      gpa: totals.gpa,
      kind: "simulated",
    });
  });

  if (!rows.length) {
    dom.projectionBreakdownBody.innerHTML = `
      <tr class="empty-table">
        <td colspan="4">No data to project yet.</td>
      </tr>
    `;
    return;
  }

  const fragment = document.createDocumentFragment();
  rows.forEach((rowData) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(rowData.name)}</td>
      <td><span class="type-pill ${rowData.kind}">${rowData.type}</span></td>
      <td>${formatCredits(rowData.credits)}</td>
      <td>${formatGpa(rowData.gpa)}</td>
    `;
    fragment.appendChild(row);
  });
  dom.projectionBreakdownBody.appendChild(fragment);
}

function handleRealClick(event) {
  const action = event.target?.dataset?.action;
  if (!action) return;

  const semesterId = event.target.dataset.semesterId;
  if (action === "remove-semester") {
    state.semesters = state.semesters.filter((semester) => semester.id !== semesterId);
    saveToLocalStorage();
    renderRealSemesters();
    updateDerivedUI();
    return;
  }

  if (action === "add-subject") {
    const semester = findSemester(state.semesters, semesterId);
    if (!semester) return;
    semester.subjects.push(createEmptySubject());
    saveToLocalStorage();
    renderRealSemesters();
    updateDerivedUI();
    focusSubjectField(semesterId, semester.subjects[semester.subjects.length - 1].id, false);
    return;
  }

  if (action === "remove-subject") {
    const subjectId = event.target.dataset.subjectId;
    const semester = findSemester(state.semesters, semesterId);
    if (!semester) return;
    semester.subjects = semester.subjects.filter((subject) => subject.id !== subjectId);
    saveToLocalStorage();
    renderRealSemesters();
    updateDerivedUI();
  }
}

function handleSimulationClick(event) {
  const action = event.target?.dataset?.action;
  if (!action) return;

  const semesterId = event.target.dataset.semesterId;
  if (action === "remove-simulation") {
    state.simulationSemesters = state.simulationSemesters.filter((semester) => semester.id !== semesterId);
    renderSimulationSemesters();
    updateDerivedUI();
    return;
  }

  if (action === "add-simulation-subject") {
    const semester = findSemester(state.simulationSemesters, semesterId);
    if (!semester) return;
    semester.subjects.push(createEmptySubject());
    renderSimulationSemesters();
    updateDerivedUI();
    focusSubjectField(semesterId, semester.subjects[semester.subjects.length - 1].id, true);
    return;
  }

  if (action === "remove-simulation-subject") {
    const subjectId = event.target.dataset.subjectId;
    const semester = findSemester(state.simulationSemesters, semesterId);
    if (!semester) return;
    semester.subjects = semester.subjects.filter((subject) => subject.id !== subjectId);
    renderSimulationSemesters();
    updateDerivedUI();
  }
}

function handleRealInput(event) {
  const target = event.target;
  const action = target?.dataset?.action;
  if (!action) return;

  const semesterId = target.dataset.semesterId;
  const semester = findSemester(state.semesters, semesterId);
  if (!semester) return;

  if (action === "semester-name") {
    semester.name = target.value;
  } else if (action === "subject-name" || action === "subject-credits" || action === "subject-grade") {
    const subject = findSubject(semester, target.dataset.subjectId);
    if (!subject) return;
    if (action === "subject-name") subject.name = target.value;
    if (action === "subject-credits") subject.credits = target.value;
    if (action === "subject-grade") subject.grade = target.value;
  }

  saveToLocalStorage();
  updateDerivedUI();
}

function handleRealChange(event) {
  const target = event.target;
  if (target?.dataset?.action !== "semester-name") return;
  saveToLocalStorage();
}

function handleSimulationInput(event) {
  const target = event.target;
  const action = target?.dataset?.action;
  if (!action) return;

  const semesterId = target.dataset.semesterId;
  const semester = findSemester(state.simulationSemesters, semesterId);
  if (!semester) return;

  if (action === "semester-name") {
    semester.name = target.value;
  } else if (action === "subject-name" || action === "subject-credits" || action === "subject-grade") {
    const subject = findSubject(semester, target.dataset.subjectId);
    if (!subject) return;
    if (action === "subject-name") subject.name = target.value;
    if (action === "subject-credits") subject.credits = target.value;
    if (action === "subject-grade") subject.grade = target.value;
  } else if (action === "quick-credits") {
    semester.quickCredits = target.value;
  } else if (action === "quick-gpa") {
    semester.quickAverageGpa = target.value;
  }

  updateDerivedUI();
}

function handleSimulationChange(event) {
  const target = event.target;
  const action = target?.dataset?.action;
  if (action !== "simulation-mode") return;

  const semester = findSemester(state.simulationSemesters, target.dataset.semesterId);
  if (!semester) return;

  semester.mode = target.value === "quick" ? "quick" : "detailed";
  renderSimulationSemesters();
  updateDerivedUI();
}

function calculateSemesterTotals(subjects) {
  let credits = 0;
  let points = 0;
  let hasValidRows = false;

  subjects.forEach((subject) => {
    const creditValue = Number(subject.credits);
    const gradePoint = GRADE_POINTS[subject.grade];
    if (creditValue > 0 && Number.isFinite(gradePoint)) {
      credits += creditValue;
      points += creditValue * gradePoint;
      hasValidRows = true;
    }
  });

  const gpa = credits > 0 ? points / credits : 0;
  return { credits, points, gpa, hasValidRows };
}

function calculateSimulationSemesterTotals(semester) {
  if (semester.mode === "quick") {
    const credits = Number(semester.quickCredits);
    const gpa = Number(semester.quickAverageGpa);
    const hasValidRows = credits > 0 && semester.quickAverageGpa !== "" && Number.isFinite(gpa) && gpa >= 0;
    return {
      credits: hasValidRows ? credits : 0,
      points: hasValidRows ? credits * gpa : 0,
      gpa: hasValidRows ? gpa : 0,
      hasValidRows,
    };
  }

  return calculateSemesterTotals(semester.subjects);
}

function calculateCGPA(semesters) {
  let credits = 0;
  let points = 0;
  let completedSemesters = 0;

  semesters.forEach((semester) => {
    const totals = calculateSemesterTotals(semester.subjects);
    if (totals.credits > 0) completedSemesters += 1;
    credits += totals.credits;
    points += totals.points;
  });

  return {
    credits,
    points,
    gpa: credits > 0 ? points / credits : 0,
    completedSemesters,
  };
}

function calculateProjectedCGPA(realSemesters, simulationSemesters) {
  let credits = 0;
  let points = 0;

  realSemesters.forEach((semester) => {
    const totals = calculateSemesterTotals(semester.subjects);
    credits += totals.credits;
    points += totals.points;
  });

  simulationSemesters.forEach((semester) => {
    const totals = calculateSimulationSemesterTotals(semester);
    credits += totals.credits;
    points += totals.points;
  });

  return {
    totalCredits: credits,
    gpa: credits > 0 ? points / credits : 0,
  };
}

function createEmptySemester(name = "") {
  return {
    id: uid(),
    name,
    subjects: [],
  };
}

function createEmptySimulationSemester(name = "") {
  return {
    id: uid(),
    name,
    mode: "detailed",
    subjects: [],
    quickCredits: "",
    quickAverageGpa: "",
  };
}

function createEmptySubject() {
  return {
    id: uid(),
    name: "",
    credits: "",
    grade: "",
  };
}

function findSemester(semesters, id) {
  return semesters.find((semester) => semester.id === id);
}

function findSubject(semester, subjectId) {
  return semester.subjects.find((subject) => subject.id === subjectId);
}

function saveToLocalStorage() {
  const payload = {
    semesters: state.semesters,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadFromLocalStorage() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.semesters = Array.isArray(parsed.semesters)
      ? parsed.semesters.map(sanitizeSemester)
      : [];
  } catch {
    state.semesters = [];
  }
}

function sanitizeSemester(raw) {
  const semester = {
    id: typeof raw?.id === "string" ? raw.id : uid(),
    name: typeof raw?.name === "string" ? raw.name : "",
    subjects: Array.isArray(raw?.subjects) ? raw.subjects.map(sanitizeSubject) : [],
  };
  return semester;
}

function sanitizeSubject(raw) {
  return {
    id: typeof raw?.id === "string" ? raw.id : uid(),
    name: typeof raw?.name === "string" ? raw.name : "",
    credits: raw?.credits ?? "",
    grade: typeof raw?.grade === "string" && raw.grade in GRADE_POINTS ? raw.grade : "",
  };
}

function uid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatGpa(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
}

function formatCredits(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric.toFixed(2) : "0.00";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("`", "&#96;");
}

function focusSemesterName(semesterId, simulated) {
  window.requestAnimationFrame(() => {
    const selector = simulated
      ? `#simulationSemesters [data-semester-id="${semesterId}"] [data-action="semester-name"]`
      : `#realSemesters [data-semester-id="${semesterId}"] [data-action="semester-name"]`;
    const input = document.querySelector(selector);
    if (input) input.focus();
  });
}

function focusSubjectField(semesterId, subjectId, simulated) {
  window.requestAnimationFrame(() => {
    const selector = simulated
      ? `#simulationSemesters [data-semester-id="${semesterId}"] [data-subject-id="${subjectId}"] [data-action="subject-name"]`
      : `#realSemesters [data-semester-id="${semesterId}"] [data-subject-id="${subjectId}"] [data-action="subject-name"]`;
    const input = document.querySelector(selector);
    if (input) input.focus();
  });
}
