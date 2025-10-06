<html lang="el">
<head>
<meta charset="UTF-8"></meta>
<meta content="width=device-width, initial-scale=1.0" name="viewport"></meta>
<title>Συμπίεση Εικόνας (Offline)</title>
<script src="https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js"></script>
<style>
body{
  font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;
  color:#17202a;
  margin:0;
  padding:12px;
  width:100%;
  box-sizing:border-box;
}.imgc-toggle{background:#2d7ef7;color:#fff;border:0;border-radius:10px;padding:10px 14px;cursor:pointer;margin:6px 0}
.imgc-wrap{background:#fff;border:1px solid #ccc;border-radius:12px;padding:16px}
.imgc-controls{display:flex;flex-wrap:wrap;gap:12px;align-items:center;background:#f8f9fb;border:1px solid #e5e8ee;border-radius:10px;padding:10px;margin:10px 0 14px}
.imgc-controls label{display:flex;flex-direction:column;font-size:14px;gap:4px}
.imgc-inline{flex-direction:row;align-items:center;gap:8px;margin-top:18px}
.imgc-clear{margin-left:auto;background:#ffe9e9;border:1px solid #ffcccc;border-radius:8px;padding:8px 12px;cursor:pointer}
.imgc-drop{border:2px dashed #b3c1d1;border-radius:12px;text-align:center;padding:22px;background:#fbfdff;color:#2c3e50}
.imgc-drop.imgc-hover{background:#eef6ff;border-color:#8fb8ff}
.imgc-browse{background:#2d7ef7;border:0;color:#fff;border-radius:8px;padding:10px 14px;cursor:pointer}
.imgc-hint{font-size:12px;color:#5d6d7e;margin:8px 0 0}
.imgc-results{margin-top:20px}
.imgc-btn{background:#2d7ef7;color:#fff;border:none;border-radius:8px;padding:10px 14px;cursor:pointer;margin-top:10px}
.imgc-btn.download{background:#28a745}
</style>
</head>
<body>
<div class="imgc-wrap">
  <div class="imgc-controls">
    <label>Μορφή εξόδου
      <select id="imgc-format">
        <option selected="" value="auto">Auto (προτείνεται)</option>
        <option value="jpeg">JPEG (.jpg)</option>
        <option value="png">PNG (.png)</option>
        <option value="webp">WebP (.webp)</option>
      </select>
    </label>
    <label>Ποιότητα
      <input id="imgc-quality" max="100" min="10" type="range" value="80" />
      <span id="imgc-qval">80%</span>
    </label>
    <label>Μέγιστη διάσταση (px)
      <input id="imgc-maxside" type="number" value="0" />
      <small>(0 = χωρίς αλλαγή μεγέθους)</small>
    </label>
  </div>

  <div class="imgc-drop" id="imgc-drop">
    <input accept="image/*" hidden="" id="imgc-file" multiple="" type="file" />
    <p><strong>Σύρε και άφησε</strong> εικόνες εδώ ή</p>
    <button class="imgc-browse" id="imgc-browse">Επιλογή αρχείων</button>
    <p class="imgc-hint">Υποστήριξη: JPG, PNG, WebP</p>
  </div>

  <div class="imgc-results" id="imgc-results"></div>
</div>

<script>
document.addEventListener("DOMContentLoaded",()=>{
  const f=document.getElementById("imgc-file"),
        d=document.getElementById("imgc-drop"),
        b=document.getElementById("imgc-browse"),
        res=document.getElementById("imgc-results"),
        fmt=document.getElementById("imgc-format"),
        q=document.getElementById("imgc-quality"),
        qval=document.getElementById("imgc-qval"),
        max=document.getElementById("imgc-maxside");
  let files=[];
  q.oninput=()=>qval.textContent=q.value+"%";
  b.onclick=()=>f.click();
  f.onchange=e=>{files=[...e.target.files];showList();};
  ["dragenter","dragover"].forEach(ev=>d.addEventListener(ev,e=>{e.preventDefault();d.classList.add("imgc-hover");}));
  ["dragleave","drop"].forEach(ev=>d.addEventListener(ev,e=>{e.preventDefault();d.classList.remove("imgc-hover");}));
  d.ondrop=e=>{files=[...e.dataTransfer.files];showList();};

  function showList(){
    res.innerHTML="";
    if(!files.length) return;
    const ul=document.createElement("ul");
    files.forEach(f=>{const li=document.createElement("li");li.textContent=f.name+" ("+Math.round(f.size/1024)+" KB)";ul.appendChild(li);});
    res.appendChild(ul);
    const btn=document.createElement("button");
    btn.textContent="Συμπίεση εικόνων";
    btn.className="imgc-btn";
    btn.onclick=compressAll;
    res.appendChild(btn);
  }

  async function compressAll(){
    res.innerHTML="Συμπίεση...";
    const format=fmt.value;
    const quality=parseInt(q.value)/100;
    const maxSide=parseInt(max.value)||0;
    const resultsDiv=document.createElement("div");
    for(const file of files){
      const out=await compressOne(file,format,quality,maxSide);
      const blob=await fetch(out.url).then(r=>r.blob());
      const a=document.createElement("a");
      a.href=URL.createObjectURL(blob);
      a.download=out.name;
      a.textContent="Λήψη "+out.name;
      a.className="imgc-btn download";
      const p=document.createElement("p");
      p.appendChild(a);
      resultsDiv.appendChild(p);
    }
    res.innerHTML="";
    res.appendChild(resultsDiv);
  }

  async function compressOne(file,format,quality,maxSide){
    const img=new Image();
    img.src=URL.createObjectURL(file);
    await img.decode();
    let w=img.width,h=img.height;
    if(maxSide>0&&(w>maxSide||h>maxSide)){
      if(w>h){h*=maxSide/w;w=maxSide;}else{w*=maxSide/h;h=maxSide;}
    }
    const c=document.createElement("canvas");
    c.width=w;c.height=h;
    const ctx=c.getContext("2d");
    ctx.drawImage(img,0,0,w,h);
    let mime="image/jpeg";
    if(format==="png")mime="image/png";
    else if(format==="webp")mime="image/webp";
    const blob=await new Promise(r=>c.toBlob(r,mime,quality));
    const url=URL.createObjectURL(blob);
    const ext=mime.split("/")[1];
    const name=file.name.replace(/\.[^.]+$/,"")+"-compressed."+ext;
    return {url,name};
  }
});
</script>

</body>
</html>
