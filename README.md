# Vampire Survivors Clone

게임 개발 학습을 위한 Vampire Survivors 클론 프로젝트

## 게임 소개

자동으로 공격하는 캐릭터를 이동시켜 몰려오는 몬스터를 쓸어버리는 로그라이트 액션 게임

## 기술 스택

- HTML5 Canvas + 순수 JavaScript (ES6+)
- 외부 라이브러리 없음

## 실행 방법

1. VS Code에서 프로젝트 폴더 열기
2. Live Server 확장 프로그램 설치
3. `index.html` 우클릭 → "Open with Live Server"
4. 브라우저에서 게임 플레이

## 조작법

| 키 | 동작 |
|----|------|
| WASD / 방향키 | 캐릭터 이동 |
| ESC | 일시정지 |

## 프로젝트 구조

```
VampireSurvivors-Clone/
├── index.html          # 게임 진입점
├── style.css           # 화면 스타일
├── src/                # 소스 코드
│   ├── main.js         # 게임 시작점
│   ├── core/           # 핵심 시스템
│   ├── entities/       # 게임 객체
│   ├── weapons/        # 무기 시스템
│   ├── systems/        # 게임 시스템
│   ├── ui/             # UI 컴포넌트
│   ├── data/           # 데이터 정의
│   └── utils/          # 유틸리티
├── assets/             # 리소스
│   ├── sprites/        # 이미지
│   ├── audio/          # 사운드
│   └── data/           # 데이터 파일
└── docs/               # 문서
```

## 문서

- [CLAUDE.md](CLAUDE.md) - 프로젝트 작업 규칙
- [ARCHITECTURE.md](ARCHITECTURE.md) - 게임 아키텍처 설계서
- [CONVENTIONS.md](CONVENTIONS.md) - 코딩 컨벤션
- [docs/01_개발순서_및_구조.md](docs/01_개발순서_및_구조.md) - 개발 순서 가이드
- [docs/02_게임개발_용어집.md](docs/02_게임개발_용어집.md) - 게임 개발 용어집
- [docs/03_기술스택_및_도구선택.md](docs/03_기술스택_및_도구선택.md) - 기술 스택 가이드

## 개발 현황

- [ ] 프로토타입: 플레이어 이동
- [ ] 프로토타입: 적 스폰 & AI 이동
- [ ] 프로토타입: 자동 공격 (투사체)
- [ ] 프로토타입: 경험치 & 레벨업
- [ ] 본개발: 무기 종류 추가
- [ ] 본개발: 패시브 아이템
- [ ] 본개발: 스테이지 타이머 & 보스
- [ ] 본개발: 캐릭터 선택 & 영구 업그레이드
- [ ] 폴리싱: 이펙트 & 사운드
- [ ] 출시: 웹 배포
