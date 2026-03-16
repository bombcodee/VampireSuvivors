/**
 * 데미지 텍스트 클래스 (DamageText)
 * - 적이 피격당했을 때 데미지 숫자가 떠오르는 이펙트
 * - 위로 떠오르면서 서서히 사라진다
 * - 오브젝트 풀에서 재사용된다
 */
export class DamageText {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.text = '';
        this.color = '#ffffff';
        this.lifetime = 0;          // 남은 수명
        this.maxLifetime = 0.6;     // 최대 수명 (초)
        this.active = false;
        this.floatSpeed = 60;       // 위로 떠오르는 속도 (px/초)
    }

    /**
     * 데미지 텍스트를 초기화한다
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     * @param {number} damage - 표시할 데미지 숫자
     * @param {string} [color='#ffffff'] - 텍스트 색상
     */
    init(x, y, damage, color = '#ffffff') {
        this.x = x;
        this.y = y;
        this.text = typeof damage === 'string' ? damage : Math.floor(damage).toString();
        this.color = color;
        this.lifetime = this.maxLifetime;
        this.active = true;
    }

    /**
     * 매 프레임 업데이트
     * @param {number} dt - 델타타임
     */
    update(dt) {
        if (!this.active) return;

        // 위로 떠오름
        this.y -= this.floatSpeed * dt;

        // 수명 감소
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.active = false;
        }
    }

    /**
     * 데미지 텍스트를 화면에 그린다
     * @param {CanvasRenderingContext2D} ctx
     * @param {Camera} camera
     */
    render(ctx, camera) {
        if (!this.active) return;
        if (!camera.isVisible(this.x, this.y)) return;

        const screen = camera.worldToScreen(this.x, this.y);

        // 수명에 따라 투명도 조절 (서서히 사라짐)
        const alpha = this.lifetime / this.maxLifetime;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, screen.x, screen.y);
        ctx.restore();
    }
}
