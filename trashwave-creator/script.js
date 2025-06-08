// DRUMS
const drumSounds = ["kick", "snare", "hat"];
let drumPattern = Array(drumSounds.length).fill().map(() => Array(16).fill(false));
const drumPlayers = new Tone.Players({
  kick: "samples/kick.wav",
  snare: "samples/snare.wav",
  hat: "samples/hat.wav"
}).toDestination();

// SYNTH
const synthNotes = ["C5", "B4", "A4", "G4", "F4", "E4", "D4", "C4"];
let synthPattern = Array(synthNotes.length).fill().map(() => Array(16).fill(false));
let synth = new Tone.Synth().toDestination();

// BUILD GRIDS
function createGrid(containerId, pattern) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  const rows = pattern.length;
  const cols = pattern[0].length;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      if (pattern[y][x]) cell.classList.add("active");
      cell.addEventListener("click", () => {
        pattern[y][x] = !pattern[y][x];
        cell.classList.toggle("active");
      });
      container.appendChild(cell);
    }
  }
}

createGrid("drumGrid", drumPattern);
createGrid("synthGrid", synthPattern);

// SYNTH SELECT
document.getElementById("synthSelect").addEventListener("change", e => {
  synth = new Tone.Synth({ oscillator: { type: e.target.value } }).toDestination();
});

// PLAYBACK
let step = 0;
Tone.Transport.scheduleRepeat(time => {
  drumPattern.forEach((row, i) => {
    if (row[step]) drumPlayers.player(drumSounds[i]).start(time);
  });

  synthPattern.forEach((row, i) => {
    if (row[step]) synth.triggerAttackRelease(synthNotes[i], "8n", time);
  });

  step = (step + 1) % 16;
}, "16n");

document.getElementById("playStudioBtn").addEventListener("click", async () => {
  await Tone.start();
  Tone.Transport.stop();
  step = 0;
  Tone.Transport.start("+0.1");
});

// SAVE PATTERN
document.getElementById("saveStudioBtn").addEventListener("click", () => {
  const pattern = {
    drums: drumPattern,
    synth: synthPattern,
    synthType: document.getElementById("synthSelect").value
  };
  const blob = new Blob([JSON.stringify(pattern, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "trashwave-pattern.json";
  a.click();
  URL.revokeObjectURL(url);
});

// EXPORT TO WAV
let recorder, audioChunks = [];

document.getElementById("exportAudioBtn").addEventListener("click", async () => {
  await Tone.start();
  const dest = Tone.context.createMediaStreamDestination();
  synth.connect(dest);
  drumPlayers.connect(dest);

  recorder = new MediaRecorder(dest.stream);
  recorder.ondataavailable = e => audioChunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(audioChunks, { type: "audio/wav" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trashwave-export.wav";
    a.click();
    URL.revokeObjectURL(url);
  };

  audioChunks = [];
  recorder.start();
  Tone.Transport.stop();
  step = 0;
  Tone.Transport.start("+0.1");

  setTimeout(() => {
    Tone.Transport.stop();
    recorder.stop();
  }, 8000); // 8 секунд
});
