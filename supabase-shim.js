/* 빵지 가계부 · Supabase 연결부
   가계부 화면 코드는 그대로 두고, 저장소만 Claude 아티팩트 대신 Supabase를 쓰게 바꿔 주는 파일이에요.
   - 로그인: 이메일 + 비밀번호 (Supabase 대시보드에서 만든 내 계정)
   - 저장: public.docs 테이블 (path = 'tx/2026-11', 'meta/wallets' 처럼 문서 하나가 한 줄)
   - 실시간: 폰과 PC에서 같이 열어 두면 한쪽에서 고친 게 바로 반영돼요 */
(function(){
  const CFG = window.BBANGJI_CONFIG || {};
  const configured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(CFG.SUPABASE_URL||'') && (CFG.SUPABASE_ANON_KEY||'').length > 30;
  const sb = !configured ? null : window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: 'bbangji-auth' }
  });
  window.__sb = sb;

  /* ---------- 로그인 화면 ---------- */
  const css = `
  #bj-gate{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:#fbfaf8;font-family:"Pretendard Variable",-apple-system,sans-serif;padding:16px}
  #bj-gate .card{width:100%;max-width:360px;background:#fff;border:1px solid #e9e7e3;border-radius:14px;padding:26px 22px;box-shadow:0 8px 30px rgba(0,0,0,.06)}
  #bj-gate img{width:64px;height:64px;border-radius:16px;display:block;margin:0 auto 10px}
  #bj-gate h1{font-size:20px;text-align:center;margin:0 0 4px}
  #bj-gate p{font-size:13px;color:#787774;text-align:center;margin:0 0 18px;line-height:1.5}
  #bj-gate label{display:block;font-size:12.5px;color:#55534e;margin:10px 0 4px}
  #bj-gate input{width:100%;box-sizing:border-box;font:inherit;font-size:16px;padding:10px 12px;border:1px solid #dcd9d4;border-radius:8px;background:#fff;color:#37352f}
  #bj-gate button{width:100%;margin-top:16px;font:inherit;font-size:15px;font-weight:600;padding:11px;border:0;border-radius:8px;background:#2383e2;color:#fff;cursor:pointer}
  #bj-gate button.sub{background:#f1f0ee;color:#37352f;font-weight:500;margin-top:8px}
  #bj-gate .msg{min-height:18px;font-size:12.5px;color:#d44c47;text-align:center;margin-top:10px}
  #bj-gate .ok{color:#448361}
  @media (prefers-color-scheme:dark){#bj-gate{background:#191919}#bj-gate .card{background:#202020;border-color:#2f2f2f}#bj-gate h1{color:#e6e6e4}#bj-gate input{background:#252525;color:#e6e6e4;border-color:#3a3a3a}#bj-gate button.sub{background:#2f2f2f;color:#e6e6e4}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function gate(html){
    let g = document.getElementById('bj-gate');
    if(!g){ g = document.createElement('div'); g.id = 'bj-gate'; document.body.appendChild(g); }
    g.innerHTML = `<div class="card"><img src="icons/icon-192.png" alt="">${html}</div>`;
    return g;
  }
  function closeGate(){ document.getElementById('bj-gate')?.remove(); }

  function askLogin(){
    return new Promise(resolve=>{
      const g = gate(`<h1>빵지 가계부</h1><p>내 계정으로 로그인해 주세요.</p>
        <form id="bj-form"><label for="bj-email">이메일</label><input id="bj-email" type="email" autocomplete="username" required>
        <label for="bj-pw">비밀번호</label><input id="bj-pw" type="password" autocomplete="current-password" required>
        <button type="submit">로그인</button><div class="msg" id="bj-msg" aria-live="polite"></div></form>`);
      g.querySelector('#bj-form').addEventListener('submit', async e=>{
        e.preventDefault(); const msg = g.querySelector('#bj-msg'); msg.textContent = '로그인 중…'; msg.className='msg';
        const { data, error } = await sb.auth.signInWithPassword({ email: g.querySelector('#bj-email').value.trim(), password: g.querySelector('#bj-pw').value });
        if(error){ msg.textContent = '로그인하지 못했어요: ' + (error.message||''); return; }
        resolve(data.user);
      });
    });
  }

  /* ---------- 처음 한 번: 아티팩트에서 옮겨 온 데이터 가져오기 ---------- */
  function askImport(uid){
    return new Promise(resolve=>{
      const g = gate(`<h1>데이터 가져오기</h1><p>아직 저장된 기록이 없어요.<br>받아 둔 <b>bbangji-data.json</b> 파일을 골라 주세요.</p>
        <label for="bj-file">백업 파일</label><input id="bj-file" type="file" accept=".json,application/json">
        <button id="bj-go">가져오기</button><button class="sub" id="bj-skip">빈 가계부로 시작</button><div class="msg" id="bj-msg" aria-live="polite"></div>`);
      const msg = g.querySelector('#bj-msg');
      g.querySelector('#bj-skip').onclick = ()=>resolve(false);
      g.querySelector('#bj-go').onclick = async ()=>{
        const f = g.querySelector('#bj-file').files[0]; if(!f){ msg.textContent='파일을 골라 주세요.'; return; }
        try{
          const j = JSON.parse(await f.text()); const docs = j.docs || j;
          const rows = Object.entries(docs).filter(([p])=>/^(tx|meta)\/[\w\-.]+$/.test(p)).map(([path,data])=>({ user_id: uid, path, data, updated_at: new Date().toISOString() }));
          if(!rows.length){ msg.textContent='가계부 데이터가 아니에요.'; return; }
          msg.className='msg ok'; msg.textContent = `${rows.length}개 문서를 올리는 중…`;
          for(let i=0;i<rows.length;i+=10){ const { error } = await sb.from('docs').upsert(rows.slice(i,i+10)); if(error) throw error; }
          msg.textContent = '다 옮겼어요!'; resolve(true);
        }catch(e){ msg.className='msg'; msg.textContent = '가져오지 못했어요: ' + (e.message||e); }
      };
    });
  }

  /* ---------- 로그인 → (필요하면 가져오기) → db 준비 ---------- */
  const ready = (async ()=>{
    if(!configured){ gate(`<h1>설정이 필요해요</h1><p>config.js에 Supabase 주소와 anon key를 넣어 주세요.</p>`); return new Promise(()=>{}); }
    let { data: { session } } = await sb.auth.getSession();
    let user = session?.user || await askLogin();
    const { count } = await sb.from('docs').select('path', { count: 'exact', head: true });
    if(!count) await askImport(user.id);
    closeGate();
    return user;
  })();

  /* ---------- 아티팩트 db와 같은 모양의 작은 어댑터 ---------- */
  function makeDb(user){
    const listeners = []; // {prefix, cb, err}
    async function load(prefix){
      const { data, error } = await sb.from('docs').select('path,data').like('path', prefix + '/%');
      if(error) throw error;
      return { docs: data.map(r=>({ id: r.path.slice(prefix.length+1), data: ()=>r.data })) };
    }
    const timers = {};
    function refresh(prefix){
      clearTimeout(timers[prefix]);
      timers[prefix] = setTimeout(async ()=>{
        try{ const snap = await load(prefix); listeners.filter(l=>l.prefix===prefix).forEach(l=>l.cb(snap)); }
        catch(e){ listeners.filter(l=>l.prefix===prefix).forEach(l=>l.err && l.err({ code: e.code||'error' })); }
      }, 120);
    }
    sb.channel('docs-' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'docs', filter: 'user_id=eq.' + user.id }, payload=>{
        const p = (payload.new && payload.new.path) || (payload.old && payload.old.path) || '';
        const prefix = p.split('/')[0]; if(prefix) refresh(prefix);
      }).subscribe();
    document.addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='visible'){ refresh('tx'); refresh('meta'); } });
    const col = name => ({
      limit: ()=>col(name),
      onSnapshot(cb, err){ const l = { prefix: name, cb, err }; listeners.push(l); refresh(name); return ()=>{ const i=listeners.indexOf(l); if(i>=0) listeners.splice(i,1); }; }
    });
    return {
      collection: col,
      doc: path => ({
        async set(data){
          const { error } = await sb.from('docs').upsert({ user_id: user.id, path, data, updated_at: new Date().toISOString() });
          if(error){ const e = new Error(error.message); e.code = error.code||'error'; throw e; }
        }
      })
    };
  }

  window.claude = {
    use: async name => {
      if(name === 'db'){ const u = await ready; return makeDb(u); }
      if(name === 'user'){ await ready; return { can: async ()=>true, isOwner: ()=>true, canEdit: ()=>true }; }
      if(name === 'downloads') return {
        save: async ({ filename, data })=>{ const b = data instanceof Blob ? data : new Blob([data]); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = filename; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000); }
      };
      return null;
    }
  };
  window.bbangjiLogout = async ()=>{ if(!confirm('로그아웃할까요?')) return; await sb.auth.signOut(); location.reload(); };
  /* 처음 가져오기 화면에 그대로 다시 넣을 수 있는 형식으로 전체 백업 */
  window.bbangjiExportDocs = async ()=>{
    const { data, error } = await sb.from('docs').select('path,data');
    if(error){ alert('백업하지 못했어요: ' + error.message); return; }
    const docs = {}; data.forEach(r=>docs[r.path]=r.data);
    const d = new Date(), stamp = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
    const b = new Blob([JSON.stringify({ app:'bbangji-gagyebu', exported: stamp, docs })], { type:'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'bbangji-data-' + stamp + '.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  };
})();
