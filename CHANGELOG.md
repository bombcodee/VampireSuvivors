# CHANGELOG (변경 이력)

> 프로젝트의 모든 변경사항을 날짜순으로 기록합니다.
> 실무에서는 "이 버전에서 뭐가 바뀌었지?"를 추적하는 핵심 문서입니다.
>
> 형식: [Semantic Versioning](https://semver.org/) - MAJOR.MINOR.PATCH
> - MAJOR: 큰 변경 (호환 안 되는 변경)
> - MINOR: 기능 추가
> - PATCH: 버그 수정

---

## [0.1.0] - 2026-02-27 (Phase 1: 프로토타입)

### Added (추가)
- 프로젝트 초기 구조 설정
  - CLAUDE.md, ARCHITECTURE.md, CONVENTIONS.md, README.md
  - docs/ 문서 6종 (비전, 개발순서, 용어집, 기술스택, QA, 파일가이드)
- 게임 엔진 코어
  - Game.js: 게임 상태 관리 (MENU/PLAY/LEVELUP/PAUSE/GAMEOVER)
  - Input.js: 키보드/마우스 입력 처리
  - Camera.js: 플레이어 추적 카메라 + 화면 흔들림
- 게임 객체 (Entities)
  - Player.js: WASD 이동, 체력, 무적, 레벨 시스템
  - Enemy.js: 플레이어 추적 AI, 피격/넉백, 4종 타입 (BAT/ZOMBIE/SKELETON/BOSS)
  - Gem.js: 경험치 보석, 자석 효과, 흔들림 애니메이션
  - Projectile.js: 투사체 이동, 수명, 관통
  - DamageText.js: 부유 데미지 숫자
- 무기 시스템
  - MagicWand.js: 자동 조준 투사체 (5레벨)
  - Garlic.js: 범위 피해 + 넉백 (5레벨)
- 게임 시스템
  - EnemySpawner.js: 시간별 웨이브 스폰, 보스 스폰
  - ExpSystem.js: 레벨업 선택지 생성, 무기/패시브 적용
  - CollisionSystem.js: 투사체↔적, 적↔플레이어, 보석↔플레이어
- UI
  - HUD.js: 체력바, 경험치바, 타이머, 킬수, 무기목록
  - LevelUpUI.js: 3개 선택 카드, 마우스 호버/클릭
  - MenuUI.js: 타이틀 화면
  - GameOverUI.js: 결과 화면 (통계 표시)
- 유틸리티
  - MathUtils.js: 거리, 정규화, 랜덤, 셔플
  - ObjectPool.js: 오브젝트 풀링 (적, 투사체, 보석, 데미지텍스트)
  - config.js: 모든 게임 수치 중앙 관리
- 패시브 아이템 4종: 이동속도, 최대HP, 보석범위, 방어력

### Fixed (버그 수정)
- [BUG-001] Garlic 무기로 적 처치 시 보석 미드롭 + 킬카운트 미증가
- [BUG-002] 넉백 중 적이 동시에 전진하여 넉백 효과 무효화
- [BUG-003] 넉백 감쇠가 프레임레이트에 의존적 (30fps vs 60fps 차이)
- [BUG-004] 게임 루프에서 매 프레임 불필요한 bind() 호출 (메모리 낭비)
- [BUG-005] 미사용 import 정리 (Player/clamp, Enemy/distance, HUD/CANVAS_WIDTH, LevelUpUI/EXP)

---

## [Unreleased] - 다음 버전에 포함될 예정

### Planned (예정)
- Phase 2: 무기 종류 추가 (5종 이상)
- Phase 2: 무기 진화 시스템
- Phase 2: 영구 업그레이드 (골드 시스템)
- Phase 2: 캐릭터 선택 (3종 이상)
- Phase 2: 사운드 & 이펙트
