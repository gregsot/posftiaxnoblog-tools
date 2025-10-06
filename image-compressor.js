document.addEventListener("DOMContentLoaded",function(){
  const fileInput=document.getElementById("imgc-file");
  const drop=document.getElementById("imgc-drop");
  const browse=document.getElementById("imgc-browse");
  const results=document.getElementById("imgc-results");
  if(!fileInput||!drop) return;
  browse.onclick=()=>fileInput.click();
  drop.ondragover=(e)=>{e.preventDefault();drop.classList.add("imgc-hover");};
  drop.ondragleave=()=>drop.classList.remove("imgc-hover");
  drop.ondrop=(e)=>{e.preventDefault();drop.classList.remove("imgc-hover");handleFiles(e.dataTransfer.files);};
  fileInput.onchange=(e)=>handleFiles(e.target.files);

  async function handleFiles(files){
    results.innerHTML="";
    for(const file of files){
      if(!file.type.startsWith("image/")) continue;
      const img=new Image();
      img.src=URL.createObjectURL(file);
      await img.decode();
      const canvas=document.createElement("canvas");
      const ctx=canvas.getContext("2d");
      const maxSide=1920;
      let w=img.width,h=img.height;
      if(w>maxSide||h>maxSide){
        if(w>h){h*=maxSide/w;w=maxSide;}else{w*=maxSide/h;h=maxSide;}
      }
      canvas.width=w;canvas.height=h;
      ctx.drawImage(img,0,0,w,h);
      const blob=await new Promise(r=>canvas.toBlob(r,"image/jpeg",0.8));
      const a=document.createElement("a");
      a.href=URL.createObjectURL(blob);
      a.download=file.name.replace(/\.\w+$/,"")+"-compressed.jpg";
      a.textContent="Λήψη "+a.download;
      const p=document.createElement("p");
      p.appendChild(a);
      results.appendChild(p);
    }
  }
});
