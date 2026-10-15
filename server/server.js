// Server SU Portal: static files + REST key-value (SQLite) + proxy AI (opsional).
const express=require('express'),path=require('path'),fs=require('fs'),Database=require('better-sqlite3');
const PORT=process.env.PORT||3000,DB_FILE=process.env.DB_FILE||path.join(__dirname,'..','data','su-portal.db');
fs.mkdirSync(path.dirname(DB_FILE),{recursive:true});
const db=new Database(DB_FILE);db.pragma('journal_mode = WAL');db.exec(fs.readFileSync(path.join(__dirname,'schema.sql'),'utf8'));
const OK=new Set(['docs','imgs','orgs','cfg']),PRIVATE=new Set(['orgs','cfg']); // koleksi sensitif tidak boleh di-list
const q={get:db.prepare('SELECT data FROM kv WHERE coll=? AND id=?'),list:db.prepare('SELECT data FROM kv WHERE coll=?'),
 put:db.prepare('INSERT INTO kv(coll,id,data,updated) VALUES(?,?,?,?) ON CONFLICT(coll,id) DO UPDATE SET data=excluded.data,updated=excluded.updated'),del:db.prepare('DELETE FROM kv WHERE coll=? AND id=?')};
const app=express();app.use(express.json({limit:'1mb'}));
const AI_KEY=process.env.ANTHROPIC_API_KEY,AI_MODEL=process.env.ANTHROPIC_MODEL||'claude-sonnet-4-6';
app.get('/api/health',(_,r)=>r.json({ok:true,ai:!!AI_KEY}));
app.use('/api/kv/:c',(req,res,next)=>OK.has(req.params.c)?next():res.status(404).end());
app.get('/api/kv/:c',(req,res)=>PRIVATE.has(req.params.c)?res.status(403).end():res.json(q.list.all(req.params.c).map(r=>JSON.parse(r.data))));
app.get('/api/kv/:c/:id',(req,res)=>{const r=q.get.get(req.params.c,req.params.id);r?res.type('json').send(r.data):res.status(404).end()});
app.put('/api/kv/:c/:id',(req,res)=>{q.put.run(req.params.c,req.params.id,JSON.stringify(req.body),Date.now());res.json({ok:true})});
app.delete('/api/kv/:c/:id',(req,res)=>{q.del.run(req.params.c,req.params.id);res.json({ok:true})});
app.post('/api/ai',async(req,res)=>{if(!AI_KEY)return res.status(501).end();
 try{const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'content-type':'application/json','x-api-key':AI_KEY,'anthropic-version':'2023-06-01'},body:JSON.stringify({model:AI_MODEL,max_tokens:4000,messages:[{role:'user',content:String(req.body.prompt||'').slice(0,12000)}]})});
 const j=await r.json();if(!r.ok)return res.status(502).json(j);res.json({text:j.content.filter(b=>b.type==='text').map(b=>b.text).join('')})}catch(e){res.status(500).json({error:String(e)})}});
app.use(express.static(path.join(__dirname,'..','public')));
app.listen(PORT,()=>console.log('SU Portal berjalan di http://localhost:'+PORT+(AI_KEY?' (AI aktif)':' (AI nonaktif: set ANTHROPIC_API_KEY)')));
