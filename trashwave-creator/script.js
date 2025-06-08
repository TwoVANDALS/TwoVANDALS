let bpmInput = document.getElementById('bpm');
let playBtn = document.getElementById('playBtn');
let stopBtn = document.getElementById('stopBtn');
let saveBtn = document.getElementById('saveBtn');
let exportBtn = document.getElementById('exportBtn');
let waveformSelect = document.getElementById('waveform');

Tone.Transport.bpm.value = 120;
Tone.Transport.loop = true;
Tone.Transport.loopEnd = "1m";

const drumSamples = {
  kick: new Tone.Player("samples/kick.wav").toDestination(),
  snare: new Tone.Player("samples/snare.wav").toDestination(),
  hat: new Tone.Player("samples/hat.wav").toDestination()
};

const synth = new Tone.Synth().toDestination();

const drumGrid = document.getElementById("drum-grid");
const synthGrid = document.getElementById("synth-grid");

let drumSteps = { kick: [], snare: [], hat: [] };
let synthSteps = [];

function createGrid(container, rows = 3, cols = 16, target) {
  container.innerHTML = "";
  for (let row = 0; row < rows; row++) {
    for (let i = 0; i < cols; i++) {
      let step = document.createElement("div");
      step.className = "step";
      step.dataset.row = row;
      step.dataset.col = i;
      step.addEventListener("click", () => {
        step.classList.toggle("active");
        target[row][i] = !target[row][i];
      });
      container.appendChild(step);
    }
  }
}

function initGrids() {
  const steps = 16;
  for (let k of ['kick', 'snare', 'hat']) {
    drumSteps[k] = Array(steps).fill(false);
  }
  synthSteps = Array(3).fill().map(() => Array(steps).fill(false));
  createGrid(drumGrid, 3, steps, [drumSteps.kick, drumSteps.snare, drumSteps.hat]);
  createGrid(synthGrid, 3, steps, synthSteps);
}

let index = 0;
Tone.Transport.scheduleRepeat((time) => {
  ['kick', 'snare', 'hat'].forEach((type, i) => {
    if (drumSteps[type][index]) drumSamples[type].start(time);
  });
  synthSteps.forEach((row, i) => {
    if (row[index]) {
      synth.oscillator.type = waveformSelect.value;
      synth.triggerAttackRelease(["C4", "E4", "G4"][i], "8n", time);
    }
  });
  index = (index + 1) % 16;
}, "16n");

playBtn.onclick = async () => {
  await Tone.start();
  Tone.Transport.bpm.value = parseInt(bpmInput.value);
  Tone.Transport.start();
};

stopBtn.onclick = () => {
  Tone.Transport.stop();
  index = 0;
};

saveBtn.onclick = () => {
  const blob = new Blob([JSON.stringify({ drumSteps, synthSteps })], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pattern.json";
  a.click();
};

exportBtn.onclick = async () => {
  const recorder = new Tone.Recorder();
  synth.connect(recorder);
  drumSamples.kick.connect(recorder);
  drumSamples.snare.connect(recorder);
  drumSamples.hat.connect(recorder);

  Tone.Transport.start();
  recorder.start();
  await Tone.start();

  setTimeout(async () => {
    Tone.Transport.stop();
    const recording = await recorder.stop();
    const url = URL.createObjectURL(recording);
    const a = document.createElement("a");
    a.href = url;
    a.download = "trashwave.wav";
    a.click();
  }, 4000);
};

initGrids();
