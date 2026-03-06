/**
 * 플레이어 클래스 (Player)
 * - 사용자가 조작하는 캐릭터
 * - WASD/방향키로 이동
 * - 무기를 장착하고 자동으로 공격
 * - 경험치를 모아 레벨업
 */
import { PLAYER, CHARACTERS } from '../data/config.js';
import { ErrorGuard } from '../utils/ErrorGuard.js';

export class Player {
    /**
     * @param {number} x - 시작 X 위치
     * @param {number} y - 시작 Y 위치
     */
    constructor(x, y) {
        // ===== 위치/크기 =====
        this.x = x;
        this.y = y;
        this.radius = PLAYER.RADIUS;

        // ===== 스탯 =====
        this.maxHp = PLAYER.MAX_HP;
        this.hp = this.maxHp;
        this.baseSpeed = PLAYER.SPEED;
        this.pickupRange = PLAYER.PICKUP_RANGE;

        // ===== 스탯 배율 (패시브/캐릭터 보너스) =====
        this.speedMultiplier = 1.0;         // 이동 속도 배율
        this.pickupMultiplier = 1.0;        // 보석 흡수 범위 배율
        this.armor = 0;                     // 방어력 (받는 데미지 감소)
        this.damageMultiplier = 1.0;        // 공격력 배율 (캐릭터 보너스)
        this.expMultiplier = 1.0;           // 경험치 배율 (캐릭터 보너스)
        this.projSpeedMultiplier = 1.0;     // 투사체 속도 배율 (캐릭터 보너스)
        this.goldMultiplier = 1.0;          // 골드 획득 배율 (영구 업그레이드)

        // ===== 캐릭터 =====
        this.characterId = 'ANTONIO';       // 선택된 캐릭터 ID

        // ===== 무기 =====
        this.weapons = [];  // 장착된 무기 배열

        // ===== 경험치/레벨 =====
        this.level = 1;
        this.exp = 0;
        this.expToNext = 0;     // Game에서 설정됨

        // ===== 패시브 아이템 레벨 추적 =====
        this.passiveLevels = {}; // { 'MOVE_SPEED': 2, 'ARMOR': 1, ... }

        // ===== 피격/무적 =====
        this.invincibleTimer = 0;   // 남은 무적 시간
        this.isInvincible = false;

        // ===== 통계 =====
        this.killCount = 0;
        this.totalExp = 0;

        // ===== 렌더링 =====
        this.facingRight = true;    // 바라보는 방향 (스프라이트 반전용)
        this.flashTimer = 0;        // 피격 시 깜빡임 타이머

        // ===== 활성 상태 =====
        this.active = true;
    }

    /**
     * 실제 이동 속도를 계산한다 (기본 속도 × 배율)
     * @returns {number} 현재 이동 속도
     */
    get speed() {
        return this.baseSpeed * this.speedMultiplier;
    }

    /**
     * 실제 보석 흡수 범위를 계산한다
     * @returns {number} 현재 흡수 범위
     */
    get currentPickupRange() {
        return this.pickupRange * this.pickupMultiplier;
    }

    /**
     * 매 프레임 플레이어 상태를 업데이트한다
     * @param {number} dt - 델타타임 (초)
     * @param {Input} input - 입력 시스템
     */
    update(dt, input) {
        // 이동 처리
        this._handleMovement(dt, input);

        // 무적 시간 감소
        if (this.invincibleTimer > 0) {
            this.invincibleTimer -= dt;
            this.isInvincible = true;
        } else {
            this.isInvincible = false;
        }

        // 깜빡임 타이머 감소
        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }
    }

    /**
     * 무기들을 업데이트한다 (자동 공격)
     * @param {number} dt - 델타타임
     * @param {Array} enemies - 활성 적 목록
     * @param {ObjectPool} projectilePool - 투사체 풀
     * @param {Object} game - Game 인스턴스 (Garlic 등 범위무기 킬 처리용)
     */
    updateWeapons(dt, enemies, projectilePool, game) {
        for (const weapon of this.weapons) {
            try {
                weapon.update(dt, this.x, this.y, enemies, projectilePool, game);
            } catch (error) {
                // 무기 에러는 비활성화하지 않음 (다음 프레임에 복구 가능)
                ErrorGuard.logError(`Weapon:${weapon.id}`, error);
            }
        }
    }

    /**
     * 플레이어를 화면에 그린다
     * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
     * @param {Camera} camera - 카메라
     */
    render(ctx, camera) {
        const screen = camera.worldToScreen(this.x, this.y);

        // 무적 중 깜빡임 효과 (0.1초 간격으로 보이기/숨기기)
        if (this.isInvincible && Math.floor(this.invincibleTimer * 10) % 2 === 0) {
            return; // 이 프레임은 안 그림 (깜빡)
        }

        ctx.save();

        // 피격 직후 흰색 플래시
        if (this.flashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color || PLAYER.COLOR;
        }

        // 몸체 (원)
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 눈 (바라보는 방향 표시)
        const eyeOffsetX = this.facingRight ? 5 : -5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screen.x + eyeOffsetX, screen.y - 3, 4, 0, Math.PI * 2);
        ctx.fill();

        // 눈동자
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(screen.x + eyeOffsetX + (this.facingRight ? 1 : -1), screen.y - 3, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 플레이어가 피해를 받는다
     * @param {number} amount - 피해량
     * @returns {boolean} 사망했으면 true
     */
    takeDamage(amount) {
        // 무적 중이면 데미지 무시
        if (this.isInvincible) {
            return false;
        }

        // 방어력으로 데미지 경감 (최소 1 데미지)
        const actualDamage = Math.max(1, amount - this.armor);
        this.hp -= actualDamage;

        // 무적 시간 시작
        this.invincibleTimer = PLAYER.INVINCIBLE_TIME;
        this.flashTimer = 0.1;

        // 사망 여부 반환
        return this.hp <= 0;
    }

    /**
     * 경험치를 추가한다
     * @param {number} amount - 경험치량
     * @returns {boolean} 레벨업했으면 true
     */
    addExp(amount) {
        const scaledAmount = Math.floor(amount * this.expMultiplier);
        this.exp += scaledAmount;
        this.totalExp += scaledAmount;

        if (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.level++;
            return true; // 레벨업!
        }
        return false;
    }

    /**
     * 무기를 추가한다
     * @param {Object} weapon - 무기 인스턴스
     */
    addWeapon(weapon) {
        this.weapons.push(weapon);
    }

    /**
     * 특정 무기를 가지고 있는지 확인한다
     * @param {string} weaponId - 무기 ID (예: 'MAGIC_WAND')
     * @returns {Object|undefined} 무기 인스턴스 또는 undefined
     */
    getWeapon(weaponId) {
        return this.weapons.find(w => w.id === weaponId);
    }

    /**
     * 기존 무기를 새 무기로 교체한다 (진화 시스템용)
     * @param {string} oldWeaponId - 교체할 기존 무기 ID
     * @param {Object} newWeapon - 새 무기 인스턴스
     * @returns {boolean} 교체 성공 여부
     */
    replaceWeapon(oldWeaponId, newWeapon) {
        const index = this.weapons.findIndex(w => w.id === oldWeaponId);
        if (index === -1) return false;
        this.weapons[index] = newWeapon;
        return true;
    }

    /**
     * 게임 재시작 시 플레이어를 초기 상태로 리셋한다
     * @param {number} x - 시작 X 위치
     * @param {number} y - 시작 Y 위치
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.maxHp = PLAYER.MAX_HP;
        this.hp = this.maxHp;
        this.speedMultiplier = 1.0;
        this.pickupMultiplier = 1.0;
        this.armor = 0;
        this.damageMultiplier = 1.0;
        this.expMultiplier = 1.0;
        this.projSpeedMultiplier = 1.0;
        this.goldMultiplier = 1.0;
        this.weapons = [];
        this.level = 1;
        this.exp = 0;
        this.passiveLevels = {};
        this.invincibleTimer = 0;
        this.isInvincible = false;
        this.killCount = 0;
        this.totalExp = 0;
        this.active = true;
    }

    /**
     * 캐릭터 보너스를 적용한다
     * @param {string} characterId - 캐릭터 ID (예: 'ANTONIO')
     */
    applyCharacter(characterId) {
        const charConfig = CHARACTERS[characterId];
        if (!charConfig) return;

        this.characterId = characterId;
        this.color = charConfig.COLOR;

        const bonus = charConfig.BONUS;
        this[bonus.stat] += bonus.value;
    }

    /**
     * 이동 처리 (내부 메서드)
     * @param {number} dt - 델타타임
     * @param {Input} input - 입력 시스템
     */
    _handleMovement(dt, input) {
        const dir = input.getDirection();

        // 이동이 있으면 바라보는 방향 업데이트
        if (dir.x !== 0) {
            this.facingRight = dir.x > 0;
        }

        // 위치 업데이트 (속도 × 방향 × 시간)
        this.x += dir.x * this.speed * dt;
        this.y += dir.y * this.speed * dt;
    }
}
