/**
 * 일시정지 UI (PauseUI)
 * - ESC로 일시정지 시 표시되는 정보 화면
 * - 왼쪽: 보유 무기 스탯 + 패시브 목록
 * - 오른쪽: 진화 조합표 (조건 충족 시 초록색 체크)
 */
import { UI, WEAPONS, PASSIVES, EVOLUTIONS } from '../data/config.js';

export class PauseUI {
    /**
     * 일시정지 화면을 그린다
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} canvasW - 캔버스 너비
     * @param {number} canvasH - 캔버스 높이
     * @param {Object} player - Player 인스턴스
     */
    render(ctx, canvasW, canvasH, player) {
        // 어두운 오버레이
        ctx.fillStyle = UI.OVERLAY_COLOR;
        ctx.fillRect(0, 0, canvasW, canvasH);

        // 타이틀
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 32px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', canvasW / 2, 50);

        ctx.font = `14px ${UI.FONT_FAMILY}`;
        ctx.fillStyle = '#78909c';
        ctx.fillText('Press ESC to resume', canvasW / 2, 75);

        // 왼쪽: 무기 스탯 + 패시브
        this._renderWeaponStats(ctx, player, canvasW);

        // 오른쪽: 진화 조합표
        this._renderEvolutionGuide(ctx, player, canvasW, canvasH);
    }

    /**
     * 무기 스탯 + 패시브 목록 (왼쪽)
     */
    _renderWeaponStats(ctx, player, canvasW) {
        const x = 30;
        let y = 110;
        const lineHeight = 18;
        const halfW = canvasW / 2 - 20;

        // 패널 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x - 10, y - 20, halfW, 340);

        // 섹션 타이틀: 무기
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold 14px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.fillText('[ Weapons ]', x, y);
        y += lineHeight + 4;

        // 무기 목록
        for (const weapon of player.weapons) {
            // 무기 이름 + 레벨
            if (weapon.isEvolved) {
                ctx.fillStyle = '#ffd700';
                ctx.font = `bold 13px ${UI.FONT_FAMILY}`;
                ctx.fillText(`★ ${weapon.name}`, x, y);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold 13px ${UI.FONT_FAMILY}`;
                ctx.fillText(`${weapon.name} Lv.${weapon.level}`, x, y);
            }
            y += lineHeight;

            // 스탯 (DMG, CD + 특수 스탯 1~2개)
            ctx.fillStyle = '#b0bec5';
            ctx.font = `12px ${UI.FONT_FAMILY}`;
            const stats = this._getWeaponStatsText(weapon);
            ctx.fillText(stats, x + 10, y);
            y += lineHeight + 2;
        }

        if (player.weapons.length === 0) {
            ctx.fillStyle = '#555555';
            ctx.font = `12px ${UI.FONT_FAMILY}`;
            ctx.fillText('(무기 없음)', x + 10, y);
            y += lineHeight;
        }

        // 섹션 타이틀: 패시브
        y += 8;
        ctx.fillStyle = '#81d4fa';
        ctx.font = `bold 14px ${UI.FONT_FAMILY}`;
        ctx.fillText('[ Passives ]', x, y);
        y += lineHeight + 4;

        // 패시브 목록
        let hasPassive = false;
        for (const [passiveId, config] of Object.entries(PASSIVES)) {
            const level = player.passiveLevels[passiveId] || 0;
            if (level <= 0) continue;
            hasPassive = true;

            ctx.fillStyle = config.COLOR || '#ffffff';
            ctx.font = `13px ${UI.FONT_FAMILY}`;
            ctx.fillText(`${config.NAME} Lv.${level}`, x + 10, y);

            // 효과 설명
            ctx.fillStyle = '#78909c';
            ctx.font = `11px ${UI.FONT_FAMILY}`;
            const effectText = this._getPassiveEffectText(config, level);
            ctx.fillText(effectText, x + 130, y);
            y += lineHeight;
        }

        if (!hasPassive) {
            ctx.fillStyle = '#555555';
            ctx.font = `12px ${UI.FONT_FAMILY}`;
            ctx.fillText('(패시브 없음)', x + 10, y);
        }
    }

    /**
     * 진화 조합표 (오른쪽)
     */
    _renderEvolutionGuide(ctx, player, canvasW, canvasH) {
        const halfW = canvasW / 2;
        const x = halfW + 20;
        let y = 110;
        const lineHeight = 18;

        // 패널 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x - 10, y - 20, halfW - 30, 340);

        // 섹션 타이틀
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold 14px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.fillText('[ Evolution Guide ]', x, y);
        y += lineHeight + 8;

        // 각 진화 조합 표시
        for (const [evoId, evoCfg] of Object.entries(EVOLUTIONS)) {
            const baseWeaponCfg = WEAPONS[evoCfg.BASE_WEAPON];
            const passiveCfg = PASSIVES[evoCfg.REQUIRED_PASSIVE];
            if (!baseWeaponCfg || !passiveCfg) continue;

            // 조건 충족 여부 체크
            const baseWeapon = player.getWeapon(evoCfg.BASE_WEAPON);
            const maxLevel = baseWeaponCfg.MAX_LEVEL || 5;
            const weaponReady = baseWeapon && baseWeapon.level >= maxLevel;
            const passiveReady = (player.passiveLevels[evoCfg.REQUIRED_PASSIVE] || 0) > 0;
            const alreadyEvolved = !!player.getWeapon(evoId);

            // 진화 무기 이름 (이미 진화했으면 금색)
            if (alreadyEvolved) {
                ctx.fillStyle = '#ffd700';
                ctx.font = `bold 13px ${UI.FONT_FAMILY}`;
                ctx.fillText(`★ ${evoCfg.NAME}  (완료!)`, x, y);
            } else {
                ctx.fillStyle = evoCfg.COLOR || '#ffffff';
                ctx.font = `bold 13px ${UI.FONT_FAMILY}`;
                ctx.fillText(evoCfg.NAME, x, y);
            }
            y += lineHeight;

            // 기본 무기 조건
            const weaponCheck = weaponReady ? '✓' : '✗';
            const weaponColor = weaponReady ? '#69f0ae' : '#ef9a9a';
            ctx.fillStyle = weaponColor;
            ctx.font = `12px ${UI.FONT_FAMILY}`;
            ctx.fillText(`${weaponCheck} ${baseWeaponCfg.NAME} Lv.MAX`, x + 10, y);
            y += lineHeight;

            // 패시브 조건
            const passiveCheck = passiveReady ? '✓' : '✗';
            const passiveColor = passiveReady ? '#69f0ae' : '#ef9a9a';
            ctx.fillStyle = passiveColor;
            ctx.fillText(`${passiveCheck} ${passiveCfg.NAME}`, x + 10, y);
            y += lineHeight + 8;
        }
    }

    /**
     * 무기의 주요 스탯을 텍스트로 반환한다
     */
    _getWeaponStatsText(weapon) {
        const parts = [];

        // 데미지는 모든 무기에 공통
        if (weapon.damage !== undefined) {
            parts.push(`DMG: ${weapon.damage}`);
        }
        // 쿨다운도 공통
        if (weapon.cooldown !== undefined) {
            parts.push(`CD: ${weapon.cooldown}s`);
        }
        // 특수 스탯 (무기 타입에 따라 다름)
        if (weapon.count !== undefined && weapon.count > 1) {
            parts.push(`x${weapon.count}`);
        }
        if (weapon.radius !== undefined) {
            parts.push(`범위: ${weapon.radius}`);
        }
        if (weapon.range !== undefined) {
            parts.push(`사거리: ${weapon.range}`);
        }
        if (weapon.pierce !== undefined) {
            parts.push(`관통: ${weapon.pierce}`);
        }
        if (weapon.lifesteal !== undefined) {
            parts.push(`흡혈: ${weapon.lifesteal}`);
        }

        return parts.join('  ');
    }

    /**
     * 패시브 효과를 텍스트로 반환한다
     */
    _getPassiveEffectText(config, level) {
        const effect = config.EFFECT;
        const totalValue = effect.value * level;

        switch (effect.stat) {
            case 'speedMultiplier':
                return `SPD +${Math.round(totalValue * 100)}%`;
            case 'maxHp':
                return `HP +${totalValue}`;
            case 'pickupMultiplier':
                return `PICKUP +${Math.round(totalValue * 100)}%`;
            case 'armor':
                return `DMG -${totalValue}`;
            default:
                return '';
        }
    }
}
