/**
 * 카메라 클래스 (Camera)
 * - 플레이어를 화면 중앙에 유지하면서 게임 월드를 보여준다
 * - 월드 좌표 ↔ 화면 좌표 변환을 담당
 * - 화면 흔들림(Screen Shake) 효과 제공
 */
import { CAMERA } from '../data/config.js';

export class Camera {
    /**
     * @param {number} canvasWidth - 캔버스 가로 크기
     * @param {number} canvasHeight - 캔버스 세로 크기
     */
    constructor(canvasWidth, canvasHeight) {
        // 카메라의 월드 좌표 (= 화면 좌상단이 보여주는 월드 위치)
        this.x = 0;
        this.y = 0;

        // 캔버스 크기
        this.width = canvasWidth;
        this.height = canvasHeight;

        // 화면 흔들림 관련
        this._shakeTimer = 0;       // 남은 흔들림 시간
        this._shakeOffsetX = 0;     // 흔들림 X 오프셋
        this._shakeOffsetY = 0;     // 흔들림 Y 오프셋
    }

    /**
     * 카메라가 대상(보통 플레이어)을 따라간다
     * - 대상이 화면 중앙에 오도록 카메라 위치를 조정
     * @param {{ x: number, y: number }} target - 추적 대상
     */
    follow(target) {
        // 대상이 화면 중앙에 오도록 카메라 위치 계산
        this.x = target.x - this.width / 2;
        this.y = target.y - this.height / 2;
    }

    /**
     * 카메라 업데이트 (매 프레임 호출)
     * - 화면 흔들림 효과를 처리한다
     * @param {number} dt - 델타타임
     */
    update(dt) {
        if (this._shakeTimer > 0) {
            this._shakeTimer -= dt;
            // 랜덤 방향으로 흔들림
            this._shakeOffsetX = (Math.random() - 0.5) * 2 * CAMERA.SHAKE_INTENSITY;
            this._shakeOffsetY = (Math.random() - 0.5) * 2 * CAMERA.SHAKE_INTENSITY;
        } else {
            this._shakeOffsetX = 0;
            this._shakeOffsetY = 0;
        }
    }

    /**
     * 화면 흔들림을 시작한다
     * - 플레이어 피격 시 호출하여 타격감을 준다
     */
    shake() {
        this._shakeTimer = CAMERA.SHAKE_DURATION;
    }

    /**
     * 월드 좌표를 화면 좌표로 변환한다
     * - 엔티티를 화면에 그릴 때 사용
     * @param {number} worldX - 월드 X좌표
     * @param {number} worldY - 월드 Y좌표
     * @returns {{ x: number, y: number }} 화면 좌표
     */
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x + this._shakeOffsetX,
            y: worldY - this.y + this._shakeOffsetY,
        };
    }

    /**
     * 특정 월드 좌표가 카메라 뷰 안에 있는지 확인한다
     * - 화면 밖 객체를 렌더링하지 않기 위한 최적화
     * @param {number} worldX - 월드 X좌표
     * @param {number} worldY - 월드 Y좌표
     * @param {number} margin - 여유 범위 (px). 화면 밖으로 이 만큼까지는 포함
     * @returns {boolean} 화면 안에 있으면 true
     */
    isVisible(worldX, worldY, margin = 50) {
        return (
            worldX > this.x - margin &&
            worldX < this.x + this.width + margin &&
            worldY > this.y - margin &&
            worldY < this.y + this.height + margin
        );
    }

    /**
     * 캔버스 크기 변경 시 호출한다 (브라우저 리사이즈 대응)
     * @param {number} width - 새 가로 크기
     * @param {number} height - 새 세로 크기
     */
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
}
