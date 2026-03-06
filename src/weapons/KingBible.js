/**
 * 킹 바이블 무기 (King Bible)
 * - 플레이어 주변을 회전하는 궤도 투사체
 * - 쿨타임마다 일정 시간 동안 회전하며 적을 공격
 * - 회전 중 닿는 적에게 데미지를 준다
 */
import { distance } from '../utils/MathUtils.js';
import { WEAPONS } from '../data/config.js';

export class KingBible {
    constructor() {
        this.id = 'KING_BIBLE';
        this.name = WEAPONS.KING_BIBLE.NAME;
        this.level = 1;
        this.cooldownTimer = 0;

        // 궤도 상태
        this._active = false;       // 현재 회전 중인가
        this._orbitTimer = 0;       // 남은 회전 시간
        this._angle = 0;            // 현재 회전 각도

        // 데미지 쿨타임 (같은 적에게 연속 데미지 방지)
        this._hitCooldowns = new Map();

        this._loadLevelStats();
    }

    _loadLevelStats() {
        const stats = WEAPONS.KING_BIBLE.LEVELS[this.level - 1];
        this.damage = stats.damage;
        this.cooldown = stats.cooldown;
        this.orbitRadius = stats.orbitRadius;
        this.count = stats.count;
        this.duration = stats.duration;
        this.orbitSpeed = stats.speed;
    }

    levelUp() {
        if (this.level >= WEAPONS.KING_BIBLE.MAX_LEVEL) return false;
        this.level++;
        this._loadLevelStats();
        return true;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        // 히트 쿨다운 감소
        for (const [key, time] of this._hitCooldowns) {
            this._hitCooldowns.set(key, time - dt);
            if (time - dt <= 0) this._hitCooldowns.delete(key);
        }

        if (this._active) {
            // 회전 중
            this._angle += this.orbitSpeed * dt;
            this._orbitTimer -= dt;

            // 충돌 체크
            this._checkCollisions(playerX, playerY, enemies, game);

            if (this._orbitTimer <= 0) {
                this._active = false;
                this.cooldownTimer = this.cooldown;
            }
        } else {
            // 쿨타임 감소
            this.cooldownTimer -= dt;
            if (this.cooldownTimer <= 0) {
                this._active = true;
                this._orbitTimer = this.duration;
                this._angle = 0;
                this._hitCooldowns.clear();
            }
        }
    }

    _checkCollisions(playerX, playerY, enemies, game) {
        const bookRadius = WEAPONS.KING_BIBLE.COLLISION_RADIUS;
        const dmgMul = game ? game.player.damageMultiplier : 1;
        const finalDamage = Math.floor(this.damage * dmgMul);

        for (let i = 0; i < this.count; i++) {
            const angleOffset = (Math.PI * 2 / this.count) * i;
            const bookAngle = this._angle + angleOffset;
            const bookX = playerX + Math.cos(bookAngle) * this.orbitRadius;
            const bookY = playerY + Math.sin(bookAngle) * this.orbitRadius;

            for (const enemy of enemies) {
                if (!enemy.active) continue;

                // 히트 쿨다운 체크 (0.3초 간격)
                const hitKey = `${i}_${enemy.x}_${enemy.y}`;
                if (this._hitCooldowns.has(hitKey)) continue;

                const dist = distance(bookX, bookY, enemy.x, enemy.y);
                if (dist < bookRadius + enemy.radius) {
                    this._hitCooldowns.set(hitKey, WEAPONS.KING_BIBLE.HIT_COOLDOWN);

                    const isDead = enemy.takeDamage(finalDamage, bookX, bookY);

                    if (game && game.damageTexts) {
                        const text = game.damageTexts.get();
                        text.init(enemy.x, enemy.y - enemy.radius, finalDamage, '#ce93d8');
                    }

                    if (isDead && game) {
                        enemy.onDeath(game);
                    }
                }
            }
        }
    }

    render(ctx, camera, playerX, playerY) {
        if (!this._active) return;

        const bookRadius = WEAPONS.KING_BIBLE.COLLISION_RADIUS;

        for (let i = 0; i < this.count; i++) {
            const angleOffset = (Math.PI * 2 / this.count) * i;
            const bookAngle = this._angle + angleOffset;
            const bookX = playerX + Math.cos(bookAngle) * this.orbitRadius;
            const bookY = playerY + Math.sin(bookAngle) * this.orbitRadius;

            if (!camera.isVisible(bookX, bookY)) continue;

            const screen = camera.worldToScreen(bookX, bookY);

            ctx.save();

            // 발광 효과
            ctx.shadowColor = '#ce93d8';
            ctx.shadowBlur = 8;

            // 책 모양 (직사각형)
            ctx.translate(screen.x, screen.y);
            ctx.rotate(bookAngle + Math.PI / 4);
            ctx.fillStyle = '#ce93d8';
            ctx.fillRect(-bookRadius * 0.7, -bookRadius, bookRadius * 1.4, bookRadius * 2);

            // 밝은 중심선
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.fillRect(-1, -bookRadius, 2, bookRadius * 2);

            ctx.restore();
        }

        // 궤도 경로 표시 (연하게)
        const screenPlayer = camera.worldToScreen(playerX, playerY);
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.arc(screenPlayer.x, screenPlayer.y, this.orbitRadius, 0, Math.PI * 2);
        ctx.strokeStyle = '#ce93d8';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }
}
