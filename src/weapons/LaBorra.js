/**
 * 라 보라 (La Borra) — HolyWater의 진화 무기
 * - 조건: HolyWater Lv5 + Magnet 패시브
 * - 플레이어를 따라다니는 거대한 성수 장판 (고정 장판 → 이동 장판)
 * - 지속적으로 범위 내 적에게 틱 데미지
 * - 레벨업 없음 (진화 무기는 최종 형태)
 */
import { distance } from '../utils/MathUtils.js';
import { EVOLUTIONS } from '../data/config.js';

const CFG = EVOLUTIONS.LA_BORRA;

export class LaBorra {
    constructor() {
        this.id = 'LA_BORRA';
        this.name = CFG.NAME;
        this.level = 1;
        this.isEvolved = true;
        this.cooldownTimer = 0;

        // 틱 타이머 (장판이 항상 활성, 쿨다운마다 틱 데미지)
        this._tickTimer = 0;

        // 맥동 이펙트
        this._pulsePhase = 0;

        // 스탯
        this.damage = CFG.STATS.damage;
        this.cooldown = CFG.STATS.cooldown;
        this.radius = CFG.STATS.radius;
        this.tickRate = CFG.STATS.tickRate;
    }

    levelUp() {
        return false;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        this._pulsePhase += dt * 2;

        this._tickTimer -= dt;

        if (this._tickTimer <= 0) {
            this._tickTimer = this.tickRate;
            this._tickDamage(playerX, playerY, enemies, game);
        }
    }

    /**
     * 플레이어 위치 중심으로 틱 데미지 (항상 활성)
     */
    _tickDamage(playerX, playerY, enemies, game) {
        const dmgMul = game ? game.player.damageMultiplier : 1;
        const finalDamage = Math.floor(this.damage * dmgMul);

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = distance(playerX, playerY, enemy.x, enemy.y);
            if (dist > this.radius + enemy.radius) continue;

            const isDead = enemy.takeDamage(finalDamage, playerX, playerY);

            if (game && game.damageTexts) {
                const text = game.damageTexts.get();
                text.init(enemy.x, enemy.y - enemy.radius, finalDamage, CFG.COLOR);
            }

            if (isDead && game) {
                game.player.killCount++;
                const gem = game.gems.get();
                gem.init(enemy.x, enemy.y, enemy.expValue);
                enemy.active = false;
            }
        }
    }

    render(ctx, camera, playerX, playerY) {
        const screen = camera.worldToScreen(playerX, playerY);
        const pulse = Math.sin(this._pulsePhase) * 0.05 + 1;
        const drawRadius = this.radius * pulse;

        ctx.save();

        // 외부 원 (연한 파란색)
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, drawRadius, 0, Math.PI * 2);
        ctx.fillStyle = CFG.COLOR;
        ctx.fill();

        // 내부 원 (더 진하게)
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, drawRadius * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = CFG.COLOR;
        ctx.fill();

        // 테두리
        ctx.globalAlpha = 0.4;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, drawRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#90caf9';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }
}
