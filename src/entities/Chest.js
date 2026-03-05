/**
 * 보물 상자 (Chest)
 * - 보스 처치 시 드롭되는 특수 아이템
 * - 플레이어가 직접 걸어가서 수집해야 한다 (자석 효과 없음)
 * - 수집 시 무기 진화 또는 폴백 보상을 준다
 * - 금색 발광 + 위아래 흔들림 애니메이션
 */
import { CHEST } from '../data/config.js';

export class Chest {
    constructor() {
        // ===== 위치/크기 =====
        this.x = 0;
        this.y = 0;
        this.radius = CHEST.RADIUS;

        // ===== 상태 =====
        this.active = false;

        // ===== 애니메이션 =====
        this._bobTimer = 0;     // 위아래 흔들림 타이머
        this._bobOffset = 0;    // 위아래 흔들림 오프셋
        this._glowTimer = 0;    // 발광 효과 타이머
    }

    /**
     * 상자를 초기화한다 (보스 사망 위치에 생성)
     * @param {number} x - 드롭 X 위치
     * @param {number} y - 드롭 Y 위치
     */
    init(x, y) {
        this.x = x;
        this.y = y;
        this.active = true;
        this._bobTimer = 0;
        this._glowTimer = 0;
    }

    /**
     * 매 프레임 상자 상태를 업데이트한다
     * - 수명 제한 없음 (영구 존재, 수집될 때까지)
     * @param {number} dt - 델타타임 (초)
     */
    update(dt) {
        if (!this.active) return;

        // 위아래 흔들림 애니메이션
        this._bobTimer += dt * CHEST.BOB_SPEED;
        this._bobOffset = Math.sin(this._bobTimer) * 4;

        // 발광 효과 타이머
        this._glowTimer += dt * 3;
    }

    /**
     * 상자를 화면에 그린다 (금색 상자 + 발광)
     * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
     * @param {Camera} camera - 카메라
     */
    render(ctx, camera) {
        if (!this.active) return;
        if (!camera.isVisible(this.x, this.y)) return;

        const screen = camera.worldToScreen(this.x, this.y);
        const displayY = screen.y + this._bobOffset;
        const glowAlpha = 0.3 + Math.sin(this._glowTimer) * 0.15;

        ctx.save();

        // 발광 원형 (뒤쪽)
        ctx.beginPath();
        ctx.arc(screen.x, displayY, this.radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 215, 0, ${glowAlpha})`;
        ctx.fill();

        // 상자 몸체 (사각형)
        const boxW = this.radius * 2;
        const boxH = this.radius * 1.5;
        ctx.fillStyle = '#b8860b';
        ctx.fillRect(screen.x - boxW / 2, displayY - boxH / 2, boxW, boxH);

        // 상자 뚜껑 (위쪽 더 밝게)
        ctx.fillStyle = CHEST.COLOR;
        ctx.fillRect(screen.x - boxW / 2, displayY - boxH / 2, boxW, boxH * 0.4);

        // 자물쇠 (중앙 원)
        ctx.beginPath();
        ctx.arc(screen.x, displayY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff9c4';
        ctx.fill();

        // 테두리
        ctx.strokeStyle = '#ffc107';
        ctx.lineWidth = 2;
        ctx.strokeRect(screen.x - boxW / 2, displayY - boxH / 2, boxW, boxH);

        ctx.restore();
    }
}
