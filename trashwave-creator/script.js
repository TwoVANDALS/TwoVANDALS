// === CONFIG ===
const steps = 16;
const drumTracks = ["kick", "snare", "hat", "fx"];
const synthRows = 18;
const bassRows = 6;
const keysRows = 8;

let currentStep = 0;
let metronomeEnabled = false;

Tone.Transport.bpm.value = 120;
Tone.Transport.loop = true;
Tone.Transport.loopEnd = "1m";

// === ELEMENTS ===
const drumGrid = document.getElementById("drumGrid");
const synthGrid = document.getElementById("synthGrid");
const bassGrid = document.getElementById("bassGrid");
const keysGrid = document.getElementById("keysGrid");

const drumLabels = document.getElementById("drumLabels");
const synthLabels = document.getElementById("synthLabels");
const bassLabels = document.getElementById("bassLabels");
const keysLabels = document.getElementById("keysLabels");

const bpmInput = document.getElementById("bpm");
const synthType = document.getElementById("synthType");
const toggleMetronomeBtn = document.getElementById("toggleMetronome");

const playBtn = document.getElementById("playBtn");
const stopBtn = document.getElementById("stopBtn");

// === STATE ===
let drumPattern = drumTracks.map(() => Array(steps).fill(false));
let synthPattern = Array.from({ length: synthRows }, () => Array(steps).fill(false));
let bassPattern = Array.from({ length: bassRows }, () => Array(steps).fill(false));
let keysPattern = Array.from({ length: keysRows }, () => Array(steps).fill(false));

// === AUDIO ===
const samplePath = "samples/trashkit/";
const availableSamples = {
  kick: ["Kicks from Dark Web 1.wav", "Kicks from Dark Web 2.wav", "Kicks from Dark Web 3.wav"],
  snare: ["snare5.wav", "snare6.wav", "snare7.wav"],
  hat: ["HH-14.wav", "HH-15.wav", "HH-22.wav"],
  fx: ["SD-10(Slash).wav", "SD-09(Echo).wav"],
  bass: ["8087.wav", "reese1.wav", "reese2.wav"],
  keys: ["haunted.wav", "majestic.wav"]
};

let selectedSample = {
  kick: "Kicks from Dark Web 1.wav",
  snare: "snare5.wav",
  hat: "HH-14.wav",
  fx: "SD-10(Slash).wav"
};

const players = {};
for (const [type, list] of Object.entries(availableSamples)) {
  players[type] = {};
  list.forEach(name => {
    players[type][name] = new Tone.Player(samplePath + name).toDestination();
  });
}

const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: synthType.value }
}).toDestination();

// === HELPERS ===
function createGrid(grid, pattern, labelList, labelContainer, type = null) {
  grid.innerHTML = "";
  labelContainer.innerHTML = "";

  pattern.forEach((row, rowIndex) => {
    const rowEl = document.createElement("div");
    rowEl.classList.add("row");

    const labelDiv = document.createElement("div");
    labelDiv.classList.add("label-row");

    if (type && availableSamples[type]) {
      const select = document.createElement("select");
      select.className = "sample-selector";
      availableSamples[type].forEach(sample => {
        const opt = document.createElement("option");
        opt.value = sample;
        opt.textContent = sample.replace(".wav", "");
        if (sample === selectedSample[type]) opt.selected = true;
        select.appendChild(opt);
      });
      select.addEventListener("change", (e) => {
        selectedSample[type] = e.target.value;
        const preview = players[type][selectedSample[type]];
        if (preview) preview.start();
      });
      labelDiv.appendChild(select);
    } else {
      const label = document.createElement("div");
      label.textContent = labelList[rowIndex];
      labelDiv.appendChild(label);
    }

    labelContainer.appendChild(labelDiv);

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

// === BUILD GRIDS ===
createGrid(drumGrid, drumPattern, drumTracks, drumLabels, "kick");
createGrid(synthGrid, synthPattern, generateNoteLabels(72, synthRows), synthLabels);
createGrid(bassGrid, bassPattern, generateNoteLabels(48, bassRows), bassLabels);
createGrid(keysGrid, keysPattern, generateNoteLabels(60, keysRows), keysLabels);

function generateNoteLabels(startMidi, count) {
  return Array.from({ length: count }, (_, i) =>
    Tone.Frequency(startMidi - i, "midi").toNote()
  );
}

// === STEP LOOP ===
Tone.Transport.scheduleRepeat(time => {
  bpmInput.value = Tone.Transport.bpm.value;
  document.querySelectorAll(".cell").forEach(c => c.classList.remove("playing"));

  if (metronomeEnabled && currentStep % 4 === 0) {
    // Optionally play metronome sample
  }

  drumPattern.forEach((track, i) => {
    if (track[currentStep]) {
      const type = drumTracks[i];
      const name = selectedSample[type];
      players[type][name]?.start(time);
      const row = drumGrid.children[i];
      row.children[currentStep].classList.add("playing");
    }
  });

  const noteNames = generateNoteLabels(72, synthRows);
  const bassNames = generateNoteLabels(48, bassRows);
  const keyNames = generateNoteLabels(60, keysRows);

  triggerNotes(synthPattern, noteNames, synthGrid, time);
  triggerNotes(bassPattern, bassNames, bassGrid, time);
  triggerNotes(keysPattern, keyNames, keysGrid, time);

  currentStep = (currentStep + 1) % steps;
}, "16n");

function triggerNotes(pattern, noteNames, grid, time) {
  const notes = [];
  pattern.forEach((row, y) => {
    if (row[currentStep]) {
      notes.push(noteNames[y]);
      const rowEl = grid.children[y];
      rowEl.children[currentStep].classList.add("playing");
    }
  });
  if (notes.length) {
    synth.set({ oscillator: { type: synthType.value } });
    synth.triggerAttackRelease(notes, "16n", time);
  }
}

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
