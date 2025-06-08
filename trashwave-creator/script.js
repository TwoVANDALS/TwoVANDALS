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
const synth = new Tone.PolySynth().toDestination();

const samples = {
  kick: new Tone.Player("samples/kick.wav").toDestination(),
  snare: new Tone.Player("samples/snare.wav").toDestination(),
  hat: new Tone.Player("samples/hat.wav").toDestination(),
};


// === GRID ===
function createGrid(grid, pattern) {
  grid.innerHTML = "";
  pattern.forEach((row, rowIndex) => {
    row.forEach((_, colIndex) => {
      const cell = document.createElement("div");
      cell.classList.add("cell");

      // 📏 Добавим визуальный бар каждый 4 шаг
      if (colIndex % 4 === 0) {
        cell.classList.add("bar-marker");
      }

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
createGrid(synthGrid, synthPattern);

// === STEP LOGIC ===
Tone.Transport.scheduleRepeat(time => {
  bpmInput.value = Tone.Transport.bpm.value;
  document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("playing"));

  drumPattern.forEach((track, i) => {
    if (track[currentStep]) {
      samples[drumTracks[i]].start(time);
      drumGrid.children[i * steps + currentStep].classList.add("playing");
    }
  });

  const notes = [];
  synthPattern.forEach((row, y) => {
    if (row[currentStep]) {
      const note = Tone.Frequency(60 + (synthRows - 1 - y), "midi").toNote();
      notes.push(note);
      synthGrid.children[y * steps + currentStep].classList.add("playing");
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
