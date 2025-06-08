// === CONFIG ===
const steps = 16;
const synthRows = 12;
const drumTracks = ["Kick", "Snare", "Hat"];
let currentStep = 0;

Tone.Transport.bpm.value = 120;
Tone.Transport.loop = true;
Tone.Transport.loopEnd = "1m";

// === ELEMENTS ===
const synthGrid = document.getElementById("synthGrid");
const drumGrid = document.getElementById("drumGrid");
const bpmInput = document.getElementById("bpm");
const synthType = document.getElementById("synthType");
const noteLabels = document.getElementById("noteLabels");
const drumLabels = document.getElementById("drumLabels");

// === STATE ===
let synthPattern = Array.from({ length: synthRows }, () => Array(steps).fill(false));
let synthVelocity = Array.from({ length: synthRows }, () => Array(steps).fill(0.8));
let drumPattern = drumTracks.map(() => Array(steps).fill(false));
let drumVelocity = drumTracks.map(() => Array(steps).fill(0.8));

// === AUDIO ===
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: synthType.value.toLowerCase() }
}).toDestination();

const samples = {
  Kick: new Tone.Player("samples/kick.wav").toDestination(),
  Snare: new Tone.Player("samples/snare.wav").toDestination(),
  Hat: new Tone.Player("samples/hat.wav").toDestination(),
};

// === GRID BUILD ===
function createNoteLabels() {
  noteLabels.innerHTML = "";
  for (let i = 0; i < synthRows; i++) {
    const note = Tone.Frequency(60 + (synthRows - 1 - i), "midi").toNote();
    const label = document.createElement("div");
    label.className = "note-label";
    label.textContent = note;
    noteLabels.appendChild(label);
  }
}

function createDrumLabels() {
  drumLabels.innerHTML = "";
  drumTracks.forEach(name => {
    const label = document.createElement("div");
    label.className = "drum-label";
    label.textContent = name;
    drumLabels.appendChild(label);
  });
}

function createGrid(grid, pattern, velocityPattern, isSynth = false) {
  grid.innerHTML = "";
  pattern.forEach((row, rowIndex) => {
    row.forEach((_, colIndex) => {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (colIndex % 4 === 0) cell.classList.add("bar");
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;

      cell.addEventListener("click", () => {
        pattern[rowIndex][colIndex] = !pattern[rowIndex][colIndex];
        if (pattern[rowIndex][colIndex]) {
          velocityPattern[rowIndex][colIndex] = 0.8;
          cell.classList.add("active");
        } else {
          velocityPattern[rowIndex][colIndex] = 0;
          cell.classList.remove("active");
        }
      });

      grid.appendChild(cell);
    });
  });
}

createNoteLabels();
createDrumLabels();
createGrid(drumGrid, drumPattern, drumVelocity);
createGrid(synthGrid, synthPattern, synthVelocity, true);

// === STEP LOGIC ===
Tone.Transport.scheduleRepeat(time => {
  bpmInput.value = Tone.Transport.bpm.value;
  document.querySelectorAll(".cell").forEach(c => c.classList.remove("playing"));

  // play drums
  drumPattern.forEach((track, i) => {
    if (track[currentStep]) {
      samples[drumTracks[i]].volume.value = Tone.gainToDb(drumVelocity[i][currentStep]);
      samples[drumTracks[i]].start(time);
      drumGrid.children[i * steps + currentStep].classList.add("playing");
    }
  });

  // play synths
  const notes = [];
  synthPattern.forEach((row, y) => {
    if (row[currentStep]) {
      const note = Tone.Frequency(60 + (synthRows - 1 - y), "midi").toNote();
      notes.push({ note, vel: synthVelocity[y][currentStep] });
      synthGrid.children[y * steps + currentStep].classList.add("playing");
    }
  });

  if (notes.length) {
    synth.set({ oscillator: { type: synthType.value.toLowerCase() } });
    notes.forEach(n => {
      synth.triggerAttackRelease(n.note, "8n", time, n.vel);
    });
  }

  currentStep = (currentStep + 1) % steps;
}, "16n");

// === CONTROLS ===
document.getElementById("playBtn").addEventListener("click", async () => {
  await Tone.start();
  Tone.Transport.bpm.value = parseInt(bpmInput.value, 10);
  currentStep = 0;
  Tone.Transport.start();
});

document.getElementById("stopBtn").addEventListener("click", () => {
  Tone.Transport.stop();
  currentStep = 0;
});

bpmInput.addEventListener("input", e => {
  Tone.Transport.bpm.value = parseInt(e.target.value, 10);
});

// === EXPORT & SAVE ===
document.getElementById("saveBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ synthPattern, drumPattern })], {
    type: "application/json"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pattern.json";
  a.click();
});

document.getElementById("exportBtn").addEventListener("click", async () => {
  const recorder = new Tone.Recorder();
  synth.connect(recorder);
  Object.values(samples).forEach(s => s.connect(recorder));
  recorder.start();
  Tone.Transport.stop();
  Tone.Transport.start();
  setTimeout(async () => {
    Tone.Transport.stop();
    const recording = await recorder.stop();
    const blob = new Blob([recording], { type: "audio/wav" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "export.wav";
    a.click();
  }, 4000);
});
