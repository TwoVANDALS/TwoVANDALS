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

// === STATE ===
let synthPattern = Array.from({ length: synthRows }, () => Array(steps).fill(false));
let drumPattern = drumTracks.map(() => Array(steps).fill(false));

// === AUDIO ===
const synth = new Tone.PolySynth(Tone.Synth, {
  oscillator: { type: synthType.value.toLowerCase() }
}).toDestination();

const samples = {
  Kick: new Tone.Player("samples/kick.wav").toDestination(),
  Snare: new Tone.Player("samples/snare.wav").toDestination(),
  Hat: new Tone.Player("samples/hat.wav").toDestination()
};

// === UTILS ===
function createLabelColumn(container, labels) {
  container.innerHTML = "";
  labels.forEach(label => {
    const div = document.createElement("div");
    div.textContent = label;
    container.appendChild(div);
  });
}

function createGrid(container, pattern, isSynth = false) {
  container.innerHTML = "";
  pattern.forEach((row, rowIndex) => {
    row.forEach((_, colIndex) => {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;
      cell.addEventListener("click", () => {
        pattern[rowIndex][colIndex] = !pattern[rowIndex][colIndex];
        cell.classList.toggle("active");
      });
      container.appendChild(cell);
    });
  });
}

// === INIT ===
const synthNotes = [...Array(synthRows)].map((_, i) =>
  Tone.Frequency(60 + (synthRows - 1 - i), "midi").toNote()
);

createGrid(synthGrid, synthPattern, true);
createGrid(drumGrid, drumPattern);
createLabelColumn(document.getElementById("synthLabels"), synthNotes);
createLabelColumn(document.getElementById("drumLabels"), drumTracks);

// === PLAYBACK LOGIC ===
Tone.Transport.scheduleRepeat(time => {
  bpmInput.value = Tone.Transport.bpm.value;
  document.querySelectorAll(".cell").forEach(cell => cell.classList.remove("playing"));

  // DRUMS
  drumPattern.forEach((track, row) => {
    if (track[currentStep]) {
      samples[drumTracks[row]].start(time);
      const index = row * steps + currentStep;
      drumGrid.children[index].classList.add("playing");
    }
  });

  // SYNTH
  const notesToPlay = [];
  synthPattern.forEach((row, y) => {
    if (row[currentStep]) {
      const note = synthNotes[y];
      notesToPlay.push(note);
      const index = y * steps + currentStep;
      synthGrid.children[index].classList.add("playing");
    }
  });

  if (notesToPlay.length > 0) {
    synth.set({ oscillator: { type: synthType.value.toLowerCase() } });
    synth.triggerAttackRelease(notesToPlay, "8n", time);
  }

  currentStep = (currentStep + 1) % steps;
}, "16n");

// === CONTROLS ===
document.getElementById("playBtn").addEventListener("click", async () => {
  await Tone.start();
  Tone.Transport.bpm.value = parseInt(bpmInput.value);
  currentStep = 0;
  Tone.Transport.start();
});

document.getElementById("stopBtn").addEventListener("click", () => {
  Tone.Transport.stop();
  currentStep = 0;
});

bpmInput.addEventListener("input", e => {
  Tone.Transport.bpm.value = parseInt(e.target.value);
});

// === EXPORT / SAVE ===
document.getElementById("saveBtn").addEventListener("click", () => {
  const data = { synthPattern, drumPattern };
  const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "trashwave-pattern.json";
  a.click();
});

document.getElementById("exportBtn").addEventListener("click", async () => {
  const recorder = new Tone.Recorder();
  synth.connect(recorder);
  Object.values(samples).forEach(sample => sample.connect(recorder));
  recorder.start();
  Tone.Transport.stop();
  Tone.Transport.start();
  setTimeout(async () => {
    Tone.Transport.stop();
    const recording = await recorder.stop();
    const blob = new Blob([recording], { type: "audio/wav" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "trashwave-export.wav";
    a.click();
  }, 4000);
});
