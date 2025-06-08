// === CONFIG ===
const steps = 16;
const synthRows = 18;
const drumTracks = ["kick", "snare", "hat"];
let currentStep = 0;
let metronomeEnabled = false;

// === TONE SETUP ===
Tone.Transport.bpm.value = 120;
Tone.Transport.loop = true;
Tone.Transport.loopEnd = "1m";

// === ELEMENTS ===
const synthGrid = document.getElementById("synthGrid");
const drumGrid = document.getElementById("drumGrid");
const bpmInput = document.getElementById("bpm");
const synthType = document.getElementById("synthType");
const toggleMetronomeBtn = document.getElementById("toggleMetronome");

// === PATTERNS ===
let synthPattern = Array.from({ length: synthRows }, () => Array(steps).fill(false));
let drumPattern = drumTracks.map(() => Array(steps).fill(false));

// === SAMPLES ===
const samples = {
  kick: [
    "trashkit/Kicks from Dark Web 1.wav",
    "trashkit/Kicks from Dark Web 10.wav",
    "trashkit/Kicks from Dark Web 2.wav"
  ],
  snare: [
    "trashkit/snare5.wav",
    "trashkit/SD-09(Echo).wav",
    "trashkit/SD-10(Slash).wav"
  ],
  hat: [
    "trashkit/HH-14.wav",
    "trashkit/HH-22.wav",
    "trashkit/Open hat 2.wav"
  ],
  metronome: ["samples/metronome.wav"]
};

let selectedSample = {
  kick: 0,
  snare: 0,
  hat: 0
};

let samplePlayers = {
  kick: new Tone.Player(samples.kick[0]).toDestination(),
  snare: new Tone.Player(samples.snare[0]).toDestination(),
  hat: new Tone.Player(samples.hat[0]).toDestination(),
  metronome: new Tone.Player(samples.metronome[0]).toDestination()
};

// === BUILD SELECTS ===
document.querySelectorAll(".sample-select").forEach(select => {
  const track = select.dataset.track;
  samples[track].forEach((src, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = src.split("/").pop();
    select.appendChild(opt);
  });

  select.addEventListener("change", e => {
    const index = parseInt(e.target.value);
    selectedSample[track] = index;
    samplePlayers[track].dispose();
    samplePlayers[track] = new Tone.Player(samples[track][index]).toDestination();
  });
});

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

createGrid(drumGrid, drumPattern);

// === NOTE LABELS ===
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

// === SYNTH SETUP ===
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: synthType.value }
}).toDestination();

// === SEQUENCER ===
Tone.Transport.scheduleRepeat(time => {
  bpmInput.value = Tone.Transport.bpm.value;
  document.querySelectorAll(".cell").forEach(c => c.classList.remove("playing"));

  if (metronomeEnabled && currentStep % 4 === 0) {
    samplePlayers.metronome.start(time);
  }

  drumPattern.forEach((track, i) => {
    if (track[currentStep]) {
      samplePlayers[drumTracks[i]].start(time);
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
