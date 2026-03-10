/**
 * 파티클 시스템 (ParticlePool)
 * - 적 처치 파편, 보석 반짝임, 레벨업/진화 이펙트
 * - 미리 할당된 배열로 GC 부담 최소화
 * - config.js의 PARTICLES 프리셋 사용
 */
import { PARTICLES } from '../data/config.js';

class Particle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.size = 3;
        this.color = '#ffffff';
        this.gravity = 0;
        this.active = false;
    }

    init(x, y, vx, vy, life, size, color, gravity) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.gravity = gravity;
        this.active = true;
    }

    update(dt) {
        if (!this.active) return;

        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.life -= dt;

        if (this.life <= 0) {
            this.active = false;
        }
    }

    render(ctx, camera) {
        if (!this.active) return;
        if (!camera.isVisible(this.x, this.y)) return;

        const screen = camera.worldToScreen(this.x, this.y);
        const alpha = this.life / this.maxLife;
        const currentSize = this.size * alpha;

        if (currentSize < 0.5) return;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, currentSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

export class ParticlePool {
    constructor() {
        this._particles = [];
        for (let i = 0; i < PARTICLES.MAX_COUNT; i++) {
            this._particles.push(new Particle());
        }
    }

    /**
     * 파티클을 방출한다
     * @param {number} x - 월드 X
     * @param {number} y - 월드 Y
     * @param {string} presetName - 프리셋 이름 (DEATH_BURST, GEM_SPARKLE 등)
     * @param {string} [color] - 색상 오버라이드 (적 색상 등)
     */
    emit(x, y, presetName, color) {
        const preset = PARTICLES[presetName];
        if (!preset) return;

        const particleColor = color || preset.color || '#ffffff';

        for (let i = 0; i < preset.count; i++) {
            const p = this._getInactive();
            if (!p) return; // 풀 소진

            // 방사형 속도 (랜덤 각도)
            const angle = Math.random() * Math.PI * 2;
            const speed = preset.speed * (0.5 + Math.random() * 0.5);
            const vx = Math.cos(angle) * speed;
            // GEM_SPARKLE: 위쪽으로만
            const vy = presetName === 'GEM_SPARKLE'
                ? -Math.abs(Math.sin(angle) * speed)
                : Math.sin(angle) * speed;

            const life = preset.life * (0.7 + Math.random() * 0.3);
            const size = preset.size * (0.8 + Math.random() * 0.4);

            p.init(x, y, vx, vy, life, size, particleColor, preset.gravity);
        }
    }

    update(dt) {
        for (const p of this._particles) {
            if (p.active) p.update(dt);
        }
    }

    render(ctx, camera) {
        for (const p of this._particles) {
            if (p.active) p.render(ctx, camera);
        }
    }

    /**
     * 비활성 파티클 하나를 반환한다
     */
    _getInactive() {
        for (const p of this._particles) {
            if (!p.active) return p;
        }
        return null;
    }
}
