/**
 * 진화 시스템 (EvolutionSystem)
 * - 상자 수집 시 진화 가능 무기를 체크한다
 * - 조건: 기본 무기 MAX 레벨 + 필요 패시브 보유
 * - 진화 실행: 기존 무기를 진화 무기로 교체
 * - 조건 불충족 시 폴백 보상 (체력 회복 + 경험치)
 */
import { EVOLUTIONS, WEAPONS, CHEST } from '../data/config.js';
import { HolyWand } from '../weapons/HolyWand.js';
import { SoulEater } from '../weapons/SoulEater.js';
import { BloodyTear } from '../weapons/BloodyTear.js';
import { ThousandEdge } from '../weapons/ThousandEdge.js';
import { LaBorra } from '../weapons/LaBorra.js';
import { UnholyVespers } from '../weapons/UnholyVespers.js';
import { Hellfire } from '../weapons/Hellfire.js';
import { ThunderLoop } from '../weapons/ThunderLoop.js';

// 진화 ID → 진화 무기 클래스 매핑
const EVOLVED_CLASSES = {
    'HOLY_WAND': HolyWand,
    'SOUL_EATER': SoulEater,
    'BLOODY_TEAR': BloodyTear,
    'THOUSAND_EDGE': ThousandEdge,
    'LA_BORRA': LaBorra,
    'UNHOLY_VESPERS': UnholyVespers,
    'HELLFIRE': Hellfire,
    'THUNDER_LOOP': ThunderLoop,
};

export class EvolutionSystem {
    /**
     * 플레이어가 진화 가능한 무기 목록을 반환한다
     * @param {Object} player - Player 인스턴스
     * @returns {Array} 진화 가능한 목록 [{ id, config, baseWeapon }, ...]
     */
    getEligibleEvolutions(player) {
        const eligible = [];

        for (const [evoId, evoCfg] of Object.entries(EVOLUTIONS)) {
            // 이미 진화 무기를 보유 중이면 스킵
            if (player.getWeapon(evoId)) continue;

            // 기본 무기 보유 확인
            const baseWeapon = player.getWeapon(evoCfg.BASE_WEAPON);
            if (!baseWeapon) continue;

            // 기본 무기가 MAX 레벨인지 확인
            const maxLevel = WEAPONS[evoCfg.BASE_WEAPON]?.MAX_LEVEL || 5;
            if (baseWeapon.level < maxLevel) continue;

            // 필요 패시브 보유 확인
            const passiveLevel = player.passiveLevels[evoCfg.REQUIRED_PASSIVE] || 0;
            if (passiveLevel <= 0) continue;

            eligible.push({
                id: evoId,
                config: evoCfg,
                baseWeapon: baseWeapon,
            });
        }

        return eligible;
    }

    /**
     * 무기를 진화시킨다 (기존 무기 → 진화 무기 교체)
     * @param {Object} player - Player 인스턴스
     * @param {string} evolutionId - 진화 ID (예: 'HOLY_WAND')
     * @returns {boolean} 진화 성공 여부
     */
    evolveWeapon(player, evolutionId) {
        const evoCfg = EVOLUTIONS[evolutionId];
        if (!evoCfg) return false;

        const EvolvedClass = EVOLVED_CLASSES[evolutionId];
        if (!EvolvedClass) return false;

        // 새 진화 무기 생성 및 기존 무기 교체
        const newWeapon = new EvolvedClass();
        return player.replaceWeapon(evoCfg.BASE_WEAPON, newWeapon);
    }

    /**
     * 폴백 보상을 적용한다 (진화 조건 미충족 시)
     * @param {Object} player - Player 인스턴스
     */
    applyFallbackReward(player) {
        // 체력 회복
        player.hp = Math.min(player.hp + CHEST.FALLBACK_HEAL, player.maxHp);

        // 경험치 추가
        player.addExp(CHEST.FALLBACK_EXP);
    }
}
