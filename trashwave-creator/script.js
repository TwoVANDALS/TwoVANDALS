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
function createGrid(grid, pattern, isSynth = false) {
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

// === CREATE SYNTH GRID + NOTES LABELS ===
const noteLabels = document.getElementById("synthLabels");
noteLabels.innerHTML = "";
const midiStart = 72; // C5 top

const noteNames = [];
for (let i = 0; i < synthRows; i++) {
  const midi = midiStart - i;
  const note = Tone.Frequency(midi, "midi").toNote();
  noteNames.push(note);
  const label = document.createElement("div");
  label.textContent = note;
  noteLabels.appendChild(label);
}
createGrid(synthGrid, synthPattern, true);

// === STEP SEQUENCER ===
Tone.Transport.scheduleRepeat(time => {
  bpmInput.value = Tone.Transport.bpm.value;
  document.querySelectorAll(".cell").forEach(c => c.classList.remove("playing"));

  // Metronome
  if (metronomeEnabled && currentStep % 4 === 0) {
    samples.metronome.start(time);
  }

  // Drums
  drumPattern.forEach((track, i) => {
    if (track[currentStep]) {
      samples[drumTracks[i]].start(time);
      const row = drumGrid.children[i];
      row.children[currentStep].classList.add("playing");
    }
  });

  // Synth
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

synthType.addEventListener("change", () => {
  synth.set({ oscillator: { type: synthType.value } });
});

toggleMetronomeBtn.addEventListener("click", () => {
  metronomeEnabled = !metronomeEnabled;
  toggleMetronomeBtn.classList.toggle("active", metronomeEnabled);
});
