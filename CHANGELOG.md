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

## [0.2.0] - 2026-03-07 (Phase 2: 게임 완성)

### Added (추가)
- 무기 6종 추가: HolyWater, KingBible, FireWand, Knife, LightningRing, Whip
- 무기 진화 시스템: 8종 진화 무기 (HolyWand, SoulEater, BloodyTear, ThousandEdge, LaBorra, UnholyVespers, Hellfire, ThunderLoop)
- 캐릭터 선택: Antonio(공격력+10%), Imelda(경험치+10%), Pasqualina(투사체속도+10%)
- 골드 시스템 + 영구 업그레이드 상점 (6종: 이동속도, 최대HP, 방어력, 공격력, 경험치, 골드)
- 디버그 모드: F1 토글 (A=자동레벨업, M=자석, K=전체처치, B=골드+1000, E=진화)
- ErrorGuard + Storage 기반 강화
- UI: PauseUI, CharSelectUI, UpgradeShopUI, EvolutionUI, VictoryUI
- 보물상자: 보스 처치 시 드롭, 진화 또는 폴백 보상

### Changed (변경)
- 적 사망 처리: Enemy.onDeath(game)으로 통합 (11곳 → 1곳)
- 매직 넘버: config.js로 이동 (SPREAD_ANGLE, HIT_COOLDOWN, COLLISION_RADIUS)
- 설계 규칙: 줄 수 기반 → 역할 기반으로 변경

### Fixed (수정)
- 범위 무기 골드 미지급 버그
- 범위 무기 보스 상자 미드롭 버그
- 배율 미적용 버그 (6종 무기)

---

## [Unreleased] - Phase 2 잔여 항목

### Added (추가)
- SoundManager: Web Audio API 기반 프로시저럴 효과음 8종 (hit, kill, levelup, evolve, pickup, chest, bosswarn, ui_click)
- VFX 시스템: ParticlePool (적 처치 파편, 보석 반짝임, 레벨업 링, 진화 플래시) + ScreenEffects (Screen Flash, Hit Freeze 메서드)
- 최종 보스 드라큘라 (STG-001): 30분에 등장, 처치 시 승리 (자동 승리 제거)
  - 드라큘라 전용 렌더링 (맥동, 보라 글로우, 두꺼운 테두리, 이름 표시)
  - HUD: 29:30 경고 텍스트 깜빡임 + 드라큘라 HP바 상단 표시
  - 드라큘라 스폰 후 일반 적 스폰 중단
- 디버그: Shift+T 타임스킵(+60초), N키 드라큘라 즉시 소환
- 디버그: V키 진화 무기 중복 생성 버그 수정, "(없음)" → "→ ★진화명" 표시 개선

### Changed (변경)
- 승리 조건: 30분 자동 승리 → 드라큘라 처치 시 승리
- 적 피격 시 빨간색 화면 플래시 추가
- 보석 획득 시 초록색 파티클 이펙트 추가
- 레벨업/진화 시 파티클 + 플래시 이펙트 추가

- VFX-003: 무기별 히트 이펙트 시스템
  - 히트 글로우 아웃라인: 적 피격 시 무기 색상별 발광 테두리 (0.15초 페이드)
  - 히트 파티클: 8종 무기별 고유 파티클 (shape 4종: circle/ring/line/star)
  - ParticlePool.emitHit(): 공격 반대 방향 콘(90도) 형태 방출
  - Lightning 계열 색상 분리: 노란색 → 하늘색 (#87ceeb)
  - Hit Freeze: 비활성화 (0) — 코드 기반에서는 렉으로 느껴짐
- VFX-004: 무기별 데미지 텍스트 색상 통일
  - 원칙: 데미지 텍스트 색 = 히트 파티클 색 = 히트 글로우 색
  - 16종 무기 전체 색상 정리 (12종 변경, 4종 유지)
  - CollisionSystem: proj.hitColor로 투사체 무기 텍스트 색상 전달
  - 진화 무기: DAMAGE_TEXT_COLOR 필드 추가 (렌더링 색과 분리)
  - KingBible/SoulEater 보라색 겹침 해소 (SoulEater → 초록)
- VFX-005: 흡혈 시각 피드백 (SoulEater, BloodyTear)
  - A: 힐 텍스트 (+N) 플레이어 머리 위 (초록 #69f0ae)
  - B: HP바 테두리 초록 플래시 (0.25초)
  - C: HP바 회복 구간 화이트민트 하이라이트 (#b9f6ca, 0.4초)
  - E: 플레이어 글로우 (무적 깜빡임과 독립, 0.5초, shadowBlur×3)
  - D(흡혈 파티클): Phase 3 보류 (보석 흡수 이펙트와 혼동 우려)
  - Player.heal() 메서드 신설 — VFX 타이머 자동 세팅
  - DamageText: 문자열 지원 추가 ("+N" 힐 텍스트용)
- STG-002: 난이도 곡선 세분화 + 디버그 개선 + 보스 버그 수정
- 드라큘라 디스폰 버그 수정 + 경고음/보스 BGM 추가
- DEP-002: GitHub Pages 배포 (bombcodee.github.io/VampireSuvivors)

### Planned (예정)
- ~~사운드: SoundManager (Web Audio API), 효과음 8종~~ ✅ SFX-001, SFX-003 완료
- BGM 1곡 (로열티 프리)
- 효과음 퀄리티 개선 (SFX-004)
- ~~VFX: ParticlePool, ScreenEffects (Hit Freeze, Screen Flash)~~ ✅ VFX-001, VFX-002 완료
- ~~VFX: 무기별 히트 이펙트 (글로우 + 파티클)~~ ✅ VFX-003 완료
- ~~VFX: 무기 데미지 텍스트 색상 정리~~ ✅ VFX-004 완료
- ~~VFX: 흡혈 시각 표시~~ ✅ VFX-005 완료
- ~~스테이지: 30분 타이머 + 최종 보스, 난이도 곡선 세분화~~ ✅ STG-001, STG-002 완료
- UI: PauseUI 영구 업그레이드 보너스 표시
