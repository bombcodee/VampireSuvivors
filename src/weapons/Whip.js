/**
 * 채찍 무기 (Whip)
 * - 플레이어 전방의 적을 공격하는 근접 무기
 * - 플레이어가 바라보는 방향(facingRight)으로 반원 범위 공격
 * - 넉백 효과 있음
 * - 레벨업하면 데미지, 범위, 넉백 증가
 */
import { distance, normalize } from '../utils/MathUtils.js';
import { WEAPONS, HIT_GLOW } from '../data/config.js';

export class Whip {
    constructor() {
        this.id = 'WHIP';
        this.name = WEAPONS.WHIP.NAME;
        this.level = 1;
        this.cooldownTimer = 0;

        // 채찍 휘두르기 이펙트
        this._swingTimer = 0;
        this._swingDirection = 1; // 1: 오른쪽, -1: 왼쪽

        this._loadLevelStats();
    }

    _loadLevelStats() {
        const stats = WEAPONS.WHIP.LEVELS[this.level - 1];
        this.damage = stats.damage;
        this.cooldown = stats.cooldown;
        this.range = stats.range;
        this.knockback = stats.knockback;
    }

    levelUp() {
        if (this.level >= WEAPONS.WHIP.MAX_LEVEL) return false;
        this.level++;
        this._loadLevelStats();
        return true;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        // 이펙트 타이머 감소
        if (this._swingTimer > 0) {
            this._swingTimer -= dt;
        }

        // 쿨타임 감소
        this.cooldownTimer -= dt;

        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = this.cooldown;
            const facingRight = game ? game.player.facingRight : true;
            this._swingDirection = facingRight ? 1 : -1;
            this._attack(playerX, playerY, facingRight, enemies, game);
        }
    }

    _attack(playerX, playerY, facingRight, enemies, game) {
        // 이펙트 시작
        this._swingTimer = 0.2;

        const dmgMul = game ? game.player.damageMultiplier : 1;
        const finalDamage = Math.floor(this.damage * dmgMul);

        // 전방 반원(180도) 범위 내 적 공격
        // facingRight: 오른쪽(-90도 ~ +90도), 왼쪽(90도 ~ 270도)
        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = distance(playerX, playerY, enemy.x, enemy.y);
            if (dist > this.range + enemy.radius) continue;

            // 적이 전방에 있는지 확인
            const dx = enemy.x - playerX;
            const isFront = facingRight ? (dx >= 0) : (dx <= 0);
            if (!isFront) continue;

            // 데미지 + 넉백
            const isDead = enemy.takeDamage(finalDamage, playerX, playerY, HIT_GLOW.COLORS.WHIP);

            // 히트 파티클
            if (game) game.particles.emitHit(enemy.x, enemy.y, HIT_GLOW.COLORS.WHIP, playerX, playerY);

            // 데미지 텍스트
            if (game && game.damageTexts) {
                const text = game.damageTexts.get();
                text.init(enemy.x, enemy.y - enemy.radius, finalDamage, '#bcaaa4');
            }

            // 적 사망 처리
            if (isDead && game) {
                enemy.onDeath(game);
            } else if (game) {
                game.sound.play('hit');
                if (enemy.type === 'BOSS' || enemy.type === 'DRACULA') {
                    game.screenFx.freeze(HIT_GLOW.BOSS_HIT_FREEZE);
                }
            }
        }
    }

    render(ctx, camera, playerX, playerY) {
        if (this._swingTimer <= 0) return;

        const screen = camera.worldToScreen(playerX, playerY);
        const alpha = this._swingTimer / 0.2;
        const dir = this._swingDirection;

        ctx.save();
        ctx.globalAlpha = alpha * 0.6;

        // 채찍 호 그리기 (전방 반원)
        const startAngle = dir > 0 ? -Math.PI / 2 : Math.PI / 2;
        const endAngle = dir > 0 ? Math.PI / 2 : Math.PI * 3 / 2;

        // 채찍 궤적 (호)
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.range * (1.2 - alpha * 0.2), startAngle, endAngle);
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 4;
        ctx.shadowColor = '#8d6e63';
        ctx.shadowBlur = 8;
        ctx.stroke();

        // 채찍 끝 밝은 부분
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.range * (1.2 - alpha * 0.2), startAngle, endAngle);
        ctx.strokeStyle = 'rgba(188, 170, 164, 0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}
