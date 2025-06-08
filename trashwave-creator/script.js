// === CONFIG ===
const steps = 16;
const synthRows = 18;
const drumTracks = ["kick", "snare", "hat"];
let currentStep = 0;
let metronomeEnabled = false;

Tone.Transport.bpm.value = 120;
Tone.Transport.loop = true;
Tone.Transport.loopEnd = "1m";

// === ELEMENTS ===
const synthGrid = document.getElementById("synthGrid");
const drumGrid = document.getElementById("drumGrid");
const bpmInput = document.getElementById("bpm");
const synthType = document.getElementById("synthType");
const toggleMetronomeBtn = document.getElementById("toggleMetronome");
const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");

// === STATE ===
let synthPattern = Array.from({ length: synthRows }, () => Array(steps).fill(false));
let drumPattern = drumTracks.map(() => Array(steps).fill(false));

// === AUDIO ===
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: synthType.value }
}).toDestination();

const samples = {
  kick: new Tone.Player("samples/kick.wav").toDestination(),
  snare: new Tone.Player("samples/snare.wav").toDestination(),
  hat: new Tone.Player("samples/hat.wav").toDestination(),
  metronome: new Tone.Player("samples/metronome.wav").toDestination()
};

// === GRID CREATION ===
function createGrid(grid, pattern) {
  grid.innerHTML = "";
  pattern.forEach((row, rowIndex) => {
    const rowEl = document.createElement("div");
    rowEl.classList.add("row");
    row.forEach((_, colIndex) => {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (colIndex % 4 === 0) cell.classList.add("bar-marker");
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;
      cell.addEventListener("click", () => {
        pattern[rowIndex][colIndex] = !pattern[rowIndex][colIndex];
        cell.classList.toggle("active");
      });
      rowEl.appendChild(cell);
    });
    grid.appendChild(rowEl);
  });
}

// === CREATE DRUM GRID ===
createGrid(drumGrid, drumPattern);

// === CREATE SYNTH GRID + NOTE LABELS ===
const noteLabels = document.getElementById("noteLabels");
noteLabels.innerHTML = "";
const midiStart = 84;

const noteNames = [];
for (let i = 0; i < synthRows; i++) {
  const midi = midiStart - i;
  const note = Tone.Frequency(midi, "midi").toNote();
  noteNames.push(note);
  const label = document.createElement("div");
  label.textContent = note;
  noteLabels.appendChild(label);
}

createGrid(synthGrid, synthPattern);

// === STEP SEQUENCER ===
Tone.Transport.scheduleRepeat(time => {
  bpmInput.value = Tone.Transport.bpm.value;
  document.querySelectorAll(".cell").forEach(c => c.classList.remove("playing"));

  if (metronomeEnabled && currentStep % 4 === 0) {
    samples.metronome.start(time);
  }

  drumPattern.forEach((track, i) => {
    if (track[currentStep]) {
      samples[drumTracks[i]].start(time);
      const row = drumGrid.children[i];
      row.children[currentStep].classList.add("playing");
    }
  });

  const notes = [];
  synthPattern.forEach((row, y) => {
    if (row[currentStep]) {
      notes.push(noteNames[y]);
      const rowEl = synthGrid.children[y];
      rowEl.children[currentStep].classList.add("playing");
    }
  });

  if (notes.length) {
    synth.set({ oscillator: { type: synthType.value } });
    synth.triggerAttackRelease(notes, "16n", time);
  }

  currentStep = (currentStep + 1) % steps;
}, "16n");

// === CONTROLS ===
playBtn.addEventListener("click", async () => {
  await Tone.start();
  Tone.Transport.bpm.value = parseInt(bpmInput.value, 10);
  currentStep = 0;
  Tone.Transport.start();

  playBtn.classList.add("active");
  stopBtn.classList.remove("active");
});

stopBtn.addEventListener("click", () => {
  Tone.Transport.stop();
  currentStep = 0;

  stopBtn.classList.add("active");
  playBtn.classList.remove("active");
});

bpmInput.addEventListener("input", e => {
  Tone.Transport.bpm.value = parseInt(e.target.value, 10);
});

synthType.addEventListener("change", () => {
  synth.set({ oscillator: { type: synthType.value } });
});

toggleMetronomeBtn.addEventListener("click", () => {
  metronomeEnabled = !metronomeEnabled;
  toggleMetronomeBtn.classList.toggle("active", metronomeEnabled);
});