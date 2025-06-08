// === CONFIG ===
const steps = 16;
const synthRows = 24; // увеличенный диапазон нот (2 октавы)
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
const synth = new Tone.PolySynth(Tone.MonoSynth, {
  oscillator: { type: synthType.value.toLowerCase() || "sawtooth" },
  envelope: { attack: 0.01, decay: 0.2, sustain: 0.4, release: 0.8 },
  portamento: 0.05 // 🎛️ глайд
}).toDestination();

const samples = {
  kick: new Tone.Player("samples/kick.wav").toDestination(),
  snare: new Tone.Player("samples/snare.wav").toDestination(),
  hat: new Tone.Player("samples/hat.wav").toDestination(),
};

// === Метроном
const metronome = new Tone.MembraneSynth().toDestination();

// === GRID ===
function createGrid(grid, pattern, isSynth = false) {
  grid.innerHTML = "";
  pattern.forEach((row, rowIndex) => {
    const rowEl = document.createElement("div");
    rowEl.classList.add("row");

    row.forEach((_, colIndex) => {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      if (colIndex % 4 === 0) {
        cell.classList.add("bar-marker");
      }

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
createGrid(synthGrid, synthPattern, true);

// === STEP LOGIC ===
Tone.Transport.scheduleRepeat(time => {
  bpmInput.value = Tone.Transport.bpm.value;
  document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("playing"));

  // 🎵 Ударные
  drumPattern.forEach((track, i) => {
    if (track[currentStep]) {
      samples[drumTracks[i]].start(time);
      const index = i * steps + currentStep;
      if (drumGrid.children[i]) {
        drumGrid.children[i].children[currentStep]?.classList.add("playing");
      }
    }
  });

  // 🎹 Синт
  const notes = [];
  synthPattern.forEach((row, y) => {
    if (row[currentStep]) {
      const note = Tone.Frequency(36 + (synthRows - 1 - y), "midi").toNote(); // 🔊 поддержка баса
      notes.push(note);
      synthGrid.children[y].children[currentStep]?.classList.add("playing");
    }
  });

  if (notes.length) {
    synth.set({ oscillator: { type: synthType.value.toLowerCase() } });
    notes.forEach(note => {
      synth.triggerAttackRelease(note, "8n", time);
    });
  }

  // 🎯 Метроном
  if (currentStep % 4 === 0) {
    metronome.triggerAttackRelease("C2", "8n", time);
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
