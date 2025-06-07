window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  loader.style.display = "none";
});

document.addEventListener("DOMContentLoaded", () => {
  const bgTrack = document.getElementById("bgTrack");
  const playBtn = document.getElementById("playPauseBtn");
  const volumeSlider = document.getElementById("volumeSlider");

  bgTrack.volume = 0.5;

  playBtn.addEventListener("click", () => {
    if (bgTrack.paused) {
      bgTrack.play();
      playBtn.textContent = "⏸ Pause Trashwave Set";
    } else {
      bgTrack.pause();
      playBtn.textContent = "▶ Listen to a curated Trashwave set";
    }
  });

  volumeSlider.addEventListener("input", (e) => {
    bgTrack.volume = parseFloat(e.target.value);
  });
});
