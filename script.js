import { createClient } from 'https://esm.sh/@supabase/supabase-js'

const supabase = createClient(
  'https://qqffjsnlsbzhzhlvbexb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZmZqc25sc2J6aHpobHZiZXhiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzMTM1MTksImV4cCI6MjA2NDg4OTUxOX0.LFrwLA5njJYak5RQ25Kd14TZE64HCV8WSsx31riL-0g'
);

const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const uploadStatus = document.getElementById("uploadStatus");
const trackList = document.getElementById("trackList");
const template = document.getElementById("track-template");

async function listTracks() {
  const { data: files } = await supabase.storage.from('tracks').list('', { limit: 100 });

  trackList.innerHTML = '';
  files.forEach(file => {
    const { data } = supabase.storage.from('tracks').getPublicUrl(file.name);
    const url = data.publicUrl;

    const clone = template.content.cloneNode(true);
    clone.querySelector('.track-title').textContent = file.name.replace(/\.[^/.]+$/, "");
    clone.querySelector('audio').src = url;
    clone.querySelector('.track-date').textContent = new Date(file.created_at).toLocaleString();

    trackList.appendChild(clone);
  });
}

uploadBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) return alert("Choose a file!");
  if (!file.name.match(/\.(mp3|wav)$/)) return alert("Invalid format.");

  const { error } = await supabase.storage.from('tracks').upload(file.name, file, {
    cacheControl: '3600',
    upsert: false
  });

  if (error) {
    uploadStatus.textContent = "Upload Error: " + error.message;
  } else {
    uploadStatus.textContent = "✅ Uploaded: " + file.name;
    listTracks();
  }
});

listTracks();
