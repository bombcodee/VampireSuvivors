/**
 * 투사체 클래스 (Projectile)
 * - 무기가 발사하는 탄환/마법 등
 * - 직선으로 이동하며 적과 충돌 시 데미지를 준다
 * - 일정 시간 또는 거리 후 소멸
 * - 오브젝트 풀에서 재사용된다
 */
import { PROJECTILE } from '../data/config.js';

export class Projectile {
    constructor() {
        // ===== 위치/크기 =====
        this.x = 0;
        this.y = 0;
        this.radius = 6;

        // ===== 이동 =====
        this.dx = 0;            // 이동 방향 X (정규화됨)
        this.dy = 0;            // 이동 방향 Y (정규화됨)
        this.speed = 350;       // 이동 속도 (px/초)

        // ===== 전투 =====
        this.damage = 10;       // 피해량

        // ===== 수명 =====
        this.lifetime = PROJECTILE.MAX_LIFETIME;    // 남은 수명 (초)
        this.startX = 0;        // 발사 시작 X (거리 계산용)
        this.startY = 0;        // 발사 시작 Y

        // ===== 상태 =====
        this.active = false;
        this.color = '#ffab40';
        this.weaponId = '';     // 어떤 무기에서 발사됐는지

        // ===== 관통 =====
        this.pierce = 1;        // 관통 횟수 (1이면 1마리 맞고 소멸)
        this.hitCount = 0;      // 현재까지 맞힌 횟수
    }

    /**
     * 투사체를 초기화한다 (오브젝트 풀에서 꺼낼 때 호출)
     * @param {Object} config - 투사체 설정
     * @param {number} config.x - 발사 X 위치
     * @param {number} config.y - 발사 Y 위치
     * @param {number} config.dx - 방향 X
     * @param {number} config.dy - 방향 Y
     * @param {number} config.damage - 피해량
     * @param {number} config.speed - 이동 속도
     * @param {number} config.size - 크기(반경)
     * @param {string} config.color - 색상
     * @param {string} config.weaponId - 무기 ID
     */
    init(config) {
        this.x = config.x;
        this.y = config.y;
        this.dx = config.dx;
        this.dy = config.dy;
        this.damage = config.damage;
        this.speed = config.speed;
        this.radius = config.size || 6;
        this.color = config.color || '#ffab40';
        this.weaponId = config.weaponId || '';
        this.pierce = config.pierce || 1;

        this.startX = config.x;
        this.startY = config.y;
        this.lifetime = PROJECTILE.MAX_LIFETIME;
        this.hitCount = 0;
        this.active = true;
    }

    /**
     * 매 프레임 투사체 상태를 업데이트한다
     * @param {number} dt - 델타타임 (초)
     */
    update(dt) {
        if (!this.active) return;

        // 이동
        this.x += this.dx * this.speed * dt;
        this.y += this.dy * this.speed * dt;

        // 수명 감소
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.active = false;
        }

        // 최대 이동 거리 체크
        const travelDx = this.x - this.startX;
        const travelDy = this.y - this.startY;
        const travelDist = Math.sqrt(travelDx * travelDx + travelDy * travelDy);
        if (travelDist > PROJECTILE.MAX_DISTANCE) {
            this.active = false;
        }
    }

    /**
     * 투사체를 화면에 그린다
     * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
     * @param {Camera} camera - 카메라
     */
    render(ctx, camera) {
        if (!this.active) return;
        if (!camera.isVisible(this.x, this.y)) return;

        const screen = camera.worldToScreen(this.x, this.y);

        ctx.save();

        // 발광 효과 (그림자를 빛처럼 사용)
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 10;

        // 투사체 본체
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 밝은 중심점
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    /**
     * 적에게 맞았을 때 호출. 관통 횟수를 체크한다
     * @returns {boolean} 투사체가 소멸해야 하면 true
     */
    onHit() {
        this.hitCount++;
        return this.hitCount >= this.pierce;
    }
}
