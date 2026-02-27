/**
 * 메인 메뉴 UI (MenuUI)
 * - 게임 시작 전 타이틀 화면
 * - Enter 또는 Space로 게임 시작
 */
import { UI } from '../data/config.js';

export class MenuUI {
    constructor() {
        this._blinkTimer = 0;   // "Press Enter" 깜빡임 타이머
        this._showText = true;  // 텍스트 표시 여부
    }

    /**
     * 메뉴 업데이트 (깜빡임 애니메이션)
     * @param {number} dt - 델타타임
     */
    update(dt) {
        this._blinkTimer += dt;
        if (this._blinkTimer >= 0.5) {
            this._blinkTimer = 0;
            this._showText = !this._showText;
        }
    }

    /**
     * 메뉴 화면을 그린다
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    render(ctx, canvasWidth, canvasHeight) {
        // 배경
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        // 타이틀
        ctx.fillStyle = '#ef5350';
        ctx.font = `bold 40px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('VAMPIRE', centerX, centerY - 60);

        ctx.fillStyle = '#ffd54f';
        ctx.font = `bold 48px ${UI.FONT_FAMILY}`;
        ctx.fillText('SURVIVORS', centerX, centerY - 10);

        ctx.fillStyle = '#78909c';
        ctx.font = `16px ${UI.FONT_FAMILY}`;
        ctx.fillText('- Clone -', centerX, centerY + 20);

        // 조작 안내
        ctx.fillStyle = '#b0bec5';
        ctx.font = `14px ${UI.FONT_FAMILY}`;
        ctx.fillText('WASD / Arrow Keys to move', centerX, centerY + 70);
        ctx.fillText('Weapons fire automatically!', centerX, centerY + 92);

        // "Press Enter to Start" (깜빡임)
        if (this._showText) {
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 20px ${UI.FONT_FAMILY}`;
            ctx.fillText('Press ENTER or SPACE to Start', centerX, centerY + 140);
        }

        // 하단 크레딧
        ctx.fillStyle = '#546e7a';
        ctx.font = `12px ${UI.FONT_FAMILY}`;
        ctx.fillText('Made with HTML5 Canvas + JavaScript', centerX, canvasHeight - 20);
    }
}
