/**
 * 소울 이터 (Soul Eater) — Garlic의 진화 무기
 * - 조건: Garlic Lv5 + MaxHP 패시브
 * - 거대 범위 AoE + 흡혈 (적 처치 시 HP 회복)
 * - 레벨업 없음 (진화 무기는 최종 형태)
 */
import { distance } from '../utils/MathUtils.js';
import { EVOLUTIONS } from '../data/config.js';

const CFG = EVOLUTIONS.SOUL_EATER;

export class SoulEater {
    constructor() {
        this.id = 'SOUL_EATER';
        this.name = CFG.NAME;
        this.level = 1;
        this.isEvolved = true;
        this.cooldownTimer = 0;

        // 범위 표시 애니메이션
        this._pulseTimer = 0;
        this._showPulse = false;

        // 스탯
        this.damage = CFG.STATS.damage;
        this.cooldown = CFG.STATS.cooldown;
        this.radius = CFG.STATS.radius;
        this.knockback = CFG.STATS.knockback;
        this.lifesteal = CFG.STATS.lifesteal;
    }

    levelUp() {
        return false;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        this.cooldownTimer -= dt;

        if (this._pulseTimer > 0) {
            this._pulseTimer -= dt;
        } else {
            this._showPulse = false;
        }

        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = this.cooldown;
            this._areaAttack(playerX, playerY, enemies, game);
        }
    }

    /**
     * 거대 범위 공격 + 흡혈
     */
    _areaAttack(playerX, playerY, enemies, game) {
        this._showPulse = true;
        this._pulseTimer = 0.2;

        const dmgMul = game ? game.player.damageMultiplier : 1;
        const finalDamage = Math.floor(this.damage * dmgMul);
        let totalHeal = 0;

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = distance(playerX, playerY, enemy.x, enemy.y);
            if (dist > this.radius + enemy.radius) continue;

            const isDead = enemy.takeDamage(finalDamage, playerX, playerY);

            // 데미지 텍스트 (보라색)
            if (game && game.damageTexts) {
                const text = game.damageTexts.get();
                text.init(enemy.x, enemy.y - enemy.radius, finalDamage, CFG.COLOR);
            }

            // 적 사망 시 흡혈 + 킬 카운트
            if (isDead && game) {
                game.player.killCount++;
                const gem = game.gems.get();
                gem.init(enemy.x, enemy.y, enemy.expValue);
                enemy.active = false;
                totalHeal += this.lifesteal;
            }
        }

        // 흡혈 적용 (최대 HP 제한)
        if (totalHeal > 0 && game) {
            game.player.hp = Math.min(
                game.player.hp + totalHeal,
                game.player.maxHp
            );
        }
    }

    render(ctx, camera, playerX, playerY) {
        const screen = camera.worldToScreen(playerX, playerY);

        ctx.save();

        // 범위 표시 (보라색, 연하게)
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(179, 136, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // 공격 맥동 이펙트
        if (this._showPulse) {
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(179, 136, 255, 0.15)';
            ctx.fill();

            // 흡혈 이펙트 (내부 원)
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, this.radius * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(179, 136, 255, 0.25)';
            ctx.fill();
        }

        ctx.restore();
    }
}
