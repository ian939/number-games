/* =====================================================================
   hub.js — 숫자놀이터 공용 모듈
   모든 게임과 허브(index.html)가 함께 불러와 쓰는 단일 진실 공급원.

   역할:
   - 포켓몬 데이터/유틸 (POKEMON_KR, TYPE_KR, RARITY, SPRITE, pickPokemon, fetchDetail)
   - 공유 점수: 게임별 누적 점수 + 부화에 쓴 점수 + 도감(caught)
     → localStorage 키 'numbersHub_v2' (같은 origin의 모든 페이지가 공유)
   - 점수 → 부화: 점수 10점으로 포켓몬 1마리 부화 (Hub.HATCH_COST)
   - 도감/부화 팝업: 어느 페이지에서든 Hub.openDex() 로 모달이 뜬다(페이지 이동 없음).

   새 게임 추가 시: <script src="hub.js"></script> 를 넣고,
   정답을 맞출 때마다 Hub.addScore('게임id', 점수) 를 호출하면 끝.
   도감 버튼은 onclick="Hub.openDex()" 로 연결한다.
   ===================================================================== */
(function (global) {
  "use strict";

  /* ── 포켓몬 데이터 ── */
  const POKEMON_KR={1:'이상해씨',2:'이상해풀',3:'이상해꽃',4:'파이리',5:'리자드',6:'리자몽',7:'꼬부기',8:'어니부기',9:'거북왕',10:'캐터피',11:'단데기',12:'버터플',13:'뿔충이',14:'딱충이',15:'독침붕',16:'구구',17:'피죤',18:'피죤투',19:'꼬라타',20:'래트케이트',21:'깨비참',22:'깨비드릴조',23:'아보',24:'아보크',25:'피카츄',26:'라이츄',27:'모래두지',28:'고지',29:'니드런♀',30:'니드리나',31:'니드퀸',32:'니드런♂',33:'니드리노',34:'니드킹',35:'삐삐',36:'픽시',37:'식스테일',38:'나인테일',39:'푸린',40:'푸크린',41:'주뱃',42:'골박쥐',43:'뚜벅초',44:'냄새꼴',45:'라플레시아',46:'파라스',47:'파라섹트',48:'콘팡',49:'도나리',50:'디그다',51:'닥트리오',52:'나옹',53:'페르시온',54:'고라파덕',55:'골덕',56:'망키',57:'성원숭',58:'가디',59:'아캔',60:'발챙이',61:'슈륙챙이',62:'강챙이',63:'케이시',64:'윤겔라',65:'후딘',66:'알통몬',67:'근육몬',68:'괴력몬',69:'모다피',70:'우츠동',71:'우츠보트',72:'왕눈해',73:'독파리',74:'꼬마돌',75:'중딩돌',76:'딱구리',77:'포니타',78:'날쌩마',79:'야돈',80:'야도란',81:'코일',82:'레어코일',83:'파오리',84:'두두',85:'두두트리오',86:'쥬쥬',87:'쥬레곤',88:'질퍽이',89:'질뻐기',90:'셀러',91:'파르셀',92:'겟핸보',93:'헨가',94:'팬텀',95:'롤러',96:'슬리프',97:'슬리퍼',98:'크랩',99:'킹크랩',100:'찌리리공',101:'붐볼',102:'아라리',103:'나시',104:'탕구리',105:'텅구리',106:'시라소몬',107:'홍수몬',108:'내루미',109:'또가스',110:'또도가스',111:'뿔카노',112:'코뿌리',113:'럭키',114:'덩쿠리',115:'캥카',116:'쏙독어',117:'씨드라',118:'콘치',119:'왕콘치',120:'별가사리',121:'아쿠스타',122:'마임맨',123:'스라크',124:'루주라',125:'에레브',126:'마그마',127:'쁘사이저',128:'켄타로스',129:'잉어킹',130:'갸라도스',131:'라프라스',132:'메타몽',133:'이브이',134:'샤워스',135:'쥬피썬더',136:'부스터',137:'폴리곤',138:'암나이트',139:'암스타',140:'투구',141:'투구푸스',142:'프테라',143:'잠만보',144:'프리져',145:'썬더',146:'파이어',147:'미뇽',148:'신뇽',149:'망나뇽',150:'뮤츠',151:'뮤'};

  const TYPE_KR={
    normal:{label:'노말',color:'#9FA19F'}, fire:{label:'불꽃',color:'#E62829'},
    water:{label:'물',color:'#2980EF'}, electric:{label:'전기',color:'#FAC000'},
    grass:{label:'풀',color:'#3FA129'}, ice:{label:'얼음',color:'#3DCEF3'},
    fighting:{label:'격투',color:'#FF8000'}, poison:{label:'독',color:'#9141CB'},
    ground:{label:'땅',color:'#915121'}, flying:{label:'비행',color:'#81B9EF'},
    psychic:{label:'에스퍼',color:'#EF4179'}, bug:{label:'벌레',color:'#91A119'},
    rock:{label:'바위',color:'#AFA981'}, ghost:{label:'고스트',color:'#704170'},
    dragon:{label:'드래곤',color:'#5060E1'}, dark:{label:'악',color:'#624D4E'},
    steel:{label:'강철',color:'#60A1B8'}, fairy:{label:'페어리',color:'#EF70EF'}
  };

  const RARITY=id=>{
    if([150,151,144,145,146].includes(id))return{label:'전설',cls:'legend'};
    if([130,131,142,143,147,148,149].includes(id))return{label:'희귀',cls:'epic'};
    if(id%7===0||id%11===0)return{label:'레어',cls:'rare'};
    return{label:'일반',cls:'common'};
  };
  const SPRITE=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  const rnd=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
  function pickPokemon(){
    const roll=Math.random();
    if(roll<0.01)return[144,145,146,150,151][rnd(0,4)];
    if(roll<0.05)return[130,131,142,143,147,148,149][rnd(0,6)];
    if(roll<0.18){
      const pool=Object.keys(POKEMON_KR).map(Number).filter(id=>id%7===0||id%11===0);
      return pool[rnd(0,pool.length-1)];
    }
    return rnd(1,130);
  }

  /* ── 타입·설명 캐시 (PokeAPI) ── */
  const DETAIL_KEY='numbersHub_detail';
  let detailCache={};
  try{
    detailCache=JSON.parse(localStorage.getItem(DETAIL_KEY)||'null')
      || JSON.parse(localStorage.getItem('pmg2_detail')||'{}');
  }catch(e){detailCache={};}
  function saveDetailCache(){try{localStorage.setItem(DETAIL_KEY,JSON.stringify(detailCache));}catch(e){}}

  async function fetchDetail(id){
    if(detailCache[id])return detailCache[id];
    const [p,s]=await Promise.all([
      fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r=>r.json()),
      fetch(`https://pokeapi.co/api/v2/pokemon-species/${id}`).then(r=>r.json())
    ]);
    const types=p.types.sort((a,b)=>a.slot-b.slot).map(t=>t.type.name);
    const pick=lang=>{const e=(s.flavor_text_entries||[]).find(x=>x.language.name===lang);return e?e.flavor_text:'';};
    let flavor=(pick('ko')||pick('en')||'').replace(/[\f\n\r­]/g,' ').replace(/\s+/g,' ').trim();
    const g=(s.genera||[]).find(x=>x.language.name==='ko')||(s.genera||[]).find(x=>x.language.name==='en');
    const genus=g?g.genus:'';
    const data={types,flavor,genus};
    detailCache[id]=data;saveDetailCache();
    return data;
  }

  /* ── 공유 점수: 게임별 누적 점수 · 부화에 쓴 점수 · 도감 ── */
  const STATE_KEY='numbersHub_v2';
  const HATCH_COST=10; // 부화 1마리 = 10점
  let state={scores:{}, spent:0, caught:{}, _v:2};

  function load(){
    let raw=null;
    try{raw=JSON.parse(localStorage.getItem(STATE_KEY)||'null');}catch(e){raw=null;}
    if(raw){
      state.scores=raw.scores||{};
      state.spent=raw.spent||0;
      state.caught=raw.caught||{};
      state._v=2;
      return;
    }
    // 최초 1회: 옛 알 모델(numbersHub_v1) 또는 포켓몬 게임(pmg2)에서 이전
    let eggs=0, leftover=0, caught={};
    try{
      const v1=JSON.parse(localStorage.getItem('numbersHub_v1')||'null');
      if(v1){ eggs=v1.eggs||0; caught=v1.caught||{}; const b=v1.buckets||{}; leftover=Object.keys(b).reduce((a,k)=>a+(b[k]||0),0); }
    }catch(e){}
    if(!Object.keys(caught).length){
      try{ const old=JSON.parse(localStorage.getItem('pmg2')||'null'); if(old){ eggs=Math.max(eggs, old.eggs||0); caught=old.caught||{}; } }catch(e){}
    }
    const carry=eggs*HATCH_COST+leftover; // 보유 알을 점수로 환산해 이전
    state.scores=carry>0?{legacy:carry}:{};
    state.spent=0;
    state.caught=caught||{};
    save();
  }
  function save(){
    try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch(e){}
    try{document.dispatchEvent(new Event('hubchange'));}catch(e){}
  }

  function totalScore(){ return Object.keys(state.scores).reduce((a,k)=>a+(state.scores[k]||0),0); }
  function available(){ return Math.max(0, totalScore()-state.spent); }
  function gameScore(id){ return state.scores[id]||0; }
  function caughtCount(){ return Object.keys(state.caught).length; }

  /* 게임에서 점수 적립/차감(n 음수 가능). {total(이 게임 누적), available, newEggs} 반환.
     게임별 점수는 0 미만으로 내려가지 않는다. */
  function addScore(gameId, n){
    n=Math.floor(n||0);
    if(!n) return {total:gameScore(gameId), available:available(), newEggs:0};
    const before=available();
    state.scores[gameId]=Math.max(0,(state.scores[gameId]||0)+n);
    save();
    const after=available();
    const newEggs=Math.max(0, Math.floor(after/HATCH_COST)-Math.floor(before/HATCH_COST));
    return {total:state.scores[gameId], available:after, newEggs};
  }
  // 구버전 호환
  function addStars(gameId, n){ return addScore(gameId, n); }

  /* 점수 10점으로 부화 → 포켓몬 id 반환(부족하면 null). 같은 포켓몬은 최대 3마리까지만 카운트 */
  const MAX_DUP=3;
  function hatch(){
    if(available()<HATCH_COST) return null;
    state.spent+=HATCH_COST;
    const id=pickPokemon();
    state.caught[id]=Math.min(MAX_DUP,(state.caught[id]||0)+1);
    save();
    return id;
  }

  /* ════════════════ 도감/부화 팝업 (어느 페이지에서나) ════════════════ */
  let uiReady=false, detailToken=0, toastT=0;
  function ensureUI(){
    if(uiReady) return;
    uiReady=true;
    const css=`
.hub-overlay{position:fixed;inset:0;background:rgba(10,10,25,.78);backdrop-filter:blur(3px);display:none;align-items:center;justify-content:center;z-index:99999;padding:16px;}
.hub-overlay.show{display:flex;}
.hub-dex-card{background:#16213e;color:#e8e8e8;border:2px solid #ffd23f;border-radius:22px;width:100%;max-width:540px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden;font-family:'Jua','Gaegu',sans-serif;}
.hub-dh{display:flex;align-items:center;justify-content:space-between;padding:16px 18px 8px;}
.hub-dh h2{margin:0;font-size:1.4rem;color:#ffd23f;}
.hub-x{background:rgba(255,255,255,.12);color:#fff;border:none;border-radius:10px;padding:7px 14px;font-size:14px;cursor:pointer;font-family:inherit;}
.hub-x:hover{background:rgba(255,255,255,.25);}
.hub-hatch-row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:2px 18px 12px;flex-wrap:wrap;}
.hub-stats{font-size:14px;color:#9ab;}
.hub-stats b{color:#ffd23f;}
.hub-hatch-btn{display:inline-flex;align-items:center;gap:8px;font-size:15px;color:#3a2e2a;background:#ffd23f;border:none;border-radius:14px;padding:10px 18px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.4);font-family:inherit;}
.hub-hatch-btn:disabled{filter:grayscale(.7);opacity:.55;cursor:default;box-shadow:none;}
.hub-dex-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(82px,1fr));gap:8px;padding:8px 14px 16px;overflow-y:auto;}
.hub-cell{position:relative;background:#0f3460;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 4px;gap:4px;border:1px solid rgba(255,255,255,.06);min-height:90px;}
.hub-cell.has{border-color:rgba(255,210,63,.35);cursor:pointer;}
.hub-cell.has:hover{transform:scale(1.05);border-color:#ffd23f;}
.hub-cell img{width:54px;height:54px;image-rendering:pixelated;position:relative;z-index:1;}
.hub-cell.max{border-color:transparent;box-shadow:0 0 0 2px rgba(255,255,255,.35),0 0 16px 2px rgba(255,210,63,.55);animation:hubShine 1.8s ease-in-out infinite;background:linear-gradient(135deg,#3a2a5e,#0f3460 60%);}
.hub-cell.max::before{content:"";position:absolute;inset:-1px;border-radius:12px;padding:2px;background:linear-gradient(120deg,#ff6b6b,#ffd23f,#4ecdc4,#5aa9ff,#a78bfa,#ff6b6b);background-size:300% 300%;-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:hubRainbow 3s linear infinite;pointer-events:none;}
.hub-cell.max::after{content:"✨";position:absolute;top:2px;right:5px;font-size:14px;z-index:2;animation:hubTwinkle 1.5s ease-in-out infinite;}
@keyframes hubShine{0%,100%{filter:saturate(1) brightness(1)}50%{filter:saturate(1.5) brightness(1.18)}}
@keyframes hubRainbow{0%{background-position:0% 50%}100%{background-position:300% 50%}}
@keyframes hubTwinkle{0%,100%{opacity:.45;transform:scale(.85)}50%{opacity:1;transform:scale(1.2)}}
.hub-cell img.sil{filter:brightness(0) opacity(.18);}
.hub-cell .n{font-size:11px;color:#9ab;}
.hub-cell .nm{font-size:12px;color:#e8e8e8;text-align:center;}
.hub-detail-card{background:linear-gradient(160deg,#1e3a6e,#0f3460);border:2px solid #ffd23f;border-radius:22px;padding:24px 20px 20px;width:100%;max-width:340px;text-align:center;position:relative;box-shadow:0 20px 60px rgba(0,0,0,.6);max-height:90vh;overflow-y:auto;font-family:'Jua','Gaegu',sans-serif;}
.hub-dm-x{position:absolute;top:10px;right:10px;width:32px;height:32px;border-radius:50%;border:none;background:rgba(255,255,255,.14);color:#fff;font-size:15px;cursor:pointer;}
#hubDmSprite{width:130px;height:130px;image-rendering:pixelated;filter:drop-shadow(0 6px 14px rgba(0,0,0,.5));}
#hubDmNum{font-size:12px;color:#9ab;}
#hubDmName{font-size:1.5rem;color:#ffd23f;}
#hubDmGenus{font-size:13px;color:#9ab;margin-top:2px;}
.hub-rarity{display:inline-block;padding:3px 12px;border-radius:999px;font-size:12px;font-weight:700;margin-top:8px;}
.hub-rarity.common{background:rgba(155,155,155,.2);color:#aaa;}
.hub-rarity.rare{background:rgba(59,107,206,.25);color:#7baaf7;}
.hub-rarity.epic{background:rgba(150,80,220,.25);color:#c084fc;}
.hub-rarity.legend{background:rgba(255,203,5,.2);color:#ffd23f;}
.hub-types{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0 6px;min-height:30px;}
.hub-type{padding:5px 16px;border-radius:999px;font-size:13px;font-weight:700;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.45);}
#hubDmDesc{font-size:13.5px;line-height:1.75;color:#e8e8e8;background:rgba(0,0,0,.22);border-radius:12px;padding:12px 14px;margin-top:10px;min-height:42px;}
#hubDmDesc.loading{color:#9ab;font-style:italic;}
.hub-dm-actions{margin-top:14px;}
.hub-egg-stage{display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px;color:#ffd23f;font-family:'Jua',sans-serif;}
@keyframes hubShake{0%,100%{transform:rotate(0)}20%{transform:rotate(-12deg)}40%{transform:rotate(12deg)}60%{transform:rotate(-8deg)}80%{transform:rotate(8deg)}}
.hub-shake{animation:hubShake .5s ease-in-out!important;}
@keyframes hubFlash{0%{filter:brightness(1)}30%{filter:brightness(2)}60%{filter:brightness(1.5)}100%{filter:brightness(1)}}
.hub-flash{animation:hubFlash .6s ease-out!important;}
#hubToast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#16213e;color:#fff;padding:10px 20px;border-radius:12px;font-size:14px;border:1px solid rgba(255,255,255,.15);opacity:0;transition:all .3s;pointer-events:none;z-index:100000;font-family:'Gaegu',sans-serif;}
#hubToast.show{opacity:1;transform:translateX(-50%) translateY(0);}`;
    const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);

    const box=document.createElement('div');
    box.innerHTML=`
<div class="hub-overlay" id="hubDexModal">
  <div class="hub-dex-card">
    <div class="hub-dh"><h2>📖 포켓몬 도감</h2><button class="hub-x" data-act="closeDex">닫기 ✕</button></div>
    <div class="hub-hatch-row">
      <div class="hub-stats"><span id="hubDexCount">0 / 151</span> · 부화가능 <b id="hubAvail">0</b>점 / 총 <b id="hubTotal">0</b>점</div>
      <button class="hub-hatch-btn" id="hubHatchBtn" data-act="hatch">🥚 부화하기 (${HATCH_COST}점)</button>
    </div>
    <div class="hub-dex-grid" id="hubDexGrid"></div>
  </div>
</div>
<div class="hub-overlay" id="hubHatchModal">
  <div class="hub-detail-card"><div class="hub-egg-stage">
    <svg id="hubEgg" width="120" height="140" viewBox="0 0 120 140">
      <ellipse cx="60" cy="75" rx="46" ry="58" fill="#f5f0e0" stroke="#d4c89a" stroke-width="3"/>
      <ellipse cx="48" cy="55" rx="10" ry="14" fill="rgba(255,255,255,0.5)" transform="rotate(-20,48,55)"/>
    </svg>
    <div>알에서 무엇이 나올까요?</div>
  </div></div>
</div>
<div class="hub-overlay" id="hubDetailModal">
  <div class="hub-detail-card">
    <button class="hub-dm-x" data-act="closeDetail" aria-label="닫기">✕</button>
    <img id="hubDmSprite" src="" alt="">
    <div id="hubDmNum"></div>
    <div id="hubDmName"></div>
    <div id="hubDmGenus"></div>
    <div><span class="hub-rarity" id="hubDmRarity"></span></div>
    <div class="hub-types" id="hubDmTypes"></div>
    <p id="hubDmDesc"></p>
    <div class="hub-dm-actions" id="hubDmActions"></div>
  </div>
</div>
<div id="hubToast"></div>`;
    document.body.appendChild(box);

    // 이벤트 위임
    box.addEventListener('click', e=>{
      const ov=e.target.closest('.hub-overlay');
      if(e.target.classList.contains('hub-overlay')){ // 배경 클릭
        if(e.target.id==='hubDexModal') closeDex();
        else if(e.target.id==='hubDetailModal') closeDetail();
        return;
      }
      const act=e.target.getAttribute('data-act');
      if(act==='closeDex') closeDex();
      else if(act==='closeDetail') closeDetail();
      else if(act==='hatch') doHatch();
    });
    document.addEventListener('keydown', e=>{
      if(e.key!=='Escape') return;
      if(document.getElementById('hubDetailModal').classList.contains('show')) closeDetail();
      else if(document.getElementById('hubDexModal').classList.contains('show')) closeDex();
    });
  }

  function refreshHatchUI(){
    const c=document.getElementById('hubDexCount'); if(c) c.textContent=caughtCount()+' / 151';
    const a=document.getElementById('hubAvail'); if(a) a.textContent=available();
    const t=document.getElementById('hubTotal'); if(t) t.textContent=totalScore();
    const b=document.getElementById('hubHatchBtn'); if(b) b.disabled=available()<HATCH_COST;
  }

  function renderDex(){
    const grid=document.getElementById('hubDexGrid'); if(!grid) return;
    grid.innerHTML='';
    for(let id=1;id<=151;id++){
      const has=state.caught[id];
      const maxed=has>=MAX_DUP;
      const cell=document.createElement('div'); cell.className='hub-cell'+(has?' has':'')+(maxed?' max':'');
      const img=document.createElement('img'); img.className=has?'':'sil'; img.src=SPRITE(id); img.alt=POKEMON_KR[id]||''; img.loading='lazy';
      const num=document.createElement('div'); num.className='n'; num.textContent='#'+String(id).padStart(3,'0');
      const nm=document.createElement('div'); nm.className='nm'; nm.textContent=has?POKEMON_KR[id]:'???';
      cell.append(img,num,nm);
      if(has&&state.caught[id]>1){const c2=document.createElement('div');c2.className='n';c2.textContent='x'+state.caught[id];cell.appendChild(c2);}
      if(has){ cell.title=POKEMON_KR[id]+(maxed?' (최대 3마리!)':' 상세보기'); cell.onclick=()=>openDetail(id,{}); }
      grid.appendChild(cell);
    }
  }

  function openDex(){ ensureUI(); renderDex(); refreshHatchUI(); document.getElementById('hubDexModal').classList.add('show'); }
  function closeDex(){ const m=document.getElementById('hubDexModal'); if(m) m.classList.remove('show'); }

  function doHatch(){
    if(available()<HATCH_COST){ toast('점수가 부족해요! 게임에서 점수를 모아보세요. (10점 필요)'); return; }
    const svg=document.getElementById('hubEgg');
    document.getElementById('hubHatchModal').classList.add('show');
    svg.classList.remove('hub-shake','hub-flash'); void svg.offsetWidth; svg.classList.add('hub-shake');
    setTimeout(()=>{
      svg.classList.add('hub-flash');
      setTimeout(()=>{
        const id=hatch();
        document.getElementById('hubHatchModal').classList.remove('show');
        renderDex(); refreshHatchUI();
        if(id!=null) openDetail(id,{hatched:true});
      },500);
    },500);
  }

  function openDetail(id, opts){
    ensureUI(); opts=opts||{};
    detailToken++; const token=detailToken;
    const r=RARITY(id);
    document.getElementById('hubDmSprite').src=SPRITE(id);
    document.getElementById('hubDmSprite').alt=POKEMON_KR[id]||'';
    document.getElementById('hubDmNum').textContent='#'+String(id).padStart(3,'0');
    document.getElementById('hubDmName').textContent=POKEMON_KR[id]||'???';
    const rb=document.getElementById('hubDmRarity'); rb.className='hub-rarity '+r.cls; rb.textContent=r.label;
    const genusEl=document.getElementById('hubDmGenus'); genusEl.textContent='';
    const typesEl=document.getElementById('hubDmTypes'); typesEl.innerHTML='';
    const descEl=document.getElementById('hubDmDesc'); descEl.className='loading'; descEl.textContent='설명을 불러오는 중…';
    const actions=document.getElementById('hubDmActions'); actions.innerHTML='';
    if(opts.hatched){
      const again=document.createElement('button'); again.className='hub-hatch-btn'; again.textContent='한 번 더 🥚';
      again.disabled=available()<HATCH_COST;
      again.onclick=()=>{ closeDetail(); doHatch(); };
      actions.appendChild(again);
    }
    document.getElementById('hubDetailModal').classList.add('show');
    fetchDetail(id).then(d=>{
      if(token!==detailToken) return;
      renderTypes(typesEl, d.types);
      genusEl.textContent=d.genus||'';
      descEl.className=''; descEl.textContent=d.flavor||'설명 정보가 없어요.';
    }).catch(()=>{
      if(token!==detailToken) return;
      descEl.className=''; descEl.textContent='설명을 불러오지 못했어요. (인터넷 연결을 확인해 주세요)';
    });
  }
  function renderTypes(el, types){
    el.innerHTML='';
    (types||[]).forEach(t=>{
      const info=TYPE_KR[t]||{label:t,color:'#777'};
      const b=document.createElement('span'); b.className='hub-type'; b.style.background=info.color; b.textContent=info.label+'타입';
      el.appendChild(b);
    });
  }
  function closeDetail(){ const m=document.getElementById('hubDetailModal'); if(m) m.classList.remove('show'); }

  function toast(msg){
    ensureUI();
    const t=document.getElementById('hubToast');
    t.textContent=msg; t.classList.add('show');
    clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2600);
  }

  load();

  global.Hub={
    POKEMON_KR, TYPE_KR, RARITY, SPRITE, pickPokemon, fetchDetail,
    HATCH_COST, state,
    load, save, addScore, addStars, totalScore, available, gameScore, caughtCount, hatch,
    openDex, closeDex, openDetail, toast
  };
})(window);
