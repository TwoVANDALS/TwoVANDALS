import { createClient } from 'https://esm.sh/@supabase/supabase-js';

const supabase = createClient(
  'https://qqffjsnlsbzhzhlvbexb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZmZqc25sc2J6aHpobHZiZXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTM1MTksImV4cCI6MjA2NDg4OTUxOX0.LFrwLA5njJYak5RQ25Kd14TZE64HCV8WSsx31riL-0g'
);

const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");
const trackList = document.getElementById("trackList");
const template = document.getElementById("audio-template");

function formatTime(s) {
  const m = Math.floor(s / 60);
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${m}:${ss}`;
}

async function listTracks() {
  const { data: files, error } = await supabase.storage.from('tracks').list('', {
    limit: 100
  });
  if (error) {
    console.error("List Error:", error.message);
    return;
  }

  trackList.innerHTML = "";
  for (const file of files) {
    if (!file.name.match(/\.(mp3|wav)$/)) continue;
    const { data } = supabase.storage.from('tracks').getPublicUrl(file.name);
    const audioUrl = data.publicUrl;

    const clone = template.content.cloneNode(true);
    const audio = clone.querySelector("audio");
    const title = clone.querySelector(".track-title");
    const playBtn = clone.querySelector(".play-btn");
    const seek = clone.querySelector(".seek-bar");
    const volume = clone.querySelector(".volume-bar");
    const timeNow = clone.querySelector(".current-time");
    const timeDuration = clone.querySelector(".duration");

    title.textContent = file.name.replace(/\.[^/.]+$/, '');
    audio.src = audioUrl;

    playBtn.addEventListener("click", () => {
      document.querySelectorAll("audio").forEach(a => {
        if (a !== audio) a.pause();
      });
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    });

    audio.addEventListener("play", () => {
      playBtn.textContent = "⏸";
    });

    audio.addEventListener("pause", () => {
      playBtn.textContent = "▶";
    });

    audio.addEventListener("loadedmetadata", () => {
      seek.max = Math.floor(audio.duration);
      timeDuration.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
      seek.value = audio.currentTime;
      timeNow.textContent = formatTime(audio.currentTime);
    });

    seek.addEventListener("input", () => {
      audio.currentTime = seek.value;
    });

    volume.addEventListener("input", () => {
      audio.volume = volume.value;
    });

    trackList.appendChild(clone);
  }
}

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Choose a file");
  if (!file.name.match(/\.(mp3|wav)$/i)) return alert("Only mp3/wav allowed");

  const { error } = await supabase.storage.from('tracks').upload(file.name, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) {
    uploadStatus.innerText = `❌ Upload failed: ${error.message}`;
  } else {
    uploadStatus.innerText = `✅ Uploaded: ${file.name}`;
    await listTracks();
  }
});

window.addEventListener('load', () => {
  document.getElementById('loader').style.display = 'none';
  listTracks();
});
