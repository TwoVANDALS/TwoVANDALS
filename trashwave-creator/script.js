// Загрузка сэмплов
const player = {
  kick: new Tone.Player("samples/kick.wav").toDestination(),
  snare: new Tone.Player("samples/snare.wav").toDestination()
};

const sequencer = document.getElementById("sequencer");
const steps = [];

for (let i = 0; i < 16; i++) {
  const step = document.createElement("div");
  step.className = "step";
  step.dataset.index = i;
  sequencer.appendChild(step);
  steps.push(step);
}

steps.forEach(step => {
  step.addEventListener("click", () => {
    step.classList.toggle("active");
  });
});

Tone.Transport.scheduleRepeat(time => {
  const stepIndex = (Math.floor(Tone.Transport.seconds * 2) % 16);
  if (steps[stepIndex].classList.contains("active")) {
    if (stepIndex % 4 === 0) {
      player.kick.start(time);
    } else {
      player.snare.start(time);
    }
  }
}, "8n");

document.getElementById("startBtn").addEventListener("click", async () => {
  await Tone.start();
  Tone.Transport.start();
});
