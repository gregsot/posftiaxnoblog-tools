document.addEventListener("DOMContentLoaded", function () {
  const els = {
    file: document.getElementById("imgc-file"),
    drop: document.getElementById("imgc-drop"),
    browse: document.getElementById("imgc-browse"),
    results: document.getElementById("imgc-results"),
    format: document.getElementById("imgc-format"),
    quality: document.getElementById("imgc-quality"),
    qval: document.getElementById("imgc-qval"),
    maxside: document.getElementById("imgc-maxside")
  };

  let selectedFiles = [];

  // ενημέρωση slider ποιότητας
  els.quality.addEventListener("input", () => {
    els.qval.textContent = els.quality.value + "%";
  });

  // επιλογή αρχείων
  els.browse.onclick = () => els.file.click();
  els.file.onchange = (e) => {
    selectedFiles = Array.from(e.target.files);
    showList();
  };

  // drag & drop
  ["dragenter", "dragover"].forEach(ev =>
    els.drop.addEventListener(ev, e => {
      e.preventDefault();
      e.stopPropagation();
      els.drop.classList.add("imgc-hover");
    })
  );
  ["dragleave", "drop"].forEach(ev =>
    els.drop.addEventListener(ev, e => {
      e.preventDefault();
      e.stopPropagation();
      els.drop.classList.remove("imgc-hover");
    })
  );
  els.drop.ondrop = e => {
    selectedFiles = Array.from(e.dataTransfer.files);
    showList();
  };

  function showList() {
    els.results.innerHTML = "";
    if (!selectedFiles.length) return;
    const list = document.createElement("ul");
    selectedFiles.forEach(f => {
      const li = document.createElement("li");
      li.textContent = f.name + " (" + Math.round(f.size / 1024) + " KB)";
      list.appendChild(li);
    });
    els.results.appendChild(list);
    const btn = document.createElement("button");
    btn.textContent = "Συμπίεση εικόνων";
    btn.className = "imgc-btn download";
    btn.onclick = () => compressAll();
    els.results.appendChild(btn);
  }

  async function compressAll() {
    const format = els.format.value;
    const quality = parseInt(els.quality.value) / 100;
    const maxSide = parseInt(els.maxside.value) || 0;

    els.results.innerHTML = "Συμπίεση...";
    const zip = new JSZip();

    for (const file of selectedFiles) {
      const out = await compressOne(file, format, quality, maxSide);
      const blob = await fetch(out.url).then(r => r.blob());
      zip.file(out.name, blob);
    }

    const zipBtn = document.createElement("button");
    zipBtn.textContent = "Κατέβασμα όλων σε ZIP";
    zipBtn.className = "imgc-btn download";
    zipBtn.onclick = async () => {
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "compressed_images.zip";
      a.click();
      URL.revokeObjectURL(url);
    };
    els.results.innerHTML = "✅ Ολοκληρώθηκε<br/>";
    els.results.appendChild(zipBtn);
  }

  async function compressOne(file, format, quality, maxSide) {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();

    let w = img.width, h = img.height;
    if (maxSide > 0 && (w > maxSide || h > maxSide)) {
      if (w > h) { h *= maxSide / w; w = maxSide; }
      else { w *= maxSide / h; h = maxSide; }
    }

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);

    let mime = "image/jpeg";
    if (format === "webp") mime = "image/webp";
    else if (format === "png") mime = "image/png";

    const blob = await new Promise(r => canvas.toBlob(r, mime, quality));
    const url = URL.createObjectURL(blob);
    const ext = mime.split("/")[1];
    const name = file.name.replace(/\.[^.]+$/, "") + "-compressed." + ext;
    return { url, name };
  }
});
