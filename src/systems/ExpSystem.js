/**
 * 경험치 시스템 (ExpSystem)
 * - 레벨업에 필요한 경험치를 계산한다
 * - 레벨업 시 선택지를 생성한다 (무기/패시브 중 랜덤 3개)
 * - 플레이어 경험치 상태를 관리한다
 */
import { EXP, WEAPONS, PASSIVES } from '../data/config.js';
import { shuffle } from '../utils/MathUtils.js';
import { MagicWand } from '../weapons/MagicWand.js';
import { Garlic } from '../weapons/Garlic.js';
import { HolyWater } from '../weapons/HolyWater.js';
import { KingBible } from '../weapons/KingBible.js';
import { FireWand } from '../weapons/FireWand.js';
import { Knife } from '../weapons/Knife.js';

export class ExpSystem {
    constructor() {
        // 무기 ID → 클래스 매핑 (새 무기 추가 시 여기에 등록)
        this._weaponClasses = {
            'MAGIC_WAND': MagicWand,
            'GARLIC': Garlic,
            'HOLY_WATER': HolyWater,
            'KING_BIBLE': KingBible,
            'FIRE_WAND': FireWand,
            'KNIFE': Knife,
        };
    }

    /**
     * 특정 레벨에 필요한 누적 경험치를 계산한다
     * - 레벨이 올라갈수록 더 많은 경험치가 필요 (기하급수적 증가)
     * @param {number} level - 현재 레벨
     * @returns {number} 다음 레벨까지 필요한 경험치
     */
    getExpToNext(level) {
        return Math.floor(EXP.BASE_TO_LEVEL * Math.pow(EXP.GROWTH_RATE, level - 1));
    }

    /**
     * 레벨업 시 선택지를 생성한다
     * - 획득하지 않은 무기 → "새 무기 획득" 선택지
     * - 이미 가진 무기 (최대 레벨 미만) → "무기 레벨업" 선택지
     * - 패시브 아이템 (최대 레벨 미만) → "패시브 업그레이드" 선택지
     *
     * @param {Player} player - 플레이어
     * @returns {Array<Object>} 선택지 배열 (최대 3개)
     */
    generateChoices(player) {
        const choices = [];

        // 1. 무기 선택지 생성
        for (const [weaponId, weaponConfig] of Object.entries(WEAPONS)) {
            const existingWeapon = player.getWeapon(weaponId);

            if (!existingWeapon) {
                // 아직 없는 무기 → "새 무기 획득" 선택지
                choices.push({
                    type: 'NEW_WEAPON',
                    id: weaponId,
                    name: `${weaponConfig.NAME} (새로 획득!)`,
                    description: weaponConfig.DESCRIPTION,
                    color: weaponConfig.COLOR || '#ffffff',
                    level: 1,
                });
            } else if (existingWeapon.level < weaponConfig.MAX_LEVEL) {
                // 이미 있는 무기이고 최대 레벨 미만 → "레벨업" 선택지
                choices.push({
                    type: 'UPGRADE_WEAPON',
                    id: weaponId,
                    name: `${weaponConfig.NAME} Lv.${existingWeapon.level + 1}`,
                    description: `레벨업! (현재 Lv.${existingWeapon.level})`,
                    color: weaponConfig.COLOR || '#ffffff',
                    level: existingWeapon.level + 1,
                });
            }
            // 최대 레벨이면 선택지에 포함하지 않음
        }

        // 2. 패시브 아이템 선택지 생성
        for (const [passiveId, passiveConfig] of Object.entries(PASSIVES)) {
            const currentLevel = player.passiveLevels[passiveId] || 0;

            if (currentLevel < passiveConfig.MAX_LEVEL) {
                choices.push({
                    type: 'PASSIVE',
                    id: passiveId,
                    name: `${passiveConfig.NAME} Lv.${currentLevel + 1}`,
                    description: passiveConfig.DESCRIPTION,
                    color: passiveConfig.COLOR || '#ffffff',
                    level: currentLevel + 1,
                });
            }
        }

        // 3. 셔플 후 최대 3개 반환
        const shuffled = shuffle(choices);
        return shuffled.slice(0, EXP.LEVELUP_CHOICES);
    }

    /**
     * 선택지를 적용한다 (유저가 선택한 항목을 실제로 반영)
     * @param {Player} player - 플레이어
     * @param {Object} choice - 선택된 항목
     */
    applyChoice(player, choice) {
        switch (choice.type) {
            case 'NEW_WEAPON': {
                // 새 무기 생성 및 추가
                const WeaponClass = this._weaponClasses[choice.id];
                if (WeaponClass) {
                    const weapon = new WeaponClass();
                    player.addWeapon(weapon);
                }
                break;
            }

            case 'UPGRADE_WEAPON': {
                // 기존 무기 레벨업
                const weapon = player.getWeapon(choice.id);
                if (weapon) {
                    weapon.levelUp();
                }
                break;
            }

            case 'PASSIVE': {
                // 패시브 아이템 적용
                this._applyPassive(player, choice.id);
                break;
            }
        }
    }

    /**
     * 패시브 아이템 효과를 적용한다 (내부 메서드)
     * @param {Player} player - 플레이어
     * @param {string} passiveId - 패시브 ID
     */
    _applyPassive(player, passiveId) {
        const config = PASSIVES[passiveId];
        if (!config) return;

        // 레벨 기록
        player.passiveLevels[passiveId] = (player.passiveLevels[passiveId] || 0) + 1;

        // 효과 적용
        const effect = config.EFFECT;
        switch (effect.stat) {
            case 'speedMultiplier':
                player.speedMultiplier += effect.value;
                break;
            case 'maxHp':
                player.maxHp += effect.value;
                player.hp = Math.min(player.hp + effect.value, player.maxHp); // 회복도 함
                break;
            case 'pickupMultiplier':
                player.pickupMultiplier += effect.value;
                break;
            case 'armor':
                player.armor += effect.value;
                break;
        }
    }
}
