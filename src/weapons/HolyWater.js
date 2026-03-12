/**
 * 성수 무기 (Holy Water)
 * - 플레이어 위치에 성수 웅덩이(장판)를 설치한다
 * - 장판 위의 적에게 일정 간격으로 지속 데미지를 준다
 * - 장판은 일정 시간 후 소멸한다
 */
import { distance } from '../utils/MathUtils.js';
import { WEAPONS, HIT_GLOW } from '../data/config.js';

export class HolyWater {
    constructor() {
        this.id = 'HOLY_WATER';
        this.name = WEAPONS.HOLY_WATER.NAME;
        this.level = 1;
        this.cooldownTimer = 0;

        // 활성 장판 목록
        this._pools = [];

        this._loadLevelStats();
    }

    _loadLevelStats() {
        const stats = WEAPONS.HOLY_WATER.LEVELS[this.level - 1];
        this.damage = stats.damage;
        this.cooldown = stats.cooldown;
        this.radius = stats.radius;
        this.duration = stats.duration;
        this.tickRate = stats.tickRate;
    }

    levelUp() {
        if (this.level >= WEAPONS.HOLY_WATER.MAX_LEVEL) return false;
        this.level++;
        this._loadLevelStats();
        return true;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        // 쿨타임 감소
        this.cooldownTimer -= dt;

        // 쿨타임이 끝나면 장판 설치
        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = this.cooldown;
            this._pools.push({
                x: playerX,
                y: playerY,
                lifetime: this.duration,
                tickTimer: 0,
                damage: this.damage,
                radius: this.radius,
                tickRate: this.tickRate,
            });
        }

        // 장판 업데이트
        for (let i = this._pools.length - 1; i >= 0; i--) {
            const pool = this._pools[i];
            pool.lifetime -= dt;
            pool.tickTimer -= dt;

            // 장판 소멸
            if (pool.lifetime <= 0) {
                this._pools.splice(i, 1);
                continue;
            }

            // 틱 데미지
            if (pool.tickTimer <= 0) {
                pool.tickTimer = pool.tickRate;
                this._tickDamage(pool, enemies, game);
            }
        }
    }

    _tickDamage(pool, enemies, game) {
        const dmgMul = game ? game.player.damageMultiplier : 1;
        const finalDamage = Math.floor(pool.damage * dmgMul);

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = distance(pool.x, pool.y, enemy.x, enemy.y);
            if (dist < pool.radius + enemy.radius) {
                const isDead = enemy.takeDamage(finalDamage, pool.x, pool.y, HIT_GLOW.COLORS.HOLY_WATER);

                // 히트 파티클
                if (game) game.particles.emitHit(enemy.x, enemy.y, HIT_GLOW.COLORS.HOLY_WATER, pool.x, pool.y);

                // 데미지 텍스트
                if (game && game.damageTexts) {
                    const text = game.damageTexts.get();
                    text.init(enemy.x, enemy.y - enemy.radius, finalDamage, '#42a5f5');
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
    }

    render(ctx, camera) {
        for (const pool of this._pools) {
            if (!camera.isVisible(pool.x, pool.y)) continue;

            const screen = camera.worldToScreen(pool.x, pool.y);
            const alpha = Math.min(1, pool.lifetime / 0.5); // 소멸 전 페이드아웃

            ctx.save();
            ctx.globalAlpha = 0.35 * alpha;

            // 웅덩이 원형
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, pool.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#64b5f6';
            ctx.fill();

            // 밝은 테두리
            ctx.globalAlpha = 0.5 * alpha;
            ctx.strokeStyle = '#90caf9';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.restore();
        }
    }
}
