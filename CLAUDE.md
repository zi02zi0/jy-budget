# 빵지 가계부 (jy-budget)

황지영(빵지)의 개인 가계부 웹앱. 원래 Claude 아티팩트였던 것을 GitHub Pages + Supabase로 옮긴 버전.
- 주소: https://zi02zi0.github.io/jy-budget/
- **사용자와는 항상 한국어로 대화할 것.** 사용자는 개발자가 아니므로 쉬운 말로 설명.

## 구조
- `index.html` — 앱 전체 (vanilla JS, 단일 파일, 약 950KB: 폰트 임베드 포함). 빌드 도구 없음.
- `supabase-shim.js` — 아티팩트용 `window.claude.use('db'|'user'|'downloads')` API를 Supabase 위에 흉내 냄. 로그인 화면(#bj-gate), 첫 실행 시 JSON 가져오기, `bbangjiLogout`, `bbangjiExportDocs`(복원용 백업).
- `config.js` — Supabase URL과 anon(publishable) key. 공개돼도 됨(RLS로 보호).
- `supabase.sql` — `public.docs(user_id, path, data jsonb, updated_at)`, PK(user_id,path), RLS(auth.uid()=user_id), realtime publication.
- `sw.js` — 네트워크 우선 앱 셸 캐시. **아이콘이나 셸 파일을 바꾸면 `CACHE` 버전(bbangji-vN)을 올릴 것.**
- `manifest.webmanifest`, `icons/` — PWA (고양이 아이콘).
- `tools/sync-md.ps1` — 사용자 Windows PC에서 작업 스케줄러로 30분마다 실행되어 main의 모든 `.md`를 `D:\황지영\Claude`에 덮어씀. 그러니 md 수정도 main에 푸시해야 PC 폴더에 반영됨. (UTF-8 BOM 유지할 것: Windows PowerShell 5.1이 한글을 읽으려면 필요)

## 데이터 모델 (docs 테이블의 path별 문서)
- `tx/YYYY-MM` → `{month, items:[...]}` 거래. 금액은 부호 있음, 이체는 kind '이체'.
- `meta/categories`, `meta/wallets`, `meta/recurring`(루틴), `meta/settings`, `meta/stats`, `meta/fixed`.
- 앱 코드는 `S.db.collection('tx'|'meta').limit().onSnapshot()`과 `S.db.doc(path).set(data)`만 사용. saveMonth/PEND 맵으로 로컬 변경 보호.
- 지갑 종류: normal/card/od/loan + saving/group(모임통장)/closed 플래그. 모임통장 입출금은 내 수입/지출에서 제외. 기본 결제수단은 현대카드(settings.defaultWallet).

## 규칙
- **개인 금융 데이터(백업 JSON 등)를 저장소에 커밋하지 말 것.** 저장소는 Public.
- 수정 후에는 로컬에서 Playwright 등으로 화면이 깨지지 않는지 확인하고, main에 커밋하면 1~2분 뒤 Pages에 반영됨.
- **사용자 요청: 수정하면 확인(화면 테스트)한 뒤 main에 바로 커밋·푸시할 것.** 작업용 브랜치를 쓰게 되더라도 마지막엔 main에 반영.
- 모바일(아이폰 홈 화면 앱)과 PC 둘 다 쓰므로 두 화면 모두 확인.
- 인라인 코드에 `//` 주석을 줄 중간에 넣지 말 것(과거에 코드가 한 줄로 이어져 깨진 적 있음). `/* */` 사용.
