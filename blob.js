// 🧬 SVG Blob Morph Engine
document.addEventListener("DOMContentLoaded", () => {
  const blob = document.getElementById("blob");

  const morphs = [
    "M60,30 Q80,40 60,70 Q30,90 20,60 Q10,40 30,30 Q40,10 60,30 Z",
    "M50,20 Q90,40 70,80 Q50,90 20,70 Q10,40 30,20 Q40,10 50,20 Z",
    "M60,40 Q80,60 70,90 Q30,100 10,60 Q10,40 30,20 Q50,0 60,40 Z"
  ];

  let index = 0;

  function morphBlob() {
    index = (index + 1) % morphs.length;
    blob.setAttribute("d", morphs[index]);
    setTimeout(morphBlob, 3000);
  }

  morphBlob();
});
