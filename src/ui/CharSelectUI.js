/**
 * 캐릭터 선택 UI (CharSelectUI)
 * - 게임 시작 전 캐릭터를 선택하는 화면
 * - 좌우 방향키 또는 1/2/3 키로 선택
 * - Enter 또는 Space로 확정
 */
import { CHARACTERS } from '../data/config.js';
import { UI } from '../data/config.js';

export class CharSelectUI {
    constructor() {
        this._characterIds = Object.keys(CHARACTERS);
        this.selectedIndex = 0;
    }

    /**
     * 입력을 처리하고 선택된 캐릭터 ID를 반환한다
     * @param {Input} input
     * @returns {string|null} 선택 확정 시 캐릭터 ID, 아니면 null
     */
    update(input) {
        // 좌우 방향키로 선택 이동
        if (input.isKeyPressed('ArrowLeft') || input.isKeyPressed('KeyA')) {
            this.selectedIndex = (this.selectedIndex - 1 + this._characterIds.length) % this._characterIds.length;
        }
        if (input.isKeyPressed('ArrowRight') || input.isKeyPressed('KeyD')) {
            this.selectedIndex = (this.selectedIndex + 1) % this._characterIds.length;
        }

        // 숫자키로 직접 선택
        if (input.isKeyPressed('Digit1')) this.selectedIndex = 0;
        if (input.isKeyPressed('Digit2') && this._characterIds.length > 1) this.selectedIndex = 1;
        if (input.isKeyPressed('Digit3') && this._characterIds.length > 2) this.selectedIndex = 2;

        // Enter/Space로 확정
        if (input.isKeyPressed('Enter') || input.isKeyPressed('Space')) {
            return this._characterIds[this.selectedIndex];
        }

        return null;
    }

    /**
     * 캐릭터 선택 화면을 그린다
     */
    render(ctx, canvasWidth, canvasHeight) {
        // 배경
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        const centerX = canvasWidth / 2;

        // 타이틀
        ctx.fillStyle = '#ffd54f';
        ctx.font = `bold 32px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('SELECT CHARACTER', centerX, 80);

        // 캐릭터 카드들
        const cardWidth = 180;
        const cardHeight = 220;
        const gap = 20;
        const totalWidth = this._characterIds.length * cardWidth + (this._characterIds.length - 1) * gap;
        const startX = (canvasWidth - totalWidth) / 2;
        const cardY = 130;

        for (let i = 0; i < this._characterIds.length; i++) {
            const id = this._characterIds[i];
            const charConfig = CHARACTERS[id];
            const x = startX + i * (cardWidth + gap);
            const isSelected = i === this.selectedIndex;

            this._renderCard(ctx, x, cardY, cardWidth, cardHeight, charConfig, i + 1, isSelected);
        }

        // 조작 안내
        ctx.fillStyle = '#78909c';
        ctx.font = `14px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('Arrow Keys / 1-2-3 to select, ENTER to confirm', centerX, canvasHeight - 40);
    }

    _renderCard(ctx, x, y, w, h, charConfig, number, isSelected) {
        ctx.save();

        // 카드 배경
        if (isSelected) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.strokeStyle = '#ffd54f';
            ctx.lineWidth = 3;
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
            ctx.strokeStyle = '#546e7a';
            ctx.lineWidth = 1;
        }
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        const cx = x + w / 2;

        // 번호
        ctx.fillStyle = isSelected ? '#ffd54f' : '#78909c';
        ctx.font = `bold 14px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText(`[${number}]`, cx, y + 25);

        // 캐릭터 원형 (색상으로 구분)
        ctx.beginPath();
        ctx.arc(cx, y + 75, 30, 0, Math.PI * 2);
        ctx.fillStyle = charConfig.COLOR;
        ctx.fill();

        // 눈
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx + 5, y + 72, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.beginPath();
        ctx.arc(cx + 6, y + 72, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // 이름
        ctx.fillStyle = isSelected ? '#ffffff' : '#b0bec5';
        ctx.font = `bold 18px ${UI.FONT_FAMILY}`;
        ctx.fillText(charConfig.NAME, cx, y + 130);

        // 설명
        ctx.fillStyle = isSelected ? '#69f0ae' : '#78909c';
        ctx.font = `14px ${UI.FONT_FAMILY}`;
        ctx.fillText(charConfig.DESCRIPTION, cx, y + 155);

        // 시작 무기
        ctx.fillStyle = '#546e7a';
        ctx.font = `12px ${UI.FONT_FAMILY}`;
        ctx.fillText(`Start: ${charConfig.START_WEAPON}`, cx, y + 180);

        // 선택됨 표시
        if (isSelected) {
            ctx.fillStyle = '#ffd54f';
            ctx.font = `12px ${UI.FONT_FAMILY}`;
            ctx.fillText('▲', cx, y + h - 10);
        }

        ctx.restore();
    }
}
