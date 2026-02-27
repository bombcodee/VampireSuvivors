/**
 * 경험치 보석 클래스 (Gem)
 * - 적이 죽을 때 드롭되는 경험치 아이템
 * - 플레이어가 가까이 가면 자석처럼 끌려온다
 * - 플레이어와 겹치면 흡수되어 경험치 증가
 * - 오브젝트 풀에서 재사용된다
 */
import { distance, normalize } from '../utils/MathUtils.js';
import { EXP } from '../data/config.js';

export class Gem {
    constructor() {
        // ===== 위치/크기 =====
        this.x = 0;
        this.y = 0;
        this.radius = EXP.GEM_RADIUS;

        // ===== 값 =====
        this.value = 1;         // 경험치 값

        // ===== 상태 =====
        this.active = false;
        this.isMagneted = false; // 플레이어에게 끌리고 있는 중인가

        // ===== 수명 =====
        this.lifetime = EXP.GEM_LIFETIME;   // 남은 수명 (초)

        // ===== 애니메이션 =====
        this._bobTimer = 0;     // 위아래 흔들림 타이머
        this._bobOffset = 0;    // 위아래 흔들림 오프셋
    }

    /**
     * 보석을 초기화한다 (오브젝트 풀에서 꺼낼 때 호출)
     * @param {number} x - 드롭 X 위치
     * @param {number} y - 드롭 Y 위치
     * @param {number} value - 경험치 값
     */
    init(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.active = true;
        this.isMagneted = false;
        this.lifetime = EXP.GEM_LIFETIME;
        this._bobTimer = Math.random() * Math.PI * 2; // 랜덤 시작 위상
    }

    /**
     * 매 프레임 보석 상태를 업데이트한다
     * @param {number} dt - 델타타임 (초)
     * @param {number} playerX - 플레이어 X
     * @param {number} playerY - 플레이어 Y
     * @param {number} pickupRange - 플레이어의 보석 흡수 범위
     */
    update(dt, playerX, playerY, pickupRange) {
        if (!this.active) return;

        // 수명 감소 (자석에 끌리고 있으면 소멸하지 않음)
        if (!this.isMagneted) {
            this.lifetime -= dt;
            if (this.lifetime <= 0) {
                this.active = false;
                return;
            }
        }

        // 위아래 흔들림 애니메이션
        this._bobTimer += dt * 3;
        this._bobOffset = Math.sin(this._bobTimer) * 3;

        // 플레이어와의 거리 계산
        const dist = distance(this.x, this.y, playerX, playerY);

        // 흡수 범위 안에 들어오면 자석 효과
        if (dist < pickupRange) {
            this.isMagneted = true;
        }

        // 자석 효과: 플레이어에게 끌려감
        if (this.isMagneted) {
            const dir = normalize(playerX - this.x, playerY - this.y);
            this.x += dir.x * EXP.GEM_MAGNET_SPEED * dt;
            this.y += dir.y * EXP.GEM_MAGNET_SPEED * dt;
        }
    }

    /**
     * 보석을 화면에 그린다
     * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
     * @param {Camera} camera - 카메라
     */
    render(ctx, camera) {
        if (!this.active) return;
        if (!camera.isVisible(this.x, this.y)) return;

        const screen = camera.worldToScreen(this.x, this.y);
        const displayY = screen.y + this._bobOffset;

        ctx.save();

        // 소멸 전 깜빡임 (남은 수명이 BLINK_TIME 이하일 때)
        if (this.lifetime <= EXP.GEM_BLINK_TIME) {
            // 빠르게 깜빡 (0.15초 간격)
            if (Math.floor(this.lifetime * 6.67) % 2 === 0) {
                ctx.restore();
                return;
            }
        }

        // 보석을 다이아몬드(마름모) 모양으로 그린다
        ctx.fillStyle = EXP.GEM_COLOR;
        ctx.translate(screen.x, displayY);
        ctx.rotate(Math.PI / 4); // 45도 회전 → 사각형이 마름모가 됨

        const size = this.radius * 0.8;
        ctx.fillRect(-size / 2, -size / 2, size, size);

        // 반짝임 효과 (밝은 부분)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(-size / 2, -size / 2, size / 2, size / 2);

        ctx.restore();
    }
}
