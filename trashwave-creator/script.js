const steps = 16;
const synthRows = 18;
const trackTypes = ["kick", "snare", "hat", "bass", "fx", "keys"];
let currentStep = 0;
let metronomeEnabled = false;

// Pattern state
let synthPattern = Array.from({ length: synthRows }, () => Array(steps).fill(false));
let drumPattern = trackTypes.map(() => Array(steps).fill(false));

Tone.Transport.bpm.value = 120;
Tone.Transport.loop = true;
Tone.Transport.loopEnd = "1m";

// Elements
const drumGrid = document.getElementById("drumGrid");
const synthGrid = document.getElementById("synthGrid");
const bassGrid = document.getElementById("bassGrid");
const bpmInput = document.getElementById("bpm");
const synthType = document.getElementById("synthType");
const toggleMetronomeBtn = document.getElementById("toggleMetronome");
const previewPlayer = document.getElementById("previewPlayer");

const sampleSelectors = document.querySelectorAll(".sample-selector");

const samples = {
  metronome: new Tone.Player("samples/metronome.wav").toDestination()
};

const sampleMap = {
  kick: [],
  snare: [],
  hat: [],
  bass: [],
  fx: [],
  keys: []
};

const players = {
  kick: new Tone.Players().toDestination(),
  snare: new Tone.Players().toDestination(),
  hat: new Tone.Players().toDestination(),
  bass: new Tone.Players().toDestination(),
  fx: new Tone.Players().toDestination(),
  keys: new Tone.Players().toDestination()
};

// Load available samples from trashkit/ directory
const allSamples = [
  "8087.wav", "BD-01.wav", "BD02.wav", "HH-14.wav", "HH-15.wav", "HH-22.wav", "HH-23.wav",
  "Kicks from Dark Web 1.wav", "Kicks from Dark Web 2.wav", "Kicks from Dark Web 10.wav", "Kicks from Dark Web 11.wav",
  "Open Hat (6).wav", "Open hat 1.wav", "Open hat 2.wav", "Open hat 4.wav", "Open hat 5.wav",
  "SD-09(Echo).wav", "SD-10(Slash).wav", "SD-11(Damage).wav", "SD-13(Dying).wav",
  "Sample pack reese.wav", "Saple pack pro reese 2.wav", "reese1.wav", "reese2.wav", "reese3.wav",
  "snare5.wav", "snare6.wav", "snare7.wav", "snare8.wav",
  "oh1.wav", "oh2.wav", "oh3.wav"
];

function categorizeSample(filename) {
  const low = filename.toLowerCase();
  if (low.includes("snare") || low.includes("sd-")) return "snare";
  if (low.includes("kick") || low.includes("bd")) return "kick";
  if (low.includes("hat") || low.includes("hh") || low.includes("oh")) return "hat";
  if (low.includes("reese") || low.includes("bass")) return "bass";
  if (low.includes("fx") || low.includes("slash") || low.includes("damage")) return "fx";
  if (low.includes("sample pack") || low.includes("pad") || low.includes("key")) return "keys";
  return null;
}

allSamples.forEach(name => {
  const type = categorizeSample(name);
  if (type && players[type]) {
    const url = `samples/trashkit/${name}`;
    sampleMap[type].push({ name, url });
    players[type].add(name, url);
  }
});

sampleSelectors.forEach(sel => {
  const type = sel.dataset.type;
  sampleMap[type].forEach(s => {
    const option = document.createElement("option");
    option.value = s.name;
    option.textContent = s.name;
    sel.appendChild(option);
  });
  sel.addEventListener("change", e => {
    previewPlayer.src = `samples/trashkit/${e.target.value}`;
    previewPlayer.play();
  });
});

// Poly synth
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: synthType.value }
}).toDestination();

const noteLabels = document.getElementById("noteLabels");
noteLabels.innerHTML = "";
const midiStart = 84;
const noteNames = [];
for (let i = 0; i < synthRows; i++) {
  const note = Tone.Frequency(midiStart - i, "midi").toNote();
  noteNames.push(note);
  const label = document.createElement("div");
  label.textContent = note;
  noteLabels.appendChild(label);
}

// Grid builders
function createGrid(gridEl, pattern) {
  gridEl.innerHTML = "";
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
    gridEl.appendChild(rowEl);
  });
}

createGrid(drumGrid, drumPattern.slice(0, 3)); // kick/snare/hat
createGrid(synthGrid, synthPattern);
createGrid(bassGrid, drumPattern.slice(3)); // bass/fx/keys

// Step sequencer
Tone.Transport.scheduleRepeat(time => {
  bpmInput.value = Tone.Transport.bpm.value;
  document.querySelectorAll(".cell").forEach(c => c.classList.remove("playing"));

  if (metronomeEnabled && currentStep % 4 === 0) samples.metronome.start(time);

  for (let i = 0; i < trackTypes.length; i++) {
    const track = drumPattern[i];
    const type = trackTypes[i];
    const selected = document.querySelector(`.sample-selector[data-type="${type}"]`);
    if (track[currentStep] && selected?.value) {
      players[type].player(selected.value).start(time);
    }
    const grid = i < 3 ? drumGrid : bassGrid;
    grid?.children[i % 3]?.children[currentStep]?.classList.add("playing");
  }

  const notes = [];
  synthPattern.forEach((row, y) => {
    if (row[currentStep]) {
      notes.push(noteNames[y]);
      synthGrid.children[y].children[currentStep].classList.add("playing");
    }
  });

  if (notes.length) {
    synth.set({ oscillator: { type: synthType.value } });
    synth.triggerAttackRelease(notes, "16n", time);
  }

  currentStep = (currentStep + 1) % steps;
}, "16n");

// Controls
document.getElementById("playBtn").addEventListener("click", async () => {
  await Tone.start();
  Tone.Transport.bpm.value = parseInt(bpmInput.value, 10);
  currentStep = 0;
  Tone.Transport.start();
  document.getElementById("playBtn").classList.add("active");
});

document.getElementById("stopBtn").addEventListener("click", () => {
  Tone.Transport.stop();
  currentStep = 0;
  document.getElementById("playBtn").classList.remove("active");
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
