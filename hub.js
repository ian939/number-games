/* =====================================================================
   hub.js — 숫자놀이터 공용 모듈
   모든 게임과 허브(index.html)가 함께 불러와 쓰는 단일 진실 공급원.

   역할:
   - 포켓몬 데이터/유틸 (POKEMON_KR, TYPE_KR, RARITY, SPRITE, pickPokemon, fetchDetail)
   - 공유 상태: 알(eggs) · 도감(caught) · 게임별 점수 버킷(buckets)
     → localStorage 키 'numbersHub_v1' (같은 origin의 모든 페이지가 공유)
   - 점수 → 알 전환: 게임별 별 10개마다 알 1개 (Hub.addStars)
   - 부화: Hub.hatch() (허브에서만 호출)

   새 게임 추가 시: <script src="hub.js"></script> 를 넣고,
   정답을 맞출 때마다 Hub.addStars('게임id', 별수) 를 호출하면 끝.
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
    if([150,151,144,145,146].includes(id))return{label:'전설',cls:'rarity-legend'};
    if([130,131,142,143,147,148,149].includes(id))return{label:'희귀',cls:'rarity-epic'};
    if(id%7===0||id%11===0)return{label:'레어',cls:'rarity-rare'};
    return{label:'일반',cls:'rarity-common'};
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
      || JSON.parse(localStorage.getItem('pmg2_detail')||'{}'); // 기존 캐시 시드
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

  /* ── 공유 상태: 알 · 도감 · 게임별 점수 버킷 ── */
  const STATE_KEY='numbersHub_v1';
  const PER_EGG=10; // 별 10개 = 알 1개
  let state={eggs:0,caught:{},buckets:{},_v:1};

  function load(){
    let raw=null;
    try{raw=JSON.parse(localStorage.getItem(STATE_KEY)||'null');}catch(e){raw=null;}
    if(raw){
      state.eggs=raw.eggs||0;
      state.caught=raw.caught||{};
      state.buckets=raw.buckets||{};
      state._v=raw._v||1;
      return;
    }
    // 최초 1회: 기존 포켓몬 게임 데이터(pmg2)에서 이전
    try{
      const old=JSON.parse(localStorage.getItem('pmg2')||'null');
      if(old){
        state.eggs=old.eggs||0;
        state.caught=old.caught||{};
      }
    }catch(e){}
    save();
  }
  function save(){try{localStorage.setItem(STATE_KEY,JSON.stringify(state));}catch(e){}}

  /* 게임에서 별(점수)을 적립 → 10개마다 알 1개. {gained, eggs} 반환 */
  function addStars(gameId, n){
    n=Math.max(0, Math.floor(n||0));
    if(!n) return {gained:0, eggs:state.eggs};
    const b=(state.buckets[gameId]||0)+n;
    let gained=0, rem=b;
    while(rem>=PER_EGG){rem-=PER_EGG;gained++;}
    state.buckets[gameId]=rem;
    state.eggs+=gained;
    save();
    return {gained, eggs:state.eggs};
  }

  /* 알 1개 부화 → 포켓몬 id 반환(없으면 null). 허브에서만 호출 */
  function hatch(){
    if(state.eggs<=0) return null;
    state.eggs--;
    const id=pickPokemon();
    state.caught[id]=(state.caught[id]||0)+1;
    save();
    return id;
  }

  function getEggs(){return state.eggs;}
  function caughtCount(){return Object.keys(state.caught).length;}
  function bucketProgress(gameId){return (state.buckets[gameId]||0);} // 0~9, 다음 알까지 남은 별 = PER_EGG - 이값

  load();

  global.Hub={
    POKEMON_KR, TYPE_KR, RARITY, SPRITE, pickPokemon, fetchDetail,
    PER_EGG, state,
    load, save, addStars, hatch, getEggs, caughtCount, bucketProgress
  };
})(window);
