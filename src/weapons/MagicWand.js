/**
 * 매직 완드 무기 (Magic Wand)
 * - 가장 가까운 적에게 투사체를 발사하는 기본 무기
 * - 레벨업하면 데미지, 발사 수, 속도가 증가
 * - Vampire Survivors의 "Magic Wand"와 동일한 컨셉
 */
import { distance, normalize } from '../utils/MathUtils.js';
import { WEAPONS } from '../data/config.js';

export class MagicWand {
    constructor() {
        this.id = 'MAGIC_WAND';
        this.name = WEAPONS.MAGIC_WAND.NAME;
        this.level = 1;         // 현재 레벨 (1~5)
        this.cooldownTimer = 0; // 현재 쿨타임 타이머

        // 현재 레벨 스탯을 로드
        this._loadLevelStats();
    }

    /**
     * 현재 레벨에 맞는 스탯을 로드한다
     */
    _loadLevelStats() {
        const stats = WEAPONS.MAGIC_WAND.LEVELS[this.level - 1];
        this.damage = stats.damage;
        this.cooldown = stats.cooldown;
        this.speed = stats.speed;
        this.count = stats.count;       // 한 번에 발사하는 투사체 수
        this.size = stats.size;
    }

    /**
     * 무기 레벨업
     * @returns {boolean} 레벨업 성공 여부 (최대 레벨이면 false)
     */
    levelUp() {
        if (this.level >= WEAPONS.MAGIC_WAND.MAX_LEVEL) {
            return false;
        }
        this.level++;
        this._loadLevelStats();
        return true;
    }

    /**
     * 매 프레임 무기 업데이트 (쿨타임 체크 → 발사)
     * @param {number} dt - 델타타임 (초)
     * @param {number} playerX - 플레이어 X
     * @param {number} playerY - 플레이어 Y
     * @param {Array} enemies - 활성 적 목록
     * @param {ObjectPool} projectilePool - 투사체 풀
     */
    update(dt, playerX, playerY, enemies, projectilePool) {
        // 쿨타임 감소
        this.cooldownTimer -= dt;

        // 쿨타임이 끝나면 발사
        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = this.cooldown;
            this._fire(playerX, playerY, enemies, projectilePool);
        }
    }

    /**
     * 투사체를 발사한다 (내부 메서드)
     * @param {number} playerX - 플레이어 X
     * @param {number} playerY - 플레이어 Y
     * @param {Array} enemies - 활성 적 목록
     * @param {ObjectPool} projectilePool - 투사체 풀
     */
    _fire(playerX, playerY, enemies, projectilePool) {
        // 적이 없으면 발사하지 않음
        if (enemies.length === 0) return;

        // 가까운 적들을 거리순으로 정렬 (가까운 순)
        const sorted = enemies
            .filter(e => e.active)
            .map(e => ({
                enemy: e,
                dist: distance(playerX, playerY, e.x, e.y),
            }))
            .sort((a, b) => a.dist - b.dist);

        if (sorted.length === 0) return;

        // count만큼 투사체 발사 (각각 다른 적을 노린다)
        for (let i = 0; i < this.count; i++) {
            // 타겟 선택 (적이 부족하면 첫 번째 적에게 중복 발사)
            const targetIndex = Math.min(i, sorted.length - 1);
            const target = sorted[targetIndex].enemy;

            // 발사 방향 계산
            const dir = normalize(target.x - playerX, target.y - playerY);

            // 여러 발이면 약간 각도 분산
            let finalDx = dir.x;
            let finalDy = dir.y;
            if (this.count > 1 && i > 0) {
                const spreadAngle = (i - (this.count - 1) / 2) * 0.15;
                const cos = Math.cos(spreadAngle);
                const sin = Math.sin(spreadAngle);
                finalDx = dir.x * cos - dir.y * sin;
                finalDy = dir.x * sin + dir.y * cos;
            }

            // 투사체 생성
            const proj = projectilePool.get();
            proj.init({
                x: playerX,
                y: playerY,
                dx: finalDx,
                dy: finalDy,
                damage: this.damage,
                speed: this.speed,
                size: this.size,
                color: WEAPONS.MAGIC_WAND.COLOR,
                weaponId: this.id,
            });
        }
    }

    /**
     * 무기의 범위 이펙트를 렌더링한다 (MagicWand는 없음)
     */
    render() {
        // MagicWand는 투사체가 따로 렌더링되므로 별도 렌더 불필요
    }
}
