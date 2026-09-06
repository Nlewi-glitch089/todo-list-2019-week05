// -----------------------------------------------------
// DATA: I keep all my tasks in one simple array. Each task
// is an object with an id, the text I typed, and whether
// I've marked it complete yet.
// -----------------------------------------------------
var tasks = [
  { id: 1, text: "Sketch the project idea", completed: false },
  { id: 2, text: "Pick a color palette", completed: false },
  { id: 3, text: "Try the celebration effect", completed: false }
];
var nextId = 4; // I use this to give every new task a unique id

// -----------------------------------------------------
// I grab references to the elements I'll need to update
// often, so I'm not calling getElementById over and over.
// -----------------------------------------------------
var taskListEl = document.getElementById("taskList");
var emptyStateEl = document.getElementById("emptyState");
var taskInputEl = document.getElementById("taskInput");
var addBtnEl = document.getElementById("addBtn");
var ringFillEl = document.getElementById("ringFill");
var progressPercentEl = document.getElementById("progressPercent");
var progressTextEl = document.getElementById("progressText");
var moodEmojiEl = document.getElementById("moodEmoji");
var cardWrapperEl = document.getElementById("cardWrapper");
var celebrationOverlayEl = document.getElementById("celebrationOverlay");
var celebrationSubtextEl = document.getElementById("celebrationSubtext");
var dismissBtnEl = document.getElementById("dismissCelebration");
var confettiLayerEl = document.getElementById("confettiLayer");

var RING_CIRCUMFERENCE = 163.36; // 2 * PI * radius(26), has to match the SVG circle in my CSS
var hasCelebrated = false; // I use this so the big celebration only fires once per "all done" moment

// -----------------------------------------------------
// RENDER: I rebuild the whole list on screen from the
// `tasks` array. I call this any time the data changes so
// the screen never gets out of sync with my data.
// Active tasks show first, completed ones drop below a divider.
// -----------------------------------------------------
function renderTasks() {
  taskListEl.innerHTML = "";
  emptyStateEl.style.display = tasks.length === 0 ? "block" : "none";

  // I sort a copy of my tasks so active ones come first, without
  // losing each task's original order within its own group.
  var sortedTasks = tasks.slice().sort(function (a, b) {
    return Number(a.completed) - Number(b.completed);
  });

  var dividerShown = false;

  sortedTasks.forEach(function (task) {
    // I drop in a small "Completed" divider right before the first completed task.
    if (task.completed && !dividerShown) {
      dividerShown = true;
      var divider = document.createElement("li");
      divider.className = "section-divider";
      divider.textContent = "Completed";
      taskListEl.appendChild(divider);
    }

    var li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");

    var check = document.createElement("div");
    check.className = "check-circle";
    check.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="4,13 9,18 20,6"></polyline></svg>';
    check.addEventListener("click", function () {
      toggleTask(task.id, check);
    });

    var text = document.createElement("span");
    text.className = "task-text";
    text.textContent = task.text;

    var del = document.createElement("button");
    del.className = "delete-btn";
    del.textContent = "✕";
    del.addEventListener("click", function () {
      deleteTask(task.id, li);
    });

    li.appendChild(check);
    li.appendChild(text);
    li.appendChild(del);
    taskListEl.appendChild(li);
  });

  updateProgress();
  checkForCompletion();
}

// -----------------------------------------------------
// I update the progress ring, the percent text, and the
// mood emoji every time the task list changes.
// -----------------------------------------------------
function updateProgress() {
  var total = tasks.length;
  var done = tasks.filter(function (t) { return t.completed; }).length;
  var percent = total === 0 ? 0 : Math.round((done / total) * 100);

  // The ring "fills in" by shrinking its dash offset toward 0.
  var offset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * percent) / 100;
  ringFillEl.style.strokeDashoffset = offset;

  progressPercentEl.textContent = percent + "%";
  progressTextEl.textContent = done + " of " + total + " complete";

  updateMood(percent, total);
}

// -----------------------------------------------------
// I pick a mood emoji based on how much progress I've made,
// and give it a little "bump" animation whenever it changes.
// -----------------------------------------------------
function updateMood(percent, total) {
  var newMood;
  if (total === 0) newMood = "😴";
  else if (percent === 100) newMood = "🥳";
  else if (percent >= 66) newMood = "🤩";
  else if (percent >= 33) newMood = "😃";
  else if (percent > 0) newMood = "🙂";
  else newMood = "😐";

  if (moodEmojiEl.textContent !== newMood) {
    moodEmojiEl.textContent = newMood;
    moodEmojiEl.classList.remove("bump");
    void moodEmojiEl.offsetWidth; // I have to force a reflow so the animation can restart
    moodEmojiEl.classList.add("bump");
  }
}

// -----------------------------------------------------
// I add a new task using whatever I typed into the input box.
// -----------------------------------------------------
function addTask() {
  var value = taskInputEl.value.trim();
  if (value === "") return; // I don't want to add blank tasks

  tasks.push({ id: nextId, text: value, completed: false });
  nextId = nextId + 1;

  taskInputEl.value = "";
  renderTasks();
  taskInputEl.focus();
}

// -----------------------------------------------------
// I flip a task between complete/active here, and fire a
// little ripple animation on the checkbox when I check one.
// -----------------------------------------------------
function toggleTask(id, checkEl) {
  var willBeCompleted = false;

  tasks = tasks.map(function (t) {
    if (t.id === id) {
      willBeCompleted = !t.completed;
      return { id: t.id, text: t.text, completed: !t.completed };
    }
    return t;
  });

  if (willBeCompleted && checkEl) {
    var ripple = document.createElement("span");
    ripple.className = "ripple-ping";
    checkEl.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 600);
  }

  renderTasks();
}

// -----------------------------------------------------
// I delete a task, but I let the fade/slide-out animation
// play first before actually removing it from my data.
// -----------------------------------------------------
function deleteTask(id, liElement) {
  liElement.classList.add("removing");
  setTimeout(function () {
    tasks = tasks.filter(function (t) { return t.id !== id; });
    renderTasks();
  }, 220);
}

// -----------------------------------------------------
// I check whether every task is complete. If it is, and I
// haven't already celebrated this batch, I light up the card
// and fire the full celebration overlay + confetti.
// -----------------------------------------------------
function checkForCompletion() {
  var allComplete = tasks.length > 0 && tasks.every(function (t) { return t.completed; });

  if (allComplete) {
    cardWrapperEl.classList.add("celebrating");

    if (!hasCelebrated) {
      hasCelebrated = true;
      celebrationSubtextEl.textContent =
        "You crossed off all " + tasks.length + " task" + (tasks.length === 1 ? "" : "s") + ". Nice work.";
      celebrationOverlayEl.classList.add("show");
      launchConfetti();
    }
  } else {
    // As soon as one task becomes active again, I reset everything
    // back to normal so the celebration can trigger again later.
    hasCelebrated = false;
    cardWrapperEl.classList.remove("celebrating");
    celebrationOverlayEl.classList.remove("show");
  }
}

// -----------------------------------------------------
// CONFETTI: I spawn a bunch of small colored pieces that fall
// and spin using a CSS animation, then clean them up once
// each piece's animation is done playing.
// -----------------------------------------------------
function launchConfetti() {
  var colors = ["#7c5cff", "#34e0a1", "#ffd166", "#ff6ec7", "#9d7bff"];
  var pieceCount = 90;

  for (var i = 0; i < pieceCount; i++) {
    var piece = document.createElement("div");
    piece.className = "confetti-piece";

    var color = colors[Math.floor(Math.random() * colors.length)];
    var left = Math.random() * 100;
    var duration = 2.2 + Math.random() * 1.8;
    var delay = Math.random() * 0.7;

    piece.style.left = left + "vw";
    piece.style.background = color;
    piece.style.animationDuration = duration + "s";
    piece.style.animationDelay = delay + "s";
    piece.style.borderRadius = Math.random() > 0.5 ? "50%" : "2px";

    confettiLayerEl.appendChild(piece);

    // I remove each piece from the DOM once it's finished falling,
    // so I'm not leaving hundreds of dead elements behind.
    (function (el, totalTime) {
      setTimeout(function () { el.remove(); }, totalTime * 1000 + 100);
    })(piece, duration + delay);
  }
}

// -----------------------------------------------------
// I wire up my buttons, the Enter key, and the celebration
// overlay's dismiss button here.
// -----------------------------------------------------
addBtnEl.addEventListener("click", addTask);
taskInputEl.addEventListener("keydown", function (e) {
  if (e.key === "Enter") addTask();
});
dismissBtnEl.addEventListener("click", function () {
  celebrationOverlayEl.classList.remove("show");
});

// I render once on page load so my starter tasks show up right away.
renderTasks();
