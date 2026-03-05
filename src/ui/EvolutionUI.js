/**
 * 진화 UI (EvolutionUI)
 * - 상자를 열었을 때 진화 선택지를 보여준다
 * - LevelUpUI 패턴 기반, 금색 테마
 * - 진화 가능 무기가 있으면 진화 카드 표시
 * - 없으면 폴백 보상 카드 표시
 */
import { UI } from '../data/config.js';

export class EvolutionUI {
    constructor() {
        this.evolutions = [];       // 진화 가능 목록
        this.isFallback = false;    // 폴백 보상 모드인지
        this.hoveredIndex = -1;
        this._choiceRects = [];
    }

    /**
     * 진화 선택지를 설정한다
     * @param {Array} evolutions - EvolutionSystem이 반환한 진화 목록
     */
    setEvolutions(evolutions) {
        this.evolutions = evolutions;
        this.isFallback = evolutions.length === 0;
        this.hoveredIndex = -1;
        this._choiceRects = [];
    }

    /**
     * 마우스 입력을 처리한다
     * @returns {number} 선택된 인덱스 (-1이면 미선택, 폴백이면 0)
     */
    update(input, canvasWidth, canvasHeight) {
        this._calculateRects(canvasWidth, canvasHeight);

        this.hoveredIndex = -1;
        for (let i = 0; i < this._choiceRects.length; i++) {
            const rect = this._choiceRects[i];
            if (
                input.mouseX >= rect.x &&
                input.mouseX <= rect.x + rect.width &&
                input.mouseY >= rect.y &&
                input.mouseY <= rect.y + rect.height
            ) {
                this.hoveredIndex = i;
                break;
            }
        }

        if (input.mouseClicked && this.hoveredIndex >= 0) {
            return this.hoveredIndex;
        }

        return -1;
    }

    render(ctx, canvasWidth, canvasHeight) {
        // 어두운 오버레이
        ctx.fillStyle = UI.OVERLAY_COLOR;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // 금색 타이틀
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold 36px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';

        if (this.isFallback) {
            ctx.fillText('TREASURE CHEST!', canvasWidth / 2, canvasHeight / 2 - 100);
        } else {
            ctx.fillText('WEAPON EVOLUTION!', canvasWidth / 2, canvasHeight / 2 - 140);
            ctx.fillStyle = '#fff9c4';
            ctx.font = `16px ${UI.FONT_FAMILY}`;
            ctx.fillText('Choose a weapon to evolve:', canvasWidth / 2, canvasHeight / 2 - 105);
        }

        this._calculateRects(canvasWidth, canvasHeight);

        const items = this.isFallback ? [this._getFallbackCard()] : this.evolutions;

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const rect = this._choiceRects[i];
            const isHovered = (i === this.hoveredIndex);
            this._drawCard(ctx, item, rect, isHovered);
        }
    }

    _drawCard(ctx, item, rect, isHovered) {
        ctx.save();

        // 카드 배경 (금색 테마)
        if (isHovered) {
            ctx.fillStyle = '#4a3800';
            ctx.shadowColor = '#ffd700';
            ctx.shadowBlur = 20;
        } else {
            ctx.fillStyle = '#2a2000';
        }

        this._roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 8);
        ctx.fill();

        // 테두리 (금색)
        ctx.strokeStyle = isHovered ? '#ffd700' : '#8b7500';
        ctx.lineWidth = isHovered ? 2 : 1;
        this._roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 8);
        ctx.stroke();

        ctx.shadowBlur = 0;

        // 왼쪽 색상 바
        const color = item.config?.COLOR || '#ffd700';
        ctx.fillStyle = color;
        ctx.fillRect(rect.x, rect.y + 4, 4, rect.height - 8);

        // 이름
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 16px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'left';

        if (this.isFallback) {
            ctx.fillText(item.name, rect.x + 16, rect.y + 28);
        } else {
            // "MagicWand → Holy Wand" 형식
            const baseName = item.baseWeapon?.name || '???';
            const evoName = item.config.NAME;
            ctx.fillText(`${baseName}  →  ${evoName}`, rect.x + 16, rect.y + 28);
        }

        // 설명
        ctx.fillStyle = '#b0bec5';
        ctx.font = `13px ${UI.FONT_FAMILY}`;
        const desc = this.isFallback ? item.description : item.config.DESCRIPTION;
        ctx.fillText(desc, rect.x + 16, rect.y + 50);

        ctx.restore();
    }

    _getFallbackCard() {
        return {
            name: 'Treasure Reward',
            description: 'HP +30 회복, EXP +50 획득',
            config: { COLOR: '#ffd700' },
        };
    }

    _calculateRects(canvasWidth, canvasHeight) {
        this._choiceRects = [];

        const items = this.isFallback ? [this._getFallbackCard()] : this.evolutions;
        const cardWidth = 340;
        const cardHeight = 65;
        const gap = 12;
        const totalHeight = items.length * (cardHeight + gap) - gap;
        const startY = canvasHeight / 2 - totalHeight / 2 - 20;

        for (let i = 0; i < items.length; i++) {
            this._choiceRects.push({
                x: canvasWidth / 2 - cardWidth / 2,
                y: startY + i * (cardHeight + gap),
                width: cardWidth,
                height: cardHeight,
            });
        }
    }

    _roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}
