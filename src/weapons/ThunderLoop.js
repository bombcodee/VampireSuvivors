/**
 * 썬더 루프 (Thunder Loop) — LightningRing의 진화 무기
 * - 조건: LightningRing Lv5 + Speed Boost 패시브
 * - 5개 대상에게 연쇄 번개, 넓은 범위, 빠른 쿨다운
 * - 레벨업 없음 (진화 무기는 최종 형태)
 */
import { distance } from '../utils/MathUtils.js';
import { EVOLUTIONS } from '../data/config.js';

const CFG = EVOLUTIONS.THUNDER_LOOP;

export class ThunderLoop {
    constructor() {
        this.id = 'THUNDER_LOOP';
        this.name = CFG.NAME;
        this.level = 1;
        this.isEvolved = true;
        this.cooldownTimer = 0;

        // 번개 이펙트 (렌더링용)
        this._strikes = [];
        // 연쇄 번개 이펙트 (대상 간 연결선)
        this._chains = [];

        // 스탯
        this.damage = CFG.STATS.damage;
        this.cooldown = CFG.STATS.cooldown;
        this.count = CFG.STATS.count;
        this.range = CFG.STATS.range;
    }

    levelUp() {
        return false;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        // 이펙트 타이머 감소
        for (let i = this._strikes.length - 1; i >= 0; i--) {
            this._strikes[i].timer -= dt;
            if (this._strikes[i].timer <= 0) {
                this._strikes.splice(i, 1);
            }
        }
        for (let i = this._chains.length - 1; i >= 0; i--) {
            this._chains[i].timer -= dt;
            if (this._chains[i].timer <= 0) {
                this._chains.splice(i, 1);
            }
        }

        this.cooldownTimer -= dt;

        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = this.cooldown;
            this._strike(playerX, playerY, enemies, game);
        }
    }

    /**
     * 연쇄 번개: 5개 대상에게 순차적으로 번개 (중복 없이)
     */
    _strike(playerX, playerY, enemies, game) {
        const dmgMul = game ? game.player.damageMultiplier : 1;
        const finalDamage = Math.floor(this.damage * dmgMul);

        // 범위 내 적 필터링
        const inRange = enemies.filter(e =>
            e.active && distance(playerX, playerY, e.x, e.y) < this.range
        );

        if (inRange.length === 0) return;

        // 중복 없이 최대 count만큼 선택 (셔플 방식)
        const targets = [];
        const available = [...inRange];
        for (let i = 0; i < this.count && available.length > 0; i++) {
            const idx = Math.floor(Math.random() * available.length);
            targets.push(available[idx]);
            available.splice(idx, 1);
        }

        let prevX = playerX;
        let prevY = playerY;

        for (const target of targets) {
            if (!target.active) continue;

            const isDead = target.takeDamage(finalDamage, target.x, target.y - 50);

            // 번개 이펙트
            this._strikes.push({ x: target.x, y: target.y, timer: 0.25 });

            // 연쇄 선 이펙트 (이전 대상 → 현재 대상)
            this._chains.push({
                x1: prevX, y1: prevY,
                x2: target.x, y2: target.y,
                timer: 0.2,
            });

            prevX = target.x;
            prevY = target.y;

            if (game && game.damageTexts) {
                const text = game.damageTexts.get();
                text.init(target.x, target.y - target.radius, finalDamage, CFG.COLOR);
            }

            if (isDead && game) {
                target.onDeath(game);
            } else if (game) {
                game.sound.play('hit');
            }
        }
    }

    render(ctx, camera, playerX, playerY) {
        // 연쇄 선 이펙트
        for (const chain of this._chains) {
            if (!camera.isVisible(chain.x1, chain.y1) &&
                !camera.isVisible(chain.x2, chain.y2)) continue;

            const s1 = camera.worldToScreen(chain.x1, chain.y1);
            const s2 = camera.worldToScreen(chain.x2, chain.y2);
            const alpha = chain.timer / 0.2;

            ctx.save();
            ctx.globalAlpha = alpha * 0.6;
            ctx.strokeStyle = CFG.COLOR;
            ctx.lineWidth = 2;
            ctx.shadowColor = CFG.COLOR;
            ctx.shadowBlur = 8;

            // 지그재그 연쇄선
            ctx.beginPath();
            ctx.moveTo(s1.x, s1.y);
            const midX = (s1.x + s2.x) / 2 + (Math.random() - 0.5) * 20;
            const midY = (s1.y + s2.y) / 2 + (Math.random() - 0.5) * 20;
            ctx.lineTo(midX, midY);
            ctx.lineTo(s2.x, s2.y);
            ctx.stroke();

            ctx.restore();
        }

        // 번개 이펙트
        for (const strike of this._strikes) {
            if (!camera.isVisible(strike.x, strike.y)) continue;

            const screen = camera.worldToScreen(strike.x, strike.y);
            const alpha = strike.timer / 0.25;

            ctx.save();
            ctx.globalAlpha = alpha;

            // 번개 기둥 (위에서 아래로)
            ctx.strokeStyle = CFG.COLOR;
            ctx.lineWidth = 4;
            ctx.shadowColor = CFG.COLOR;
            ctx.shadowBlur = 18;

            ctx.beginPath();
            const topY = screen.y - 70;
            ctx.moveTo(screen.x, topY);
            ctx.lineTo(screen.x + 10, topY + 18);
            ctx.lineTo(screen.x - 7, topY + 35);
            ctx.lineTo(screen.x + 8, topY + 52);
            ctx.lineTo(screen.x, screen.y);
            ctx.stroke();

            // 착탄 원형 플래시 (더 크게)
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, 20 * alpha, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 214, 0, 0.4)';
            ctx.fill();

            ctx.restore();
        }
    }
}
