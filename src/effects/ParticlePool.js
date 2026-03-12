/**
 * 파티클 시스템 (ParticlePool)
 * - 적 처치 파편, 보석 반짝임, 레벨업/진화 이펙트, 무기별 히트 이펙트
 * - 미리 할당된 배열로 GC 부담 최소화
 * - config.js의 PARTICLES 프리셋 사용
 * - shape 4종: circle(채운 원), ring(빈 원), line(짧은 선), star(십자)
 */
import { PARTICLES, HIT_GLOW } from '../data/config.js';

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
        this.shape = 'circle';     // 파티클 모양: circle, ring, line, star
        this.active = false;
    }

    init(x, y, vx, vy, life, size, color, gravity, shape) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.size = size;
        this.color = color;
        this.gravity = gravity;
        this.shape = shape || 'circle';
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

        // 모양별 렌더링 분기
        switch (this.shape) {
            case 'ring':
                this._renderRing(ctx, screen, currentSize);
                break;
            case 'line':
                this._renderLine(ctx, screen, currentSize);
                break;
            case 'star':
                this._renderStar(ctx, screen, currentSize);
                break;
            default: // circle
                this._renderCircle(ctx, screen, currentSize);
                break;
        }

        ctx.restore();
    }

    /**
     * circle: 채운 원 (기본 파티클, 불꽃/핏방울)
     */
    _renderCircle(ctx, screen, size) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, size, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * ring: 속 빈 원 (독기/안개, 물방울/기포)
     * - 일반 원보다 크고 투명하게 → 안개/거품 느낌
     */
    _renderRing(ctx, screen, size) {
        const ringSize = size * 1.5; // 일반 원보다 1.5배 크게
        ctx.globalAlpha *= 0.7;      // 추가 투명도 → 안개 느낌
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(1, size * 0.5);
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, ringSize, 0, Math.PI * 2);
        ctx.stroke();
    }

    /**
     * line: 이동 방향으로 늘어나는 짧은 선 (참격/파편/전기)
     * - 속도 방향을 따라 그려져서 베임/스파크 느낌
     */
    _renderLine(ctx, screen, size) {
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        // 속도가 있으면 이동 방향, 없으면 랜덤 각도
        const dirX = speed > 0 ? this.vx / speed : 1;
        const dirY = speed > 0 ? this.vy / speed : 0;
        const len = size * 2.5; // 선 길이

        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(1, size * 0.6);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(screen.x - dirX * len, screen.y - dirY * len);
        ctx.lineTo(screen.x + dirX * len, screen.y + dirY * len);
        ctx.stroke();
    }

    /**
     * star: 십자(+) 모양 (마법 스파크/성스러운 빛)
     * - 작은 + 모양으로 반짝이는 느낌
     */
    _renderStar(ctx, screen, size) {
        const arm = size * 1.8; // 팔 길이
        ctx.strokeStyle = this.color;
        ctx.lineWidth = Math.max(1, size * 0.5);
        ctx.lineCap = 'round';

        // 가로선
        ctx.beginPath();
        ctx.moveTo(screen.x - arm, screen.y);
        ctx.lineTo(screen.x + arm, screen.y);
        ctx.stroke();

        // 세로선
        ctx.beginPath();
        ctx.moveTo(screen.x, screen.y - arm);
        ctx.lineTo(screen.x, screen.y + arm);
        ctx.stroke();

        // 중심 밝은 점 (글로우 효과)
        ctx.globalAlpha *= 0.5;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
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
        const shape = preset.shape || 'circle';

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

            p.init(x, y, vx, vy, life, size, particleColor, preset.gravity, shape);
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
     * 히트 파티클을 방출한다 (무기 피격 이펙트)
     * - hitColor로 자동으로 프리셋을 찾는다
     * - 공격 방향 반대쪽으로 콘(cone) 형태로 퍼진다
     * @param {number} x - 피격 위치 X (적 위치)
     * @param {number} y - 피격 위치 Y (적 위치)
     * @param {string} hitColor - 무기별 히트 색상 (HIT_GLOW.COLORS 값)
     * @param {number} fromX - 공격 출발 X (넉백 방향 계산용)
     * @param {number} fromY - 공격 출발 Y
     */
    emitHit(x, y, hitColor, fromX, fromY) {
        if (!hitColor) return;

        // hitColor → 프리셋 이름 매핑
        const presetName = HIT_GLOW.PARTICLE_MAP[hitColor];
        if (!presetName) return;

        const preset = PARTICLES[presetName];
        if (!preset) return;

        const shape = preset.shape || 'circle';

        // 공격 반대 방향 (파티클이 튕겨나가는 기본 방향)
        const dx = x - fromX;
        const dy = y - fromY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // 방향이 없으면 (같은 위치) 랜덤 방사
        const baseAngle = dist > 0
            ? Math.atan2(dy, dx)
            : Math.random() * Math.PI * 2;

        for (let i = 0; i < preset.count; i++) {
            const p = this._getInactive();
            if (!p) return; // 풀 소진

            // 콘 형태: 기본 방향 ± 45도 (총 90도 부채꼴)
            const spread = (Math.random() - 0.5) * (Math.PI / 2);
            const angle = baseAngle + spread;
            const speed = preset.speed * (0.5 + Math.random() * 0.5);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            const life = preset.life * (0.7 + Math.random() * 0.3);
            const size = preset.size * (0.8 + Math.random() * 0.4);

            p.init(x, y, vx, vy, life, size, preset.color, preset.gravity, shape);
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
