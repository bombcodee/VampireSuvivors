# CONVENTIONS.md - 코딩 컨벤션 (코드 작성 규칙)

> 코드를 일관되게 작성하기 위한 규칙입니다.
> 혼자 개발하더라도 규칙을 지키면 나중에 코드를 읽기 쉽습니다.

---

## 1. 네이밍 규칙 (이름 짓기)

### 파일명
```
PascalCase.js  (각 단어 첫 글자 대문자)

✅ Player.js
✅ EnemySpawner.js
✅ LevelUpUI.js
❌ player.js
❌ enemy-spawner.js
❌ levelupui.js
```

### 클래스명
```javascript
// PascalCase
✅ class Player { }
✅ class WeaponSystem { }
✅ class ObjectPool { }
❌ class player { }
❌ class weapon_system { }
```

### 변수명 & 함수명
```javascript
// camelCase (첫 글자 소문자, 이후 단어 대문자)
✅ let moveSpeed = 200;
✅ function takeDamage(amount) { }
✅ let isAlive = true;
❌ let move_speed = 200;
❌ function TakeDamage(amount) { }
```

### 상수 (변하지 않는 값)
```javascript
// UPPER_SNAKE_CASE (전부 대문자, 단어 사이 밑줄)
✅ const MAX_ENEMIES = 300;
✅ const PLAYER_BASE_SPEED = 200;
✅ const CANVAS_WIDTH = 800;
❌ const maxEnemies = 300;
❌ const Max_Enemies = 300;
```

### boolean 변수 (참/거짓)
```javascript
// is, has, can, should 로 시작
✅ let isAlive = true;
✅ let hasShield = false;
✅ let canMove = true;
❌ let alive = true;
❌ let shield = false;
```

### 배열 (여러 개를 담는 변수)
```javascript
// 복수형 사용
✅ let enemies = [];
✅ let projectiles = [];
✅ let activeWeapons = [];
❌ let enemyList = [];
❌ let enemy = [];
```

---

## 2. 파일 구조 규칙

### 한 파일의 구조 (위에서 아래 순서)
```javascript
// ===== 1. import (가져오기) =====
import { Game } from '../core/Game.js';
import { Vector2 } from '../utils/Math.js';

// ===== 2. 상수 정의 =====
const DEFAULT_SPEED = 200;
const MAX_HP = 100;

// ===== 3. 클래스 정의 =====
/**
 * 플레이어 클래스
 * - 이동, 체력, 피격을 관리한다
 */
export class Player {
    // 3-1. 생성자 (constructor)
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.hp = MAX_HP;
    }

    // 3-2. public 메서드 (외부에서 호출하는 것)
    update(dt) { ... }
    render(ctx) { ... }
    takeDamage(amount) { ... }

    // 3-3. private 메서드 (내부에서만 쓰는 것, _ 접두사)
    _handleMovement(dt) { ... }
    _checkBounds() { ... }
}
```

### 1파일 1클래스 원칙
```
✅ Player.js     → class Player 하나만
✅ Enemy.js      → class Enemy 하나만
❌ Entities.js   → class Player + class Enemy (하나의 파일에 여러 클래스 금지)

예외: 아주 작은 유틸리티 함수는 한 파일에 여러 개 가능
     예: utils/Math.js → distance(), normalize(), randomRange() 등
```

---

## 3. 코드 작성 규칙

### 들여쓰기
```javascript
// 스페이스 4칸 (탭 아님)
class Player {
    constructor() {
        this.x = 0;
        if (condition) {
            doSomething();
        }
    }
}
```

### 중괄호
```javascript
// 같은 줄에 열기 (K&R 스타일)
✅ if (isAlive) {
       doSomething();
   }

❌ if (isAlive)
   {
       doSomething();
   }
```

### 문자열
```javascript
// 작은따옴표 사용 (HTML 속성과 구분)
✅ let name = 'player';
✅ let template = `HP: ${this.hp}`;  // 변수 삽입 시 백틱 사용
❌ let name = "player";
```

### 세미콜론
```javascript
// 항상 붙이기
✅ let x = 10;
✅ this.update(dt);
❌ let x = 10
❌ this.update(dt)
```

### 비교 연산자
```javascript
// 항상 === 사용 (== 금지)
✅ if (this.hp === 0) { }
✅ if (this.type !== 'boss') { }
❌ if (this.hp == 0) { }
```

---

## 4. 주석 규칙

### 클래스 주석
```javascript
/**
 * 적(Enemy) 클래스
 * - 플레이어를 향해 이동하고, 접촉 시 데미지를 준다
 * - 사망 시 경험치 보석을 드롭한다
 */
export class Enemy {
```

### 메서드 주석
```javascript
/**
 * 적을 지정된 방향으로 이동시킨다
 * @param {number} dt - 델타타임
 */
move(dt) {
```

### 인라인 주석 (코드 옆 설명)
```javascript
// 대각선 이동 시 속도가 1.414배 빨라지는 것을 방지
if (dx !== 0 && dy !== 0) {
    const length = Math.sqrt(dx * dx + dy * dy);
    dx /= length;  // 정규화 (크기를 1로 만들기)
    dy /= length;
}
```

### 주석 쓰지 않아도 되는 경우
```javascript
// 코드만 봐도 뻔한 것엔 주석 불필요
❌ this.hp -= damage; // HP에서 데미지를 뺀다  ← 뻔함
✅ this.hp -= damage;

// 다만 "왜"에 대한 주석은 좋다
✅ this.hp -= damage * (1 - this.armor); // 방어력으로 데미지 경감
```

---

## 5. 게임 객체(Entity) 공통 규격

### 모든 게임 객체가 가져야 할 속성
```javascript
{
    x: 0,           // 월드 X 좌표
    y: 0,           // 월드 Y 좌표
    width: 32,      // 가로 크기 (충돌 판정용)
    height: 32,     // 세로 크기 (충돌 판정용)
    active: true,   // 활성 상태 (false면 업데이트/렌더 스킵)
}
```

### 모든 게임 객체가 가져야 할 메서드
```javascript
update(dt)    // 매 프레임 로직 업데이트
render(ctx)   // 매 프레임 화면 그리기
reset()       // 오브젝트 풀에서 재사용 시 초기화
```

---

## 6. 이벤트/통신 규칙

### 시스템 간 소통 방법
```javascript
// Game 인스턴스를 통해 다른 시스템에 접근
// (전역 변수 대신 Game을 허브로 사용)

✅ this.game.expSystem.spawnGem(enemy.x, enemy.y);
✅ this.game.player.takeDamage(10);
❌ window.expSystem.spawnGem(...);   // 전역 변수 금지
❌ expSystem.spawnGem(...);          // 직접 참조 금지
```

---

## 7. Git 커밋 메시지 규칙

> 이 프로젝트의 커밋 규칙은 [Conventional Commits](https://www.conventionalcommits.org/) 표준을 따른다.
> CLAUDE.md의 커밋 규칙은 이 섹션을 참조한다 (중복 작성 금지).

### 형식
```
<타입>: <한글 설명>

(선택) 본문: 변경 이유, 부가 설명
```

### prefix 10종

| prefix | 의미 | 언제 쓰나 | 예시 |
|--------|------|-----------|------|
| `feat` | 새 기능 | 기능 추가, 새 무기/시스템/UI | `feat: 채찍 무기 자동 공격 추가` |
| `fix` | 버그 수정 | 동작이 잘못된 걸 고칠 때 | `fix: 대각선 이동 속도 정규화 누락` |
| `refactor` | 구조 개선 | 기능 변화 없이 코드 정리 | `refactor: Enemy에서 스폰 로직 분리` |
| `perf` | 성능 개선 | 최적화, FPS 향상 | `perf: 화면 밖 적 렌더링 스킵` |
| `style` | 코드 스타일 | 포맷팅, 세미콜론, 들여쓰기 (로직 변화 없음) | `style: 들여쓰기 탭→스페이스 통일` |
| `docs` | 문서 | 문서 추가/수정 | `docs: 게임 개발 용어집 추가` |
| `asset` | 리소스 | 이미지, 사운드, 폰트 등 에셋 | `asset: 플레이어 스프라이트시트 추가` |
| `test` | 테스트 | 테스트 코드 추가/수정 | `test: 충돌 판정 유닛 테스트 추가` |
| `chore` | 잡일 | 설정 파일, 빌드, 도구 변경 | `chore: .gitignore 업데이트` |
| `balance` | 밸런스 | config.js 수치만 조정 (코드 변경 없음) | `balance: 후반 적 이동속도 스케일링 추가` |

### 커밋 작성 원칙

```
1. 한 커밋 = 한 주제
   - feat과 fix가 무관한 주제면 별도 커밋으로 분리
   - 같은 기능 작업 중 발견한 관련 버그는 같은 커밋에 포함 가능

2. 혼합 커밋이 불가피할 때
   - 가장 큰 비중의 prefix를 사용한다
   - 본문에 부가 내용을 기록한다
   예: feat: 드라큘라 보스 구현
       - 드라큘라 스폰/렌더/사망 로직
       - fix: 보스 HP바 위치 오프셋 수정

3. prefix 선택 가이드
   - "새로 만들었다" → feat
   - "고장난 걸 고쳤다" → fix
   - "수치만 바꿨다" → balance
   - "코드 정리만 했다" → refactor
   - "빨라지게 했다" → perf
   - 애매하면 feat (가장 넓은 범위)
```

---

## 8. 금지 사항

```
❌ var 사용 금지          → const 또는 let 사용
❌ == 사용 금지           → === 사용
❌ 전역 변수 금지         → Game 인스턴스 통해 접근
❌ 매직 넘버 금지         → 상수로 정의
❌ console.log 남기기 금지 → 디버깅 끝나면 삭제
❌ 한 함수가 여러 작업 처리 금지 → 역할별로 분리
❌ 한 파일이 여러 역할 담당 금지 → 파일 분리 (코어 파일 예외)
❌ 순환 참조 금지         → A→B→A 서로 import 금지
```
