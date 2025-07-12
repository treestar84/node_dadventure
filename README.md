# MyTamaLife - 캐릭터 육성 웹앱

Vue 3 + TypeScript + Tailwind CSS + Supabase를 사용한 캐릭터 육성 게임입니다.

## 🚀 시작하기

### 사전 요구사항
- Node.js 18+
- npm

### 설치 및 실행

1. 프로젝트 클론 및 의존성 설치
```bash
npm install
```

2. 환경변수 설정
`.env` 파일을 생성하고 Supabase 설정을 추가하세요:
```bash
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Supabase 데이터베이스 설정
`supabase/migrations/001_initial_schema.sql` 파일을 Supabase에서 실행하세요.

4. 개발 서버 실행
```bash
npm run dev
```

## 🎮 주요 기능

### ✅ 구현 완료
- **캐릭터 생성**: 8종 동물 × 8종 직업 선택
- **로그인 시스템**: 캐릭터명 + 자동생성 비밀번호
- **스탯 시스템**: 15개 스탯 (RPG 6개 + 감성 9개)
- **레벨링**: 경험치 기반 레벨업, 포인트 분배
- **Bug 시스템**: 30분마다 생성되는 먹이
- **감정 시스템**: 10가지 감정 및 메시지 출력

### 🚧 개발 예정
- 캐릭터 방문 기능
- 업적 시스템
- 지식의 씨앗 (커뮤니티 기능)
- 사탕 시스템 (선물 기능)
- 상점 및 커스터마이징
- PWA 지원

## 📁 프로젝트 구조

```
src/
├── components/
│   ├── CharacterCreation.vue  # 캐릭터 생성
│   ├── CharacterLogin.vue     # 로그인
│   └── GameMain.vue          # 메인 게임 화면
├── stores/
│   └── character.ts          # Pinia 스토어
├── lib/
│   └── supabase.ts          # Supabase 클라이언트
├── types/
│   └── index.ts             # TypeScript 타입 정의
└── assets/
    └── main.css             # Tailwind CSS 설정
```

## 🗄️ 데이터베이스 스키마

- **characters**: 캐릭터 정보 (이름, 종족, 직업, 스탯, 레벨 등)
- **bugs**: 30분마다 생성되는 먹이 아이템
- **candies**: 캐릭터 간 선물
- **achievements**: 업적 시스템
- **visits**: 캐릭터 방문 기록
- **seeds**: 지식 공유 시스템
- **seed_comments**: 지식 댓글
- **skins**: 커스터마이징 아이템
- **purchases**: 구매 기록

## 🎯 MVP 개발 단계

1. ✅ **1-4단계**: 기본 캐릭터 시스템 완료
2. 🚧 **5-6단계**: 업적 및 커뮤니티 기능 개발 중
3. 🔄 **7-9단계**: 고급 기능 및 PWA 적용 예정

## 🛠️ 기술 스택

- **Frontend**: Vue 3, TypeScript, Tailwind CSS, Pinia
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Build Tool**: Vite
- **Testing**: Vitest

## 📝 커맨드

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 타입 체크
npm run type-check

# 린트
npm run lint

# 테스트
npm run test:unit
```

## 🎨 디자인 컨셉

- 밝고 친근한 그라데이션 배경
- 카드 기반 레이아웃
- 이모지를 활용한 직관적 UI
- 다크모드 지원 준비
