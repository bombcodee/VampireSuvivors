/**
 * 영구 업그레이드 시스템 (UpgradeSystem)
 * - Storage에서 업그레이드 레벨을 저장/로드한다
 * - 골드를 소비하여 업그레이드를 구매한다
 * - 게임 시작 시 Player 스탯에 보너스를 적용한다
 */
import { UPGRADES } from '../data/config.js';
import { Storage } from '../utils/Storage.js';

const STORAGE_KEY = 'upgrades';

export class UpgradeSystem {
    constructor() {
        // { MOVE_SPEED: 0, MAX_HP: 2, ... } 형태
        this._levels = this._load();
    }

    /**
     * Storage에서 업그레이드 레벨을 불러온다
     * @returns {Object} 업그레이드 ID → 레벨 맵
     */
    _load() {
        const saved = Storage.load(STORAGE_KEY, {});
        const levels = {};
        for (const id of Object.keys(UPGRADES)) {
            levels[id] = saved[id] || 0;
        }
        return levels;
    }

    /**
     * 현재 업그레이드 레벨을 Storage에 저장한다
     */
    _save() {
        Storage.save(STORAGE_KEY, this._levels);
    }

    /**
     * 특정 업그레이드의 현재 레벨을 반환한다
     * @param {string} upgradeId
     * @returns {number}
     */
    getLevel(upgradeId) {
        return this._levels[upgradeId] || 0;
    }

    /**
     * 특정 업그레이드의 최대 레벨을 반환한다
     * @param {string} upgradeId
     * @returns {number}
     */
    getMaxLevel(upgradeId) {
        return UPGRADES[upgradeId]?.COSTS.length || 0;
    }

    /**
     * 다음 레벨 비용을 반환한다 (MAX면 null)
     * @param {string} upgradeId
     * @returns {number|null}
     */
    getCost(upgradeId) {
        const level = this.getLevel(upgradeId);
        const cfg = UPGRADES[upgradeId];
        if (!cfg || level >= cfg.COSTS.length) return null;
        return cfg.COSTS[level];
    }

    /**
     * 업그레이드를 구매한다
     * @param {string} upgradeId
     * @param {number} currentGold - 현재 보유 골드
     * @returns {{ success: boolean, remainingGold: number }}
     */
    purchase(upgradeId, currentGold) {
        const cost = this.getCost(upgradeId);
        if (cost === null || currentGold < cost) {
            return { success: false, remainingGold: currentGold };
        }

        this._levels[upgradeId]++;
        this._save();

        return { success: true, remainingGold: currentGold - cost };
    }

    /**
     * 모든 업그레이드 보너스를 Player에 적용한다
     * - 게임 시작 시 캐릭터 보너스 적용 후 호출
     * @param {Object} player - Player 인스턴스
     */
    applyToPlayer(player) {
        for (const [id, cfg] of Object.entries(UPGRADES)) {
            const level = this._levels[id] || 0;
            if (level <= 0) continue;

            // 레벨만큼 누적 보너스 계산
            let totalBonus = 0;
            for (let i = 0; i < level; i++) {
                totalBonus += cfg.VALUES[i];
            }

            // 스탯에 적용
            if (cfg.TYPE === 'multiply') {
                player[cfg.STAT] += totalBonus;
            } else if (cfg.TYPE === 'add') {
                player[cfg.STAT] += totalBonus;
                // maxHp 증가 시 현재 hp도 같이 증가
                if (cfg.STAT === 'maxHp') {
                    player.hp += totalBonus;
                }
            }
        }
    }

    /**
     * UI용 전체 업그레이드 목록을 반환한다
     * @returns {Array<{ id, name, description, level, maxLevel, cost, color }>}
     */
    getAll() {
        return Object.entries(UPGRADES).map(([id, cfg]) => {
            const level = this._levels[id] || 0;
            const maxLevel = cfg.COSTS.length;
            return {
                id,
                name: cfg.NAME,
                description: cfg.DESCRIPTION,
                level,
                maxLevel,
                cost: level < maxLevel ? cfg.COSTS[level] : null,
                color: cfg.COLOR,
            };
        });
    }

    /**
     * 모든 업그레이드를 초기화한다 (디버그용)
     */
    resetAll() {
        for (const id of Object.keys(UPGRADES)) {
            this._levels[id] = 0;
        }
        this._save();
    }
}
