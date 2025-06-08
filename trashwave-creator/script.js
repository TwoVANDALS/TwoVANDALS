// === CONFIG ===
const drumSounds = ["kick.wav", "snare.wav", "hat.wav"];
const synthNotes = ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"];

// === STATE ===
let drumPattern = Array(drumSounds.length).fill().map(() => Array(16).fill(false));
let synthPattern = Array(synthNotes.length).fill().map(() => Array(16).fill(false));

let drumPlayers = new Tone.Players({
  kick: "samples/kick.wav",
  snare: "samples/snare.wav",
  hat: "samples/hat.wav"
}).toDestination();

let synth = new Tone.Synth().toDestination();

// === GRID GENERATION ===
function createGrid(containerId, rows, cols, pattern) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      if (pattern[y][x]) cell.classList.add("active");
      cell.addEventListener("click", () => {
        pattern[y][x] = !pattern[y][x];
        cell.classList.toggle("active");
      });
      container.appendChild(cell);
    }
  }
}

createGrid("drumGrid", drumSounds.length, 16, drumPattern);
createGrid("synthGrid", synthNotes.length, 16, synthPattern);

document.getElementById("synthSelect").addEventListener("change", e => {
  synth = new Tone.Synth({ oscillator: { type: e.target.value } }).toDestination();
});

// === PLAYBACK ===
let currentStep = 0;
Tone.Transport.scheduleRepeat(time => {
  // 🔁 Drums
  drumPattern.forEach((row, i) => {
    if (row[currentStep]) {
      drumPlayers.player(Object.keys(drumPlayers._players)[i]).start(time);
    }
  });

  // 🔁 Synth
  synthPattern.forEach((row, i) => {
    if (row[currentStep]) {
      synth.triggerAttackRelease(synthNotes[i], "8n", time);
    }
  });

  currentStep = (currentStep + 1) % 16;
}, "16n");

document.getElementById("playStudioBtn").addEventListener("click", async () => {
  await Tone.start();
  Tone.Transport.stop();
  currentStep = 0;
  Tone.Transport.start();
});

document.getElementById("saveStudioBtn").addEventListener("click", () => {
  const patternData = {
    drums: drumPattern,
    synth: synthPattern,
    synthType: document.getElementById("synthSelect").value
  };

  const blob = new Blob([JSON.stringify(patternData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "trashwave-pattern.json";
  a.click();

  URL.revokeObjectURL(url);
});

let recorder;
let audioChunks = [];

const exportBtn = document.getElementById("exportAudioBtn");

exportBtn.addEventListener("click", async () => {
  await Tone.start();

  const dest = Tone.context.createMediaStreamDestination();
  synth.connect(dest);
  drumSampler.connect(dest); // если есть ударные

  recorder = new MediaRecorder(dest.stream);
  audioChunks = [];

  recorder.ondataavailable = e => audioChunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(audioChunks, { type: "audio/wav" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "trashwave-track.wav";
    a.click();
  };

  recorder.start();
  Tone.Transport.stop();
  Tone.Transport.start("+0.1");

  // 🎯 Записываем ровно 8 тактов (регулируется)
  setTimeout(() => {
    Tone.Transport.stop();
    recorder.stop();
  }, 8000); // 8 сек
});
