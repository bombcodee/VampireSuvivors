/**
 * 게임 오버 UI (GameOverUI)
 * - 플레이어 사망 시 결과 화면
 * - 생존 시간, 레벨, 킬 수 등 통계 표시
 * - Enter로 메인 메뉴로 복귀
 */
import { UI } from '../data/config.js';

export class GameOverUI {
    constructor() {
        this._blinkTimer = 0;
        this._showText = true;
    }

    /**
     * 업데이트 (깜빡임)
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
     * 게임 오버 화면을 그린다
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     * @param {Object} stats - 게임 통계
     */
    render(ctx, canvasWidth, canvasHeight, stats) {
        // 어두운 오버레이
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const centerX = canvasWidth / 2;
        const centerY = canvasHeight / 2;

        // "GAME OVER"
        ctx.fillStyle = '#ef5350';
        ctx.font = `bold 48px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', centerX, centerY - 80);

        // 통계
        ctx.font = `18px ${UI.FONT_FAMILY}`;
        ctx.fillStyle = '#ffffff';
        const statY = centerY - 20;
        const lineHeight = 30;

        // 생존 시간
        const minutes = Math.floor(stats.gameTime / 60);
        const seconds = Math.floor(stats.gameTime % 60);
        ctx.fillText(
            `Survived: ${minutes}m ${seconds}s`,
            centerX, statY
        );

        // 도달 레벨
        ctx.fillText(`Level: ${stats.level}`, centerX, statY + lineHeight);

        // 킬 수
        ctx.fillText(`Kills: ${stats.killCount}`, centerX, statY + lineHeight * 2);

        // 총 경험치
        ctx.fillText(`Total EXP: ${stats.totalExp}`, centerX, statY + lineHeight * 3);

        // "Press Enter" (깜빡임)
        if (this._showText) {
            ctx.fillStyle = '#ffd54f';
            ctx.font = `bold 18px ${UI.FONT_FAMILY}`;
            ctx.fillText('Press ENTER to return to menu', centerX, centerY + 120);
        }
    }
}
