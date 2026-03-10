/**
 * 화면 효과 시스템 (ScreenEffects)
 * - Screen Flash: 화면 전체 색상 오버레이 (레벨업, 진화, 피격)
 * - Hit Freeze: 게임 업데이트 일시 정지 (타격감)
 */
import { SCREEN_FX } from '../data/config.js';

export class ScreenEffects {
    constructor() {
        // Flash 상태
        this._flashTimer = 0;
        this._flashDuration = 0;
        this._flashColor = '#ffffff';

        // Freeze 상태
        this._freezeTimer = 0;
    }

    /**
     * 화면 플래시를 발동한다
     * @param {string} color - 플래시 색상 (CSS 색상)
     * @param {number} duration - 지속 시간 (초)
     */
    flash(color, duration) {
        this._flashColor = color;
        this._flashDuration = duration;
        this._flashTimer = duration;
    }

    /**
     * Hit Freeze를 발동한다
     * @param {number} [duration] - 정지 시간 (초), 기본값 config
     */
    freeze(duration) {
        this._freezeTimer = duration || SCREEN_FX.FREEZE_DURATION;
    }

    /**
     * 현재 프리즈 중인지 반환한다
     */
    get isFrozen() {
        return this._freezeTimer > 0;
    }

    update(dt) {
        if (this._freezeTimer > 0) {
            this._freezeTimer -= dt;
        }
        if (this._flashTimer > 0) {
            this._flashTimer -= dt;
        }
    }

    /**
     * 화면 플래시 오버레이를 렌더한다
     * - _render() 맨 마지막에 호출 (모든 것 위에 그림)
     */
    render(ctx, width, height) {
        if (this._flashTimer <= 0) return;

        const alpha = (this._flashTimer / this._flashDuration) * SCREEN_FX.FLASH_ALPHA;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this._flashColor;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
}
