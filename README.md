# 빵지 가계부 🍞

Claude 아티팩트로 쓰던 가계부를 Supabase(저장) + GitHub Pages(주소)로 옮긴 버전이에요.
홈 화면에 추가하면 앱처럼 열리고, Claude에 로그인하지 않아도 돼요.

## 파일 구성

| 파일 | 역할 |
|---|---|
| `index.html` | 가계부 화면 (아티팩트와 같은 코드) |
| `supabase-shim.js` | 저장소를 Supabase로 연결, 로그인 화면, 처음 데이터 가져오기 |
| `config.js` | **내 Supabase 주소와 anon key를 넣는 곳** |
| `supabase.sql` | Supabase에 테이블을 만드는 SQL |
| `manifest.webmanifest`, `sw.js`, `icons/` | 앱처럼 설치되게 해 주는 파일 |

> ⚠️ `bbangji-data.json`(내 가계부 데이터)은 **절대 GitHub에 올리지 마세요.** 이 폴더 밖에 따로 보관하세요.

---

## 처음 한 번 설정하기

### 1. Supabase 프로젝트 만들기
1. https://supabase.com 에 로그인 → **New project**
2. 이름: `bbangji-gagyebu`, 지역: **Northeast Asia (Seoul)**, DB 비밀번호는 아무거나 길게 (따로 쓸 일 없음)

### 2. 테이블 만들기
1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. `supabase.sql` 내용을 통째로 붙여 넣고 **Run**

### 3. 내 계정 만들기
1. **Authentication → Users → Add user → Create new user**
2. 이메일·비밀번호 입력, **Auto Confirm User** 체크 → Create
3. **Authentication → Sign In / Providers**(또는 Settings)에서 **Allow new users to sign up**을 끄기
   → 다른 사람이 가입할 수 없게 막아요.

### 4. config.js 채우기
1. **Project Settings → API** (또는 **API Keys**)
2. `Project URL`과 `anon public` 키(또는 `publishable` 키)를 복사해서 `config.js`에 붙여 넣기

```js
window.BBANGJI_CONFIG = {
  SUPABASE_URL: 'https://abcdefgh.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOi...'
};
```
anon key는 공개돼도 괜찮은 키예요. 데이터는 3번에서 만든 계정으로 로그인해야만 보여요.

### 5. GitHub에 올리기
1. GitHub → **New repository** → 이름 `bbangji` (Public)
2. **uploading an existing file** → 이 폴더 안의 파일들을 전부 끌어다 놓기 (`icons` 폴더 포함) → **Commit**
3. 저장소 **Settings → Pages** → Source: **Deploy from a branch**, Branch: `main` / `(root)` → Save
4. 1~2분 뒤 `https://내아이디.github.io/bbangji/` 주소가 생겨요.

### 6. 데이터 옮기기
1. 그 주소를 열고 로그인
2. "데이터 가져오기" 화면에서 `bbangji-data.json` 선택 → **가져오기**
3. 끝! (이 화면은 처음 한 번만 나와요)

### 7. 아이폰에 설치
Safari로 주소 열기 → 공유 버튼 → **홈 화면에 추가** → 식빵 아이콘이 생겨요.
PC(Chrome/Edge)에서는 주소창 오른쪽의 설치 아이콘을 누르면 돼요.

---

## 알아 두기
- 폰과 PC에서 고친 내용은 실시간으로 서로 반영돼요.
- **백업** 탭의 **복원용 백업**으로 받은 파일은 6번 가져오기 화면에 그대로 다시 넣을 수 있어요.
- 옮긴 뒤에는 Claude 아티팩트 쪽 가계부에는 더 이상 입력하지 마세요. 두 곳의 데이터는 따로 움직여요.
- 앞으로 기능을 고칠 때는 Claude Code에서 이 저장소를 열고 요청하면 돼요.
