/**
 * 갈릭(마늘) 무기 (Garlic)
 * - 플레이어 주변에 지속적으로 범위 피해를 준다
 * - 적을 뒤로 밀어내는 넉백 효과가 있다
 * - 투사체 없이 직접 적에게 데미지를 준다
 * - Vampire Survivors의 "Garlic"과 동일한 컨셉
 */
import { distance } from '../utils/MathUtils.js';
import { WEAPONS, HIT_GLOW } from '../data/config.js';

export class Garlic {
    constructor() {
        this.id = 'GARLIC';
        this.name = WEAPONS.GARLIC.NAME;
        this.level = 1;
        this.cooldownTimer = 0;

        // 범위 표시 애니메이션
        this._pulseTimer = 0;       // 맥동 타이머
        this._showPulse = false;    // 맥동 이펙트 표시 여부

        this._loadLevelStats();
    }

    /**
     * 현재 레벨에 맞는 스탯을 로드한다
     */
    _loadLevelStats() {
        const stats = WEAPONS.GARLIC.LEVELS[this.level - 1];
        this.damage = stats.damage;
        this.cooldown = stats.cooldown;
        this.radius = stats.radius;
        this.knockback = stats.knockback;
    }

    /**
     * 무기 레벨업
     * @returns {boolean} 레벨업 성공 여부
     */
    levelUp() {
        if (this.level >= WEAPONS.GARLIC.MAX_LEVEL) {
            return false;
        }
        this.level++;
        this._loadLevelStats();
        return true;
    }

    /**
     * 매 프레임 무기 업데이트 (쿨타임 체크 → 범위 공격)
     * @param {number} dt - 델타타임 (초)
     * @param {number} playerX - 플레이어 X
     * @param {number} playerY - 플레이어 Y
     * @param {Array} enemies - 활성 적 목록
     * @param {ObjectPool} projectilePool - 투사체 풀 (갈릭은 사용하지 않음)
     * @param {Object} [game] - Game 인스턴스 (킬 처리, 데미지 텍스트용)
     */
    update(dt, playerX, playerY, enemies, projectilePool, game) {
        // 쿨타임 감소
        this.cooldownTimer -= dt;

        // 맥동 이펙트 타이머
        if (this._pulseTimer > 0) {
            this._pulseTimer -= dt;
        } else {
            this._showPulse = false;
        }

        // 쿨타임이 끝나면 범위 공격
        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = this.cooldown;
            this._areaAttack(playerX, playerY, enemies, game);
        }
    }

    /**
     * 범위 공격을 실행한다 (내부 메서드)
     * @param {number} playerX - 플레이어 X
     * @param {number} playerY - 플레이어 Y
     * @param {Array} enemies - 활성 적 목록
     */
    _areaAttack(playerX, playerY, enemies, game) {
        // 맥동 이펙트 시작
        this._showPulse = true;
        this._pulseTimer = 0.15;

        const dmgMul = game ? game.player.damageMultiplier : 1;
        const finalDamage = Math.floor(this.damage * dmgMul);

        // 범위 안의 모든 적에게 데미지 + 넉백
        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = distance(playerX, playerY, enemy.x, enemy.y);
            if (dist < this.radius + enemy.radius) {
                // 데미지 (playerX, playerY를 넘겨서 넉백 방향 계산)
                const isDead = enemy.takeDamage(finalDamage, playerX, playerY, HIT_GLOW.COLORS.GARLIC);

                // 히트 파티클
                if (game) game.particles.emitHit(enemy.x, enemy.y, HIT_GLOW.COLORS.GARLIC, playerX, playerY);

                // 데미지 텍스트 표시
                if (game && game.damageTexts) {
                    const text = game.damageTexts.get();
                    text.init(enemy.x, enemy.y - enemy.radius, finalDamage, '#c8e6c9');
                }

                // 적 사망 처리
                if (isDead && game) {
                    enemy.onDeath(game);
                } else if (game) {
                    game.sound.play('hit');
                    // 보스/드라큘라 피격 시 히트프리즈
                    if (enemy.type === 'BOSS' || enemy.type === 'DRACULA') {
                        game.screenFx.freeze(HIT_GLOW.BOSS_HIT_FREEZE);
                    }
                }
            }
        }
    }

    /**
     * 갈릭의 범위 이펙트를 렌더링한다
     * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
     * @param {Camera} camera - 카메라
     * @param {number} playerX - 플레이어 X
     * @param {number} playerY - 플레이어 Y
     */
    render(ctx, camera, playerX, playerY) {
        const screen = camera.worldToScreen(playerX, playerY);

        ctx.save();

        // 항상 범위 표시 (연하게)
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(200, 230, 201, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 공격 맥동 이펙트 (공격 순간 밝게 번쩍)
        if (this._showPulse) {
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = WEAPONS.GARLIC.COLOR;
            ctx.fill();
        }

        ctx.restore();
    }
}
