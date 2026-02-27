/**
 * 레벨업 선택 UI (LevelUpUI)
 * - 레벨업 시 게임을 일시정지하고 선택지를 보여준다
 * - 마우스 클릭으로 무기/패시브를 선택한다
 * - 선택 완료 후 게임을 재개한다
 */
import { UI } from '../data/config.js';

export class LevelUpUI {
    constructor() {
        this.choices = [];          // 현재 표시중인 선택지
        this.hoveredIndex = -1;     // 마우스가 올라간 선택지 인덱스
        this._choiceRects = [];     // 선택지 버튼 영역 (클릭 판정용)
    }

    /**
     * 선택지를 설정한다 (레벨업 시 Game에서 호출)
     * @param {Array} choices - ExpSystem이 생성한 선택지 배열
     */
    setChoices(choices) {
        this.choices = choices;
        this.hoveredIndex = -1;
        this._choiceRects = [];
    }

    /**
     * 마우스 입력을 처리하여 선택을 감지한다
     * @param {Input} input - 입력 시스템
     * @param {number} canvasWidth - 캔버스 너비
     * @param {number} canvasHeight - 캔버스 높이
     * @returns {number} 선택된 인덱스 (-1이면 선택 안 함)
     */
    update(input, canvasWidth, canvasHeight) {
        // 선택지 영역 계산 (렌더와 동일한 좌표)
        this._calculateRects(canvasWidth, canvasHeight);

        // 마우스 호버 체크
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

        // 마우스 클릭 체크
        if (input.mouseClicked && this.hoveredIndex >= 0) {
            return this.hoveredIndex;
        }

        return -1;
    }

    /**
     * 레벨업 UI를 화면에 그린다
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} canvasWidth
     * @param {number} canvasHeight
     */
    render(ctx, canvasWidth, canvasHeight) {
        // 어두운 오버레이 (배경 어둡게)
        ctx.fillStyle = UI.OVERLAY_COLOR;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);

        // "LEVEL UP!" 타이틀
        ctx.fillStyle = '#ffd54f';
        ctx.font = `bold 36px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('LEVEL UP!', canvasWidth / 2, canvasHeight / 2 - 140);

        ctx.fillStyle = '#ffffff';
        ctx.font = `16px ${UI.FONT_FAMILY}`;
        ctx.fillText('Choose an upgrade:', canvasWidth / 2, canvasHeight / 2 - 105);

        // 선택지 영역 계산
        this._calculateRects(canvasWidth, canvasHeight);

        // 선택지 카드 그리기
        for (let i = 0; i < this.choices.length; i++) {
            const choice = this.choices[i];
            const rect = this._choiceRects[i];
            const isHovered = (i === this.hoveredIndex);

            this._drawChoiceCard(ctx, choice, rect, isHovered);
        }
    }

    /**
     * 선택지 카드를 그린다
     */
    _drawChoiceCard(ctx, choice, rect, isHovered) {
        ctx.save();

        // 카드 배경
        if (isHovered) {
            ctx.fillStyle = '#37474f';
            ctx.shadowColor = choice.color;
            ctx.shadowBlur = 15;
        } else {
            ctx.fillStyle = '#263238';
        }

        // 둥근 모서리 사각형
        this._roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 8);
        ctx.fill();

        // 테두리
        ctx.strokeStyle = isHovered ? choice.color : '#546e7a';
        ctx.lineWidth = isHovered ? 2 : 1;
        this._roundRect(ctx, rect.x, rect.y, rect.width, rect.height, 8);
        ctx.stroke();

        ctx.shadowBlur = 0;

        // 왼쪽 색상 바
        ctx.fillStyle = choice.color;
        ctx.fillRect(rect.x, rect.y + 4, 4, rect.height - 8);

        // 이름
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 16px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.fillText(choice.name, rect.x + 16, rect.y + 28);

        // 설명
        ctx.fillStyle = '#b0bec5';
        ctx.font = `13px ${UI.FONT_FAMILY}`;
        ctx.fillText(choice.description, rect.x + 16, rect.y + 50);

        ctx.restore();
    }

    /**
     * 선택지 영역 좌표를 계산한다
     */
    _calculateRects(canvasWidth, canvasHeight) {
        this._choiceRects = [];

        const cardWidth = 300;
        const cardHeight = 65;
        const gap = 12;
        const totalHeight = this.choices.length * (cardHeight + gap) - gap;
        const startY = canvasHeight / 2 - totalHeight / 2 - 20;

        for (let i = 0; i < this.choices.length; i++) {
            this._choiceRects.push({
                x: canvasWidth / 2 - cardWidth / 2,
                y: startY + i * (cardHeight + gap),
                width: cardWidth,
                height: cardHeight,
            });
        }
    }

    /**
     * 둥근 모서리 사각형 경로를 그린다 (유틸리티)
     */
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
