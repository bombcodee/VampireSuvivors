/**
 * 블러디 티어 (Bloody Tear) — Whip의 진화 무기
 * - 조건: Whip Lv5 + MoveSpeed 패시브
 * - 360도 전방위 공격 (반원 → 전체 원) + 흡혈
 * - 레벨업 없음 (진화 무기는 최종 형태)
 */
import { distance } from '../utils/MathUtils.js';
import { EVOLUTIONS } from '../data/config.js';

const CFG = EVOLUTIONS.BLOODY_TEAR;

export class BloodyTear {
    constructor() {
        this.id = 'BLOODY_TEAR';
        this.name = CFG.NAME;
        this.level = 1;
        this.isEvolved = true;
        this.cooldownTimer = 0;

        // 이펙트
        this._swingTimer = 0;

        // 스탯
        this.damage = CFG.STATS.damage;
        this.cooldown = CFG.STATS.cooldown;
        this.range = CFG.STATS.range;
        this.knockback = CFG.STATS.knockback;
        this.lifesteal = CFG.STATS.lifesteal;
    }

    levelUp() {
        return false;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        if (this._swingTimer > 0) {
            this._swingTimer -= dt;
        }

        this.cooldownTimer -= dt;

        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = this.cooldown;
            this._attack(playerX, playerY, enemies, game);
        }
    }

    /**
     * 360도 전방위 공격 + 흡혈
     * (Whip은 전방 반원만 공격하지만, Bloody Tear는 전체 원)
     */
    _attack(playerX, playerY, enemies, game) {
        this._swingTimer = 0.25;

        const dmgMul = game ? game.player.damageMultiplier : 1;
        const finalDamage = Math.floor(this.damage * dmgMul);
        let totalHeal = 0;

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = distance(playerX, playerY, enemy.x, enemy.y);
            if (dist > this.range + enemy.radius) continue;

            // 360도이므로 방향 체크 없음
            const isDead = enemy.takeDamage(finalDamage, playerX, playerY);

            // 데미지 텍스트 (빨간색)
            if (game && game.damageTexts) {
                const text = game.damageTexts.get();
                text.init(enemy.x, enemy.y - enemy.radius, finalDamage, CFG.COLOR);
            }

            if (isDead && game) {
                enemy.onDeath(game);
                totalHeal += this.lifesteal;
            } else if (game) {
                game.sound.play('hit');
            }
        }

        // 흡혈 적용
        if (totalHeal > 0 && game) {
            game.player.hp = Math.min(
                game.player.hp + totalHeal,
                game.player.maxHp
            );
        }
    }

    render(ctx, camera, playerX, playerY) {
        if (this._swingTimer <= 0) return;

        const screen = camera.worldToScreen(playerX, playerY);
        const alpha = this._swingTimer / 0.25;

        ctx.save();
        ctx.globalAlpha = alpha * 0.6;

        // 360도 원형 채찍 궤적 (빨간색)
        const currentRadius = this.range * (1.2 - alpha * 0.2);

        ctx.beginPath();
        ctx.arc(screen.x, screen.y, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = CFG.COLOR;
        ctx.lineWidth = 5;
        ctx.shadowColor = CFG.COLOR;
        ctx.shadowBlur = 12;
        ctx.stroke();

        // 안쪽 밝은 원
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, currentRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255, 100, 100, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}
