/**
 * HUD (Heads-Up Display)
 * - 게임 플레이 중 화면에 항상 표시되는 정보
 * - 체력바, 경험치바, 레벨, 타이머, 킬 수, 보유 무기 등
 */
import { UI } from '../data/config.js';

export class HUD {
    constructor() {
        this._padding = 12;  // 화면 가장자리 여백
    }

    /**
     * HUD를 화면에 그린다
     * @param {CanvasRenderingContext2D} ctx
     * @param {Object} game - Game 인스턴스
     */
    render(ctx, game) {
        const player = game.player;
        const canvasW = game.canvas.width;

        // 경험치 바 (화면 최상단, 전체 너비)
        this._drawExpBar(ctx, player, canvasW);

        // 체력 바 (좌상단)
        this._drawHpBar(ctx, player);

        // 레벨 표시 (체력 바 옆)
        this._drawLevel(ctx, player);

        // 타이머 (상단 중앙)
        this._drawTimer(ctx, game.gameTime, canvasW);

        // 킬 카운트 (우상단)
        this._drawKillCount(ctx, player, canvasW);

        // 보유 무기 목록 (좌하단)
        this._drawWeaponList(ctx, player, game.canvas.height);
    }

    /**
     * 경험치 바를 그린다 (화면 최상단)
     */
    _drawExpBar(ctx, player, canvasWidth) {
        const barHeight = UI.EXP_BAR_HEIGHT;
        const expRatio = player.expToNext > 0 ? player.exp / player.expToNext : 0;

        // 배경
        ctx.fillStyle = UI.EXP_BAR_BG;
        ctx.fillRect(0, 0, canvasWidth, barHeight);

        // 경험치 게이지
        ctx.fillStyle = UI.EXP_BAR_COLOR;
        ctx.fillRect(0, 0, canvasWidth * expRatio, barHeight);
    }

    /**
     * 체력 바를 그린다 (좌상단)
     */
    _drawHpBar(ctx, player) {
        const x = this._padding;
        const y = UI.EXP_BAR_HEIGHT + this._padding;
        const width = UI.HP_BAR_WIDTH;
        const height = UI.HP_BAR_HEIGHT;
        const hpRatio = player.hp / player.maxHp;

        // 배경
        ctx.fillStyle = UI.HP_BAR_BG;
        ctx.fillRect(x, y, width, height);

        // 체력 색상 (체력에 따라 변화)
        if (hpRatio > 0.5) {
            ctx.fillStyle = '#66bb6a'; // 초록
        } else if (hpRatio > 0.25) {
            ctx.fillStyle = '#ffa726'; // 주황
        } else {
            ctx.fillStyle = UI.HP_BAR_COLOR; // 빨강
        }

        ctx.fillRect(x, y, width * Math.max(0, hpRatio), height);

        // 테두리
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);

        // HP 숫자
        ctx.fillStyle = UI.FONT_COLOR;
        ctx.font = `bold 11px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(
            `${Math.ceil(player.hp)} / ${player.maxHp}`,
            x + width / 2,
            y + height - 3
        );
    }

    /**
     * 레벨 표시
     */
    _drawLevel(ctx, player) {
        const x = this._padding + UI.HP_BAR_WIDTH + 10;
        const y = UI.EXP_BAR_HEIGHT + this._padding + UI.HP_BAR_HEIGHT - 2;

        ctx.fillStyle = '#69f0ae';
        ctx.font = `bold 14px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.fillText(`Lv.${player.level}`, x, y);
    }

    /**
     * 게임 타이머를 그린다 (상단 중앙)
     */
    _drawTimer(ctx, gameTime, canvasWidth) {
        const minutes = Math.floor(gameTime / 60);
        const seconds = Math.floor(gameTime % 60);
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        ctx.fillStyle = UI.FONT_COLOR;
        ctx.font = `bold 18px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(timeStr, canvasWidth / 2, UI.EXP_BAR_HEIGHT + 24);
    }

    /**
     * 킬 카운트를 그린다 (우상단)
     */
    _drawKillCount(ctx, player, canvasWidth) {
        const x = canvasWidth - this._padding;
        const y = UI.EXP_BAR_HEIGHT + 24;

        ctx.fillStyle = UI.FONT_COLOR;
        ctx.font = `14px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'right';
        ctx.fillText(`Kills: ${player.killCount}`, x, y);
    }

    /**
     * 보유 무기 목록을 그린다 (좌하단)
     */
    _drawWeaponList(ctx, player, canvasHeight) {
        const x = this._padding;
        let y = canvasHeight - this._padding;

        ctx.font = `12px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'left';

        // 무기 목록을 아래에서 위로 표시
        for (let i = player.weapons.length - 1; i >= 0; i--) {
            const weapon = player.weapons[i];
            if (weapon.isEvolved) {
                // 진화 무기는 금색 ★ 표시
                ctx.fillStyle = '#ffd700';
                ctx.fillText(`★ ${weapon.name}`, x, y);
            } else {
                ctx.fillStyle = '#90a4ae';
                ctx.fillText(`${weapon.name} Lv.${weapon.level}`, x, y);
            }
            y -= 18;
        }
    }
}
