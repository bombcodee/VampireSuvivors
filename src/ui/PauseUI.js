/**
 * 일시정지 UI (PauseUI)
 * - ESC로 일시정지 시 표시되는 정보 화면
 * - 왼쪽: 보유 무기 스탯 + 패시브 목록
 * - 오른쪽: 진화 조합표 (조건 충족 시 초록색 체크)
 */
import { UI, WEAPONS, PASSIVES, EVOLUTIONS, UPGRADES } from '../data/config.js';

export class PauseUI {
    /**
     * 일시정지 화면을 그린다
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} canvasW - 캔버스 너비
     * @param {number} canvasH - 캔버스 높이
     * @param {Object} player - Player 인스턴스
     * @param {Object} [upgradeSystem] - UpgradeSystem 인스턴스 (영구 업그레이드 표시용)
     */
    render(ctx, canvasW, canvasH, player, upgradeSystem) {
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

        // 왼쪽: 무기 스탯 + 패시브 + 영구 업그레이드
        this._renderWeaponStats(ctx, player, canvasW, upgradeSystem);

        // 오른쪽: 진화 조합표
        this._renderEvolutionGuide(ctx, player, canvasW, canvasH);
    }

    /**
     * 무기 스탯 + 패시브 + 영구 업그레이드 목록 (왼쪽)
     */
    _renderWeaponStats(ctx, player, canvasW, upgradeSystem) {
        const x = 30;
        let y = 110;
        const lineHeight = 16;
        const halfW = canvasW / 2 - 20;

        // 패널 높이 동적 계산
        const weaponLines = Math.max(1, player.weapons.length) * 2; // 이름 + 스탯
        const passiveCount = Object.values(PASSIVES).filter(
            (_, i) => (player.passiveLevels[Object.keys(PASSIVES)[i]] || 0) > 0
        ).length;
        const passiveLines = Math.max(1, passiveCount);
        const upgradeCount = upgradeSystem
            ? Object.keys(UPGRADES).filter(id => upgradeSystem.getLevel(id) > 0).length
            : 0;
        const upgradeLines = upgradeCount > 0 ? upgradeCount + 2 : 0; // +2: 타이틀 + 간격
        const totalLines = 2 + weaponLines + 2 + passiveLines + upgradeLines;
        const panelHeight = totalLines * lineHeight + 40;

        // 패널 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x - 10, y - 20, halfW, panelHeight);

        // 섹션 타이틀: 무기
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold 13px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.fillText('[ Weapons ]', x, y);
        y += lineHeight + 2;

        // 무기 목록
        for (const weapon of player.weapons) {
            if (weapon.isEvolved) {
                ctx.fillStyle = '#ffd700';
                ctx.font = `bold 12px ${UI.FONT_FAMILY}`;
                ctx.fillText(`★ ${weapon.name}`, x, y);
            } else {
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold 12px ${UI.FONT_FAMILY}`;
                ctx.fillText(`${weapon.name} Lv.${weapon.level}`, x, y);
            }
            y += lineHeight;

            ctx.fillStyle = '#b0bec5';
            ctx.font = `11px ${UI.FONT_FAMILY}`;
            const stats = this._getWeaponStatsText(weapon);
            ctx.fillText(stats, x + 10, y);
            y += lineHeight + 2;
        }

        if (player.weapons.length === 0) {
            ctx.fillStyle = '#555555';
            ctx.font = `11px ${UI.FONT_FAMILY}`;
            ctx.fillText('(무기 없음)', x + 10, y);
            y += lineHeight;
        }

        // 섹션 타이틀: 패시브
        y += 6;
        ctx.fillStyle = '#81d4fa';
        ctx.font = `bold 13px ${UI.FONT_FAMILY}`;
        ctx.fillText('[ Passives ]', x, y);
        y += lineHeight + 2;

        let hasPassive = false;
        for (const [passiveId, config] of Object.entries(PASSIVES)) {
            const level = player.passiveLevels[passiveId] || 0;
            if (level <= 0) continue;
            hasPassive = true;

            ctx.fillStyle = config.COLOR || '#ffffff';
            ctx.font = `12px ${UI.FONT_FAMILY}`;
            ctx.fillText(`${config.NAME} Lv.${level}`, x + 10, y);

            ctx.fillStyle = '#78909c';
            ctx.font = `11px ${UI.FONT_FAMILY}`;
            const effectText = this._getPassiveEffectText(config, level);
            ctx.fillText(effectText, x + 130, y);
            y += lineHeight;
        }

        if (!hasPassive) {
            ctx.fillStyle = '#555555';
            ctx.font = `11px ${UI.FONT_FAMILY}`;
            ctx.fillText('(패시브 없음)', x + 10, y);
            y += lineHeight;
        }

        // 섹션: 영구 업그레이드 (보유 중인 것만)
        if (upgradeSystem && upgradeCount > 0) {
            y += 6;
            ctx.fillStyle = '#ffd54f';
            ctx.font = `bold 13px ${UI.FONT_FAMILY}`;
            ctx.fillText('[ Upgrades ]', x, y);
            y += lineHeight + 2;

            for (const [id, cfg] of Object.entries(UPGRADES)) {
                const level = upgradeSystem.getLevel(id);
                if (level <= 0) continue;

                ctx.fillStyle = cfg.COLOR || '#ffffff';
                ctx.font = `12px ${UI.FONT_FAMILY}`;
                ctx.fillText(`${cfg.NAME} Lv.${level}`, x + 10, y);

                ctx.fillStyle = '#78909c';
                ctx.font = `11px ${UI.FONT_FAMILY}`;
                const effectText = this._getUpgradeEffectText(cfg, level);
                ctx.fillText(effectText, x + 130, y);
                y += lineHeight;
            }
        }
    }

    /**
     * 진화 조합표 (오른쪽)
     */
    _renderEvolutionGuide(ctx, player, canvasW, canvasH) {
        const halfW = canvasW / 2;
        const x = halfW + 20;
        let y = 110;
        const lineHeight = 15;
        const entryGap = 4;

        // 패널 배경 (진화 8종에 맞춰 높이 계산)
        const evoCount = Object.keys(EVOLUTIONS).length;
        const panelHeight = 28 + evoCount * (lineHeight * 3 + entryGap) + 10;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x - 10, y - 20, halfW - 30, panelHeight);

        // 섹션 타이틀
        ctx.fillStyle = '#ffd700';
        ctx.font = `bold 14px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.fillText('[ Evolution Guide ]', x, y);
        y += lineHeight + 6;

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

            // 진화 무기 이름
            if (alreadyEvolved) {
                ctx.fillStyle = '#ffd700';
                ctx.font = `bold 12px ${UI.FONT_FAMILY}`;
                ctx.fillText(`★ ${evoCfg.NAME}  (완료!)`, x, y);
            } else {
                ctx.fillStyle = evoCfg.COLOR || '#ffffff';
                ctx.font = `bold 12px ${UI.FONT_FAMILY}`;
                ctx.fillText(evoCfg.NAME, x, y);
            }
            y += lineHeight;

            // 기본 무기 조건 (진화 완료 시에도 현재 상태 그대로 표시)
            const weaponCheck = (alreadyEvolved || weaponReady) ? '✓' : '✗';
            const weaponColor = (alreadyEvolved || weaponReady) ? '#69f0ae' : '#ef9a9a';
            ctx.fillStyle = weaponColor;
            ctx.font = `11px ${UI.FONT_FAMILY}`;
            ctx.fillText(`${weaponCheck} ${baseWeaponCfg.NAME} Lv.MAX`, x + 10, y);
            y += lineHeight;

            // 패시브 조건
            const passiveCheck = (alreadyEvolved || passiveReady) ? '✓' : '✗';
            const passiveColor = (alreadyEvolved || passiveReady) ? '#69f0ae' : '#ef9a9a';
            ctx.fillStyle = passiveColor;
            ctx.fillText(`${passiveCheck} ${passiveCfg.NAME}`, x + 10, y);
            y += lineHeight + entryGap;
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
     * 영구 업그레이드 효과를 텍스트로 반환한다
     */
    _getUpgradeEffectText(cfg, level) {
        let totalBonus = 0;
        for (let i = 0; i < level; i++) {
            totalBonus += cfg.VALUES[i];
        }

        if (cfg.TYPE === 'multiply') {
            return `+${Math.round(totalBonus * 100)}%`;
        } else {
            return `+${totalBonus}`;
        }
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
