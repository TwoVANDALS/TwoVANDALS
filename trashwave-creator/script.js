// === CONFIG ===
const steps = 16;
const synthRows = 12;
const drumTracks = ["kick", "snare", "hat"];
let currentStep = 0;

Tone.Transport.bpm.value = 120;
Tone.Transport.loop = true;
Tone.Transport.loopEnd = "1m";

// === ELEMENTS ===
const synthGrid = document.getElementById("synthGrid");
const drumGrid = document.getElementById("drumGrid");
const bpmInput = document.getElementById("bpm");
const synthType = document.getElementById("synthType");

// === STATE ===
let synthPattern = Array.from({ length: synthRows }, () => Array(steps).fill(false));
let drumPattern = drumTracks.map(() => Array(steps).fill(false));

// === AUDIO ===
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: synthType.value.toLowerCase() }
}).toDestination();

const samples = {
  kick: new Tone.Player("samples/kick.wav").toDestination(),
  snare: new Tone.Player("samples/snare.wav").toDestination(),
  hat: new Tone.Player("samples/hat.wav").toDestination(),
};

// === GRID CREATION ===
function createGrid(grid, pattern, isSynth = false) {
  grid.innerHTML = "";
  pattern.forEach((row, rowIndex) => {
    row.forEach((_, colIndex) => {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (colIndex % 4 === 0) cell.classList.add("bar-start");
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;
      cell.addEventListener("click", () => {
        pattern[rowIndex][colIndex] = !pattern[rowIndex][colIndex];
        cell.classList.toggle("active");
      });
      grid.appendChild(cell);
    });
  });
}

createGrid(drumGrid, drumPattern);
createGrid(synthGrid, synthPattern, true);

// === STEP LOGIC ===
Tone.Transport.scheduleRepeat(time => {
  bpmInput.value = Tone.Transport.bpm.value;

  // 🔄 Clear previous highlights
  document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("playing"));

  // 🥁 Drums
  drumPattern.forEach((track, i) => {
    if (track[currentStep]) {
      samples[drumTracks[i]].start(time);
      const index = i * steps + currentStep;
      drumGrid.children[index]?.classList.add("playing");
    }
  });

  // 🎹 Synth
  const notes = [];
  synthPattern.forEach((row, y) => {
    if (row[currentStep]) {
      const midi = 60 + (synthRows - 1 - y);
      const note = Tone.Frequency(midi, "midi").toNote();
      notes.push(note);
      const index = y * steps + currentStep;
      synthGrid.children[index]?.classList.add("playing");
    }
  });

  if (notes.length) {
    synth.set({ oscillator: { type: synthType.value.toLowerCase() } });
    synth.triggerAttackRelease(notes, "8n", time);
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
  synth.set({ oscillator: { type: synthType.value.toLowerCase() } });
});

// === SAVE ===
document.getElementById("saveBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify({ synthPattern, drumPattern })], {
    type: "application/json"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "pattern.json";
  a.click();
});

// === EXPORT AUDIO ===
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
