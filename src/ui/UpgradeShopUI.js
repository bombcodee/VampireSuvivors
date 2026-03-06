/**
 * 영구 업그레이드 상점 UI (UpgradeShopUI)
 * - 메인 메뉴에서 S키로 진입
 * - ↑↓로 선택, Enter로 구매, Escape로 메뉴 복귀
 * - 보유 골드와 6종 업그레이드 목록을 표시한다
 */
import { UI } from '../data/config.js';

export class UpgradeShopUI {
    constructor() {
        this.selectedIndex = 0;
        this._items = [];       // UpgradeSystem.getAll() 결과 캐시
        this._gold = 0;         // 현재 보유 골드 (표시용)
        this._flashTimer = 0;   // 구매 성공 시 깜빡임 효과
        this._flashIndex = -1;  // 깜빡임 대상 인덱스
    }

    /**
     * 상점 데이터를 새로고침한다
     * @param {Array} items - UpgradeSystem.getAll() 결과
     * @param {number} gold - 보유 골드
     */
    refresh(items, gold) {
        this._items = items;
        this._gold = gold;
    }

    /**
     * 입력 처리
     * @param {Input} input
     * @param {number} dt - 델타타임
     * @returns {{ action: string, upgradeId?: string }}
     *   action: 'none' | 'purchase' | 'close'
     */
    update(input, dt) {
        // 깜빡임 타이머
        if (this._flashTimer > 0) {
            this._flashTimer -= dt;
            if (this._flashTimer <= 0) {
                this._flashIndex = -1;
            }
        }

        // Escape → 메뉴로 복귀
        if (input.isKeyPressed('Escape')) {
            return { action: 'close' };
        }

        // ↑↓ 선택 이동
        if (input.isKeyPressed('ArrowUp') || input.isKeyPressed('KeyW')) {
            this.selectedIndex = (this.selectedIndex - 1 + this._items.length) % this._items.length;
        }
        if (input.isKeyPressed('ArrowDown') || input.isKeyPressed('KeyS')) {
            this.selectedIndex = (this.selectedIndex + 1) % this._items.length;
        }

        // Enter/Space → 구매 시도
        if (input.isKeyPressed('Enter') || input.isKeyPressed('Space')) {
            const item = this._items[this.selectedIndex];
            if (item && item.cost !== null && this._gold >= item.cost) {
                this._flashTimer = 0.3;
                this._flashIndex = this.selectedIndex;
                return { action: 'purchase', upgradeId: item.id };
            }
        }

        return { action: 'none' };
    }

    /**
     * 상점 화면을 그린다
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
        ctx.fillText('UPGRADE SHOP', centerX, 55);

        // 보유 골드
        ctx.fillStyle = '#ffd54f';
        ctx.font = `bold 20px ${UI.FONT_FAMILY}`;
        ctx.fillText(`Gold: ${this._gold}`, centerX, 90);

        // 업그레이드 목록
        const rowHeight = 64;
        const listWidth = 500;
        const startX = (canvasWidth - listWidth) / 2;
        const startY = 120;

        for (let i = 0; i < this._items.length; i++) {
            const item = this._items[i];
            const y = startY + i * rowHeight;
            const isSelected = i === this.selectedIndex;
            const isFlashing = i === this._flashIndex && this._flashTimer > 0;
            const canAfford = item.cost !== null && this._gold >= item.cost;
            const isMax = item.cost === null;

            this._renderRow(ctx, startX, y, listWidth, rowHeight - 4, item, isSelected, isFlashing, canAfford, isMax);
        }

        // 조작 안내
        ctx.fillStyle = '#78909c';
        ctx.font = `14px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('↑↓ Select    ENTER Purchase    ESC Back', centerX, canvasHeight - 30);
    }

    /**
     * 업그레이드 1줄을 그린다
     */
    _renderRow(ctx, x, y, w, h, item, isSelected, isFlashing, canAfford, isMax) {
        ctx.save();

        // 행 배경
        if (isFlashing) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.2)';
        } else if (isSelected) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        }
        ctx.fillRect(x, y, w, h);

        // 선택 테두리
        if (isSelected) {
            ctx.strokeStyle = '#ffd54f';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, w, h);
        }

        const cy = y + h / 2;

        // 색상 아이콘 (원)
        ctx.beginPath();
        ctx.arc(x + 25, cy, 10, 0, Math.PI * 2);
        ctx.fillStyle = item.color;
        ctx.fill();

        // 레벨 바 (아이콘 안에 텍스트)
        ctx.fillStyle = '#1a1a2e';
        ctx.font = `bold 10px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.level, x + 25, cy);

        // 이름
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';
        ctx.fillStyle = isSelected ? '#ffffff' : '#b0bec5';
        ctx.font = `bold 16px ${UI.FONT_FAMILY}`;
        ctx.fillText(item.name, x + 50, cy - 10);

        // 설명
        ctx.fillStyle = isSelected ? '#90a4ae' : '#546e7a';
        ctx.font = `12px ${UI.FONT_FAMILY}`;
        ctx.fillText(item.description, x + 50, cy + 10);

        // 레벨 표시
        ctx.textAlign = 'right';
        if (isMax) {
            ctx.fillStyle = '#ffd54f';
            ctx.font = `bold 14px ${UI.FONT_FAMILY}`;
            ctx.fillText('MAX', x + w - 20, cy - 8);
            // 레벨 바
            this._renderLevelBar(ctx, x + w - 100, cy + 6, 80, 8, item.level, item.maxLevel);
        } else {
            // 비용
            ctx.fillStyle = canAfford ? '#ffd54f' : '#546e7a';
            ctx.font = `bold 14px ${UI.FONT_FAMILY}`;
            ctx.fillText(`${item.cost} G`, x + w - 20, cy - 8);
            // 레벨 바
            this._renderLevelBar(ctx, x + w - 100, cy + 6, 80, 8, item.level, item.maxLevel);
        }

        ctx.restore();
    }

    /**
     * 레벨 진행 바를 그린다
     */
    _renderLevelBar(ctx, x, y, w, h, level, maxLevel) {
        // 배경
        ctx.fillStyle = '#2e2e2e';
        ctx.fillRect(x, y, w, h);

        // 칸 나누기
        const segmentWidth = w / maxLevel;
        for (let i = 0; i < maxLevel; i++) {
            if (i < level) {
                ctx.fillStyle = '#ffd54f';
            } else {
                ctx.fillStyle = '#424242';
            }
            ctx.fillRect(x + i * segmentWidth + 1, y + 1, segmentWidth - 2, h - 2);
        }
    }
}
