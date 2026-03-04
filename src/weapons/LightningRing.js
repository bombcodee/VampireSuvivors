/**
 * 라이트닝 링 무기 (Lightning Ring)
 * - 범위 내 무작위 적에게 번개를 내린다
 * - 레벨업하면 번개 횟수, 데미지, 범위 증가
 * - 투사체 없이 즉시 데미지
 */
import { distance } from '../utils/MathUtils.js';
import { WEAPONS } from '../data/config.js';

export class LightningRing {
    constructor() {
        this.id = 'LIGHTNING_RING';
        this.name = WEAPONS.LIGHTNING_RING.NAME;
        this.level = 1;
        this.cooldownTimer = 0;

        // 번개 이펙트 (렌더링용)
        this._strikes = []; // { x, y, timer }

        this._loadLevelStats();
    }

    _loadLevelStats() {
        const stats = WEAPONS.LIGHTNING_RING.LEVELS[this.level - 1];
        this.damage = stats.damage;
        this.cooldown = stats.cooldown;
        this.count = stats.count;
        this.range = stats.range;
    }

    levelUp() {
        if (this.level >= WEAPONS.LIGHTNING_RING.MAX_LEVEL) return false;
        this.level++;
        this._loadLevelStats();
        return true;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        // 이펙트 타이머 감소
        for (let i = this._strikes.length - 1; i >= 0; i--) {
            this._strikes[i].timer -= dt;
            if (this._strikes[i].timer <= 0) {
                this._strikes.splice(i, 1);
            }
        }

        // 쿨타임 감소
        this.cooldownTimer -= dt;

        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = this.cooldown;
            this._strike(playerX, playerY, enemies, game);
        }
    }

    _strike(playerX, playerY, enemies, game) {
        const dmgMul = game ? game.player.damageMultiplier : 1;
        const finalDamage = Math.floor(this.damage * dmgMul);

        // 범위 내 적 필터링
        const inRange = enemies.filter(e =>
            e.active && distance(playerX, playerY, e.x, e.y) < this.range
        );

        if (inRange.length === 0) return;

        // count만큼 무작위 적 선택 (중복 허용)
        for (let i = 0; i < this.count; i++) {
            const target = inRange[Math.floor(Math.random() * inRange.length)];
            if (!target.active) continue;

            const isDead = target.takeDamage(finalDamage, target.x, target.y - 50);

            // 번개 이펙트 추가
            this._strikes.push({ x: target.x, y: target.y, timer: 0.2 });

            // 데미지 텍스트
            if (game && game.damageTexts) {
                const text = game.damageTexts.get();
                text.init(target.x, target.y - target.radius, finalDamage, '#ffeb3b');
            }

            // 적 사망 처리
            if (isDead && game) {
                game.player.killCount++;
                const gem = game.gems.get();
                gem.init(target.x, target.y, target.expValue);
                target.active = false;
            }
        }
    }

    render(ctx, camera, playerX, playerY) {
        // 번개 이펙트 렌더링
        for (const strike of this._strikes) {
            if (!camera.isVisible(strike.x, strike.y)) continue;

            const screen = camera.worldToScreen(strike.x, strike.y);
            const alpha = strike.timer / 0.2;

            ctx.save();
            ctx.globalAlpha = alpha;

            // 번개 기둥 (위에서 아래로)
            ctx.strokeStyle = '#ffeb3b';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#ffeb3b';
            ctx.shadowBlur = 15;

            ctx.beginPath();
            const topY = screen.y - 60;
            ctx.moveTo(screen.x, topY);
            // 지그재그 번개
            ctx.lineTo(screen.x + 8, topY + 15);
            ctx.lineTo(screen.x - 5, topY + 30);
            ctx.lineTo(screen.x + 6, topY + 45);
            ctx.lineTo(screen.x, screen.y);
            ctx.stroke();

            // 착탄 원형 플래시
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 15 * alpha, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 235, 59, 0.4)';
            ctx.fill();

            ctx.restore();
        }
    }
}
