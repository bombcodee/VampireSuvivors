/**
 * 언홀리 베스퍼스 (Unholy Vespers) — KingBible의 진화 무기
 * - 조건: KingBible Lv5 + Armor 패시브
 * - 영구 회전 (쿨다운 없이 항상 활성), 6권의 성서
 * - 더 넓은 궤도, 높은 데미지
 * - 레벨업 없음 (진화 무기는 최종 형태)
 */
import { distance } from '../utils/MathUtils.js';
import { EVOLUTIONS, HIT_GLOW } from '../data/config.js';

const CFG = EVOLUTIONS.UNHOLY_VESPERS;

export class UnholyVespers {
    constructor() {
        this.id = 'UNHOLY_VESPERS';
        this.name = CFG.NAME;
        this.level = 1;
        this.isEvolved = true;
        this.cooldownTimer = 0;

        // 영구 회전
        this._angle = 0;

        // 데미지 쿨다운 (같은 적에게 연속 데미지 방지)
        this._hitCooldowns = new Map();

        // 스탯
        this.damage = CFG.STATS.damage;
        this.orbitRadius = CFG.STATS.orbitRadius;
        this.count = CFG.STATS.count;
        this.cooldown = 0;  // PauseUI 표시용
        this.orbitSpeed = CFG.STATS.speed;
    }

    levelUp() {
        return false;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        // 히트 쿨다운 감소
        for (const [key, time] of this._hitCooldowns) {
            this._hitCooldowns.set(key, time - dt);
            if (time - dt <= 0) this._hitCooldowns.delete(key);
        }

        // 영구 회전 (쿨다운 없이 항상 활성)
        this._angle += this.orbitSpeed * dt;
        this._checkCollisions(playerX, playerY, enemies, game);
    }

    _checkCollisions(playerX, playerY, enemies, game) {
        const bookRadius = CFG.COLLISION_RADIUS;
        const dmgMul = game ? game.player.damageMultiplier : 1;
        const finalDamage = Math.floor(this.damage * dmgMul);

        for (let i = 0; i < this.count; i++) {
            const angleOffset = (Math.PI * 2 / this.count) * i;
            const bookAngle = this._angle + angleOffset;
            const bookX = playerX + Math.cos(bookAngle) * this.orbitRadius;
            const bookY = playerY + Math.sin(bookAngle) * this.orbitRadius;

            for (const enemy of enemies) {
                if (!enemy.active) continue;

                const hitKey = `${i}_${enemy.x}_${enemy.y}`;
                if (this._hitCooldowns.has(hitKey)) continue;

                const dist = distance(bookX, bookY, enemy.x, enemy.y);
                if (dist < bookRadius + enemy.radius) {
                    this._hitCooldowns.set(hitKey, CFG.HIT_COOLDOWN);

                    const isDead = enemy.takeDamage(finalDamage, bookX, bookY, HIT_GLOW.COLORS.UNHOLY_VESPERS);

                    // 히트 파티클
                    if (game) game.particles.emitHit(enemy.x, enemy.y, HIT_GLOW.COLORS.UNHOLY_VESPERS, bookX, bookY);

                    // 데미지 텍스트 (히트 파티클 색상과 통일)
                    if (game && game.damageTexts) {
                        const text = game.damageTexts.get();
                        text.init(enemy.x, enemy.y - enemy.radius, finalDamage, CFG.DAMAGE_TEXT_COLOR || CFG.COLOR);
                    }

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
    }

    render(ctx, camera, playerX, playerY) {
        const bookRadius = CFG.COLLISION_RADIUS;

        for (let i = 0; i < this.count; i++) {
            const angleOffset = (Math.PI * 2 / this.count) * i;
            const bookAngle = this._angle + angleOffset;
            const bookX = playerX + Math.cos(bookAngle) * this.orbitRadius;
            const bookY = playerY + Math.sin(bookAngle) * this.orbitRadius;

            if (!camera.isVisible(bookX, bookY)) continue;

            const screen = camera.worldToScreen(bookX, bookY);

            ctx.save();

            // 발광 효과 (진화 무기: 더 강한 발광)
            ctx.shadowColor = CFG.COLOR;
            ctx.shadowBlur = 12;

            // 책 모양 (직사각형)
            ctx.translate(screen.x, screen.y);
            ctx.rotate(bookAngle + Math.PI / 4);
            ctx.fillStyle = CFG.COLOR;
            ctx.fillRect(-bookRadius * 0.7, -bookRadius, bookRadius * 1.4, bookRadius * 2);

            // 밝은 중심선
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.fillRect(-1, -bookRadius, 2, bookRadius * 2);

            ctx.restore();
        }

        // 궤도 경로 표시
        const screenPlayer = camera.worldToScreen(playerX, playerY);
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.beginPath();
        ctx.arc(screenPlayer.x, screenPlayer.y, this.orbitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = CFG.COLOR;
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}
