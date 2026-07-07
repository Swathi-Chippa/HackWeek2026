/* ===========================================================
   Habit Tracker — script.js
   A beginner-friendly, well-commented vanilla JS app.
   Data is stored in the browser's localStorage, so it persists
   between visits (but only on this browser/device).
   =========================================================== */

// ---- Constants -------------------------------------------------
const STORAGE_KEY = "ledger.habits";
const DAYS_TO_SHOW = 30;

// ---- App state ---------------------------------------------------
// habits looks like:
// [ { id: "1234", name: "Read 10 pages", completedDates: ["2026-07-01", ...] }, ... ]
let habits = loadHabits();
let selectedHabitId = habits.length ? habits[0].id : null;

// ---- DOM references ----------------------------------------------
const addHabitForm = document.getElementById("add-habit-form");
const habitNameInput = document.getElementById("habit-name");
const habitListEl = document.getElementById("habit-list");
const emptyStateEl = document.getElementById("empty-state");

const noSelectionEl = document.getElementById("no-selection");
const habitDetailEl = document.getElementById("habit-detail");
const detailNameEl = document.getElementById("detail-name");
const streakCountEl = document.getElementById("streak-count");
const statCompletedEl = document.getElementById("stat-completed");
const statBestEl = document.getElementById("stat-best");
const calendarGridEl = document.getElementById("calendar-grid");
const deleteHabitBtn = document.getElementById("delete-habit");

// ===========================================================
// Storage helpers
// ===========================================================

function loadHabits() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("Could not read saved habits, starting fresh.", err);
    return [];
  }
}

function saveHabits() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
}

// ===========================================================
// Date helpers
// ===========================================================

// Formats a Date object as "YYYY-MM-DD" (matches what we store).
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Returns an array of the last N Date objects, oldest first, ending today.
function getLastNDays(n) {
  const days = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push(d);
  }
  return days;
}

// ===========================================================
// Streak calculations
// ===========================================================

// Current streak = consecutive completed days counting back from today.
// If today isn't marked yet, we still count back from yesterday, so the
// streak doesn't reset to zero the moment the clock passes midnight.
function getCurrentStreak(habit) {
  const doneDates = new Set(habit.completedDates);
  let streak = 0;
  let cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  if (!doneDates.has(formatDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (doneDates.has(formatDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// Best streak ever = longest run of consecutive calendar days in completedDates.
function getBestStreak(habit) {
  if (habit.completedDates.length === 0) return 0;

  const sortedDates = [...habit.completedDates].sort();
  let best = 1;
  let current = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prev = new Date(sortedDates[i - 1]);
    const curr = new Date(sortedDates[i]);
    const dayGap = Math.round((curr - prev) / (1000 * 60 * 60 * 24));

    if (dayGap === 1) {
      current++;
    } else if (dayGap > 1) {
      current = 1;
    }
    // dayGap === 0 would mean a duplicate date, which shouldn't happen.

    best = Math.max(best, current);
  }

  return best;
}

// ===========================================================
// Rendering
// ===========================================================

function render() {
  renderHabitList();
  renderHabitDetail();
  saveHabits();
}

function renderHabitList() {
  habitListEl.innerHTML = "";

  emptyStateEl.hidden = habits.length > 0;

  habits.forEach((habit) => {
    const li = document.createElement("li");
    li.className = "habit-item";
    if (habit.id === selectedHabitId) {
      li.classList.add("is-selected");
    }

    const streak = getCurrentStreak(habit);

    li.innerHTML = `
      <span class="habit-item__name">${escapeHtml(habit.name)}</span>
      <span class="habit-item__streak">${streak > 0 ? `🔥 ${streak}` : "—"}</span>
    `;

    li.addEventListener("click", () => {
      selectedHabitId = habit.id;
      render();
    });

    habitListEl.appendChild(li);
  });
}

function renderHabitDetail() {
  const habit = habits.find((h) => h.id === selectedHabitId);

  if (!habit) {
    noSelectionEl.hidden = false;
    habitDetailEl.hidden = true;
    return;
  }

  noSelectionEl.hidden = true;
  habitDetailEl.hidden = false;

  detailNameEl.textContent = habit.name;
  streakCountEl.textContent = getCurrentStreak(habit);
  statBestEl.textContent = getBestStreak(habit);

  const last30Days = getLastNDays(DAYS_TO_SHOW);
  const doneDates = new Set(habit.completedDates);
  const completedInWindow = last30Days.filter((d) => doneDates.has(formatDate(d))).length;
  statCompletedEl.textContent = completedInWindow;

  renderCalendar(habit, last30Days, doneDates);
}

function renderCalendar(habit, days, doneDates) {
  calendarGridEl.innerHTML = "";
  const todayStr = formatDate(new Date());

  days.forEach((date) => {
    const dateStr = formatDate(date);
    const isDone = doneDates.has(dateStr);
    const isToday = dateStr === todayStr;

    const cell = document.createElement("button");
    cell.type = "button";
    cell.className = "day-cell";
    if (isDone) cell.classList.add("is-done");
    if (isToday) cell.classList.add("is-today");

    const dayNumber = date.getDate();
    const monthShort = date.toLocaleString(undefined, { month: "short" });

    cell.innerHTML = `<span class="day-cell__date">${monthShort} ${dayNumber}</span>`;
    cell.setAttribute(
      "aria-label",
      `${dateStr}${isDone ? ", completed" : ", not completed"}. Toggle.`
    );

    cell.addEventListener("click", () => toggleDay(habit.id, dateStr));

    calendarGridEl.appendChild(cell);
  });
}

// Basic escaping so a habit name can't break the HTML we inject.
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ===========================================================
// Actions
// ===========================================================

function addHabit(name) {
  const trimmed = name.trim();
  if (!trimmed) return;

  const newHabit = {
    id: Date.now().toString(),
    name: trimmed,
    completedDates: [],
  };

  habits.push(newHabit);
  selectedHabitId = newHabit.id;
  render();
}

function toggleDay(habitId, dateStr) {
  const habit = habits.find((h) => h.id === habitId);
  if (!habit) return;

  const index = habit.completedDates.indexOf(dateStr);
  if (index === -1) {
    habit.completedDates.push(dateStr);
  } else {
    habit.completedDates.splice(index, 1);
  }

  render();
}

function deleteHabit(habitId) {
  habits = habits.filter((h) => h.id !== habitId);
  if (selectedHabitId === habitId) {
    selectedHabitId = habits.length ? habits[0].id : null;
  }
  render();
}

// ===========================================================
// Event listeners
// ===========================================================

addHabitForm.addEventListener("submit", (event) => {
  event.preventDefault();
  addHabit(habitNameInput.value);
  habitNameInput.value = "";
  habitNameInput.focus();
});

deleteHabitBtn.addEventListener("click", () => {
  if (!selectedHabitId) return;
  const habit = habits.find((h) => h.id === selectedHabitId);
  const confirmed = confirm(`Remove "${habit.name}" and all of its history?`);
  if (confirmed) {
    deleteHabit(selectedHabitId);
  }
});

// ---- Initial render ------------------------------------------------
render();
