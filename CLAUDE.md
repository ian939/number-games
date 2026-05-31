# 숫자놀이터 (number-games)

어린이용 숫자/수학 학습 게임 모음입니다. 각 게임은 거의 **단일 HTML 파일**(인라인 CSS/JS)이며, [index.html](index.html) 허브가 이들을 카드로 묶어 보여줍니다. 공통 보상(알·도감) 로직만 [hub.js](hub.js) 한 파일을 공유한다.

- 배포: GitHub Pages → https://ian939.github.io/number-games/
- 저장소: https://github.com/ian939/number-games
- 새 파일을 추가하고 push 하면 1~2분 뒤 자동 반영됩니다.

## 현재 게임 목록

| 파일 | 제목 | 내용 |
|---|---|---|
| [math_game.html](math_game.html) | 블록 더하기 | 블록(십/일)으로 더하기 |
| [pokemon_math_game.html](pokemon_math_game.html) | 포켓몬 수학 | 더하기·빼기 + 포켓몬 도감 수집 |
| [ten-maker-game.html](ten-maker-game.html) | 10 만들기 대모험 | 10 가르기/모으기, 받아올림 5단계 |

---

## 🥚 공용 알·도감 시스템 ([hub.js](hub.js))

모든 게임의 점수가 **하나의 알(egg) 풀**로 모이고, 그 알로 포켓몬을 부화시켜 **하나의 공용 도감**을 채운다. 알/도감/부화는 **허브(index.html)의 [도감보기] 팝업에서만** 관리한다(게임 안에서는 부화하지 않음).

- **전환율**: 게임별 별(점수) **10개 = 알 1개**. 게임마다 별도 버킷에 누적되고 10이 차면 알 1개로 변환(나머지는 이월).
- **공유 저장소**(같은 origin이라 모든 페이지가 공유):
  - `numbersHub_v1` = `{eggs, caught:{id:수}, buckets:{게임id:별}, _v}`
  - `numbersHub_detail` = PokeAPI 타입·설명 캐시
  - 최초 로드 시 기존 포켓몬 게임 데이터(`pmg2`)의 알·도감을 자동 이전한다.
- **`window.Hub` API** (hub.js): `addStars(gameId, n)` → `{gained, eggs}`, `hatch()` → id|null, `getEggs()`, `caughtCount()`, `bucketProgress(gameId)`, 그리고 데이터/유틸 `POKEMON_KR/TYPE_KR/RARITY/SPRITE/pickPokemon/fetchDetail`.
- **부화/도감 UI**(알 SVG 연출, 도감 그리드, 상세 모달)는 [index.html](index.html)에만 둔다. 게임의 도감/부화 버튼은 `index.html#dex`로 보내면 도감 팝업이 자동으로 열린다.

### 새 게임에서 점수 → 알 연결 (필수)

1. `</body>` 앞(인라인 게임 `<script>` **바로 위**)에 `<script src="hub.js"></script>` 추가.
2. 정답을 맞춰 점수를 줄 때마다 호출:
   ```js
   if (window.Hub) {
     const r = Hub.addStars('내게임id', 획득별수);
     if (r.gained) /* "🥚 알 +N!" 안내 토스트/피드백 */;
   }
   ```
   - `별 차감`(오답 페널티)은 알에 반영하지 않는다 — **획득 시점에만** `addStars` 호출.
   - 게임 자체 점수/별은 각자 localStorage에 따로 저장해도 된다(독립). 알만 Hub로 모은다.

---

## ⭐ 게임 공통 규칙 (반드시 지킬 것)

### 1. 좌상단 [게임 목록] 버튼 — 모든 게임 필수

모든 게임은 **화면 왼쪽 상단에 고정된 `[🏠 게임 목록]` 버튼**을 두어 허브(index.html)로 돌아갈 수 있어야 한다. 위치(좌상단 고정)와 문구(`🏠 게임 목록`)는 **모든 게임에서 동일**하게 유지한다. 색·테두리 등 스타일만 각 게임 테마에 맞춰 조정한다.

**HTML** — `<body>` 바로 다음에 추가:

```html
<a href="index.html" class="home-btn" aria-label="게임 목록으로 돌아가기">🏠 게임 목록</a>
```

**CSS** — 게임 테마에 맞춰 색만 바꾸고, 위치(`position:fixed; top; left; z-index`)는 그대로 유지:

```css
.home-btn{
  position:fixed; top:12px; left:12px; z-index:1000;
  font-family:'Jua',sans-serif; font-size:16px; text-decoration:none;
  /* ↓ 색/테두리만 각 게임 테마에 맞게 조정 */
  color:#fff; background:rgba(0,0,0,.6); border:2px solid #fff;
  border-radius:18px; padding:7px 14px; box-shadow:0 4px 12px rgba(0,0,0,.3);
  transition:transform .1s;
}
.home-btn:active{ transform:translate(2px,2px); }
@media (max-width:480px){ .home-btn{ font-size:14px; padding:5px 11px; top:8px; left:8px; } }
```

**주의 — 좌상단 충돌 처리**
- 게임 화면 좌상단에 이미 다른 버튼(뒤로/홈 등)이 있으면 겹치지 않게 한다.
  - `ten-maker-game.html`: 기존 HUD 배지들을 오른쪽 정렬(`justify-content:flex-end`)해 좌상단을 비웠다.
  - `pokemon_math_game.html`: 게임 플레이 화면엔 자체 뒤로가기 버튼이 좌상단에 있어, `[게임 목록]` 버튼은 **타이틀(진입) 화면에서만** 보이도록 처리했다 (`body:has(#title-screen.active) .home-btn{display:inline-block}`).
- 즉, "좌상단 고정 + 문구 동일"이 원칙이되, 게임 내부 내비게이션과 시각적으로 충돌하면 위 사례처럼 조정한다.

### 2. 새 게임을 허브에 등록

게임을 만든 뒤 [index.html](index.html)의 `GAMES` 배열에 항목 하나만 추가하면 메인 화면에 카드가 자동 생성된다:

```js
{
  file: "새게임.html",     // 같은 폴더의 HTML 파일명
  title: "게임 이름",
  emoji: "🎲",
  desc: "한 줄 설명",
  color: "#4A90E2"        // 카드 강조 색
},
```

### 3. 진행/점수 저장은 localStorage

새로고침·재배포에도 진행이 유지되도록, 게임 상태는 `localStorage`에 저장한다.
- 게임 자체 진행/별은 게임별 고유 키로 저장(예: 블록은 `block_math_game_v1`).
- 값이 바뀌는 시점마다 즉시 저장한다(라운드 끝이 아니라 매 정답 등).
- **공용 알·도감은 hub.js가 `numbersHub_*` 키로 영속화**한다(위 🥚 섹션). 게임은 `Hub.addStars`만 호출하면 된다.
- 외부 데이터(예: PokeAPI)를 쓰면 결과를 localStorage에 캐시해 오프라인/재방문에 대비한다(hub.js가 처리).

### 4. 스타일/대상
- 대상은 어린이. 큰 글씨, 큰 버튼, 밝은 색, 즉각적인 피드백을 사용한다.
- 한국어 UI. 폰트는 보통 `Jua` / `Gaegu`(Google Fonts).
- 모바일(세로) 우선. `viewport` 메타와 반응형을 유지한다.

---

## 배포 방법 (변경 후)

PowerShell 기준 (git은 `C:\Program Files\Git\cmd\git.exe`):

```powershell
$git = "C:\Program Files\Git\cmd\git.exe"
& $git add -A
& $git commit -m "변경 설명"
& $git push origin main
```

push 후 GitHub Pages가 자동 재빌드된다(1~2분). 라이브 URL에서 새로고침해 확인한다.
