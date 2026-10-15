/* Lapisan database & AI.
   - Jika server (server/server.js) berjalan -> data disimpan di SQLite (dibagi antar SC/SS & Admin SU) dan AI aktif.
   - Jika hosting statis tanpa server -> app.js otomatis memakai localStorage perangkat (DB=null), AI memakai draf bawaan. */
async function initBackends(){
  let DB=null,AI=null;
  try{
    const h=await fetch('api/health',{cache:'no-store'});
    if(h.ok&&(h.headers.get('content-type')||'').includes('json')){
      const info=await h.json(),api=(p,o)=>fetch('api/'+p,o);
      DB={
        doc:path=>{const[c,i]=path.split('/');return{
          async get(){const r=await api(`kv/${c}/${encodeURIComponent(i)}`);if(r.status===404)return{exists:false,data:()=>undefined};if(!r.ok)throw new Error('db');const d=await r.json();return{exists:true,data:()=>d}},
          async set(v){const r=await api(`kv/${c}/${encodeURIComponent(i)}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(v)});if(!r.ok)throw new Error('db')},
          async delete(){await api(`kv/${c}/${encodeURIComponent(i)}`,{method:'DELETE'})}}},
        collection:c=>({async get(){const r=await api('kv/'+c);if(!r.ok)throw new Error('db');return{docs:(await r.json()).map(d=>({data:()=>d}))}}})
      };
      if(info.ai)AI={async json(prompt){const r=await api('ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt})});if(!r.ok)throw new Error('ai');const{text}=await r.json();return JSON.parse(text.replace(/```json|```/g,'').trim())}};
    }
  }catch(e){}
  return{DB,AI,DL:null};
}
