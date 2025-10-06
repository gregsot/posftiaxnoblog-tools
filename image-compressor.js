document.addEventListener("DOMContentLoaded",function(){
  const els = {
    file: document.getElementById("imgc-file"),
    drop: document.getElementById("imgc-drop"),
    browse: document.getElementById("imgc-browse"),
    results: document.getElementById("imgc-results"),
    format: document.getElementById("imgc-format"),
    quality: document.getElementById("imgc-quality"),
    qval: document.getElementById("imgc-qval"),
    zipBtn: null
  };

  if(!els.file || !els.drop) return;

  // Ενημέρωση ποιότητας live
  els.quality.addEventListener("input",()=>els.qval.textContent=els.quality.value+"%");

  // Επιλογή αρχείων
  els.browse.onclick=()=>els.file.click();
  els.file.onchange=(e)=>handleFiles(e.target.files);

  // Drag & Drop
  ["dragenter","dragover"].forEach(ev=>els.drop.addEventListener(ev,e=>{
    e.preventDefault();e.stopPropagation();els.drop.classList.add("imgc-hover");
  }));
  ["dragleave","drop"].forEach(ev=>els.drop.addEventListener(ev,e=>{
    e.preventDefault();e.stopPropagation();els.drop.classList.remove("imgc-hover");
  }));
  els.drop.ondrop=(e)=>handleFiles(e.dataTransfer.files);

  async function handleFiles(files){
    els.results.innerHTML="";
    const fileArr = Array.from(files).filter(f=>f.type.startsWith("image/"));
    if(!fileArr.length) return;
    const zip = new JSZip();
    for(const file of fileArr){
      const out = await compressImage(file);
      const a=document.createElement("a");
      a.href=out.url;
      a.download=out.name;
      a.textContent="Λήψη "+out.name+" ("+out.saved+"%)";
      const p=document.createElement("p");
      p.appendChild(a);
      els.results.appendChild(p);
      const blobData = await fetch(out.url).then(r=>r.blob());
      zip.file(out.name, blobData);
    }

    // Προσθήκη κουμπιού ZIP
    els.zipBtn=document.createElement("button");
    els.zipBtn.textContent="Κατέβασμα όλων σε ZIP";
    els.zipBtn.className="imgc-btn download";
    els.zipBtn.onclick=async()=>{
      const content = await zip.generateAsync({type:"blob"});
      const zipUrl = URL.createObjectURL(content);
      const link=document.createElement("a");
      link.href=zipUrl;
      link.download="compressed_images.zip";
      link.click();
      URL.revokeObjectURL(zipUrl);
    };
    els.results.appendChild(els.zipBtn);
  }

  async function compressImage(file){
    const format = els.format.value;
    const quality = parseInt(els.quality.value)/100;
    const maxSide = 1920;
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    let w=img.width,h=img.height;
    if(w>maxSide||h>maxSide){
      if(w>h){h*=maxSide/w;w=maxSide;}else{w*=maxSide/h;h=maxSide;}
    }
    const canvas=document.createElement("canvas");
    canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d");
    ctx.drawImage(img,0,0,w,h);

    let mime="image/jpeg";
    if(format==="webp") mime="image/webp";
    else if(format==="png") mime="image/png";

    const blob = await new Promise(r=>canvas.toBlob(r,mime,quality));
    const url = URL.createObjectURL(blob);
    const saved = file.size ? Math.round((1-blob.size/file.size)*100) : 0;
    const ext = mime.split("/")[1];
    const name = file.name.replace(/\.[^.]+$/,"")+"-compressed."+ext;
    return {url,name,saved};
  }
});
