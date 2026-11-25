const fs=require("fs"), vm=require("vm");
const dir=require("path").join(__dirname, "../../_reference/raw/");
const groups={}; // id -> {ids, src}
for (const f of fs.readdirSync(dir)) {
  const code=fs.readFileSync(dir+f,"utf8");
  if(!code.includes("TURBOPACK")) continue;
  const ctx={globalThis:{}, document:undefined}; ctx.globalThis=ctx;
  try{ vm.runInNewContext(code, ctx);}catch(e){continue}
  for(const arr of (ctx.TURBOPACK||[])){
    if(!Array.isArray(arr)) continue;
    let ids=[];
    for(let i=1;i<arr.length;i++){ const v=arr[i]; if(typeof v==="number") ids.push(v); else if(typeof v==="function"){ const g={ids, src:v.toString(), file:f}; for(const id of ids) groups[id]??=g; ids=[]; } }
  }
}
module.exports=groups;
