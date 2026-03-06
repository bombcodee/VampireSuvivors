/**
 * 파이어 완드 무기 (Fire Wand)
 * - 가장 가까운 적에게 불꽃 투사체를 발사한다
 * - MagicWand의 상위 호환: 적을 관통하는 불꽃
 * - 레벨업하면 관통 횟수, 데미지, 발사 수 증가
 */
import { distance, normalize } from '../utils/MathUtils.js';
import { WEAPONS } from '../data/config.js';

export class FireWand {
    constructor() {
        this.id = 'FIRE_WAND';
        this.name = WEAPONS.FIRE_WAND.NAME;
        this.level = 1;
        this.cooldownTimer = 0;

        this._loadLevelStats();
    }

    _loadLevelStats() {
        const stats = WEAPONS.FIRE_WAND.LEVELS[this.level - 1];
        this.damage = stats.damage;
        this.cooldown = stats.cooldown;
        this.speed = stats.speed;
        this.count = stats.count;
        this.size = stats.size;
        this.pierce = stats.pierce;
    }

    levelUp() {
        if (this.level >= WEAPONS.FIRE_WAND.MAX_LEVEL) return false;
        this.level++;
        this._loadLevelStats();
        return true;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        this.cooldownTimer -= dt;

        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = this.cooldown;
            this._fire(playerX, playerY, enemies, projectilePool, game);
        }
    }

    _fire(playerX, playerY, enemies, projectilePool, game) {
        if (enemies.length === 0) return;

        const dmgMul = game ? game.player.damageMultiplier : 1;
        const spdMul = game ? game.player.projSpeedMultiplier : 1;

        const sorted = enemies
            .filter(e => e.active)
            .map(e => ({
                enemy: e,
                dist: distance(playerX, playerY, e.x, e.y),
            }))
            .sort((a, b) => a.dist - b.dist);

        if (sorted.length === 0) return;

        for (let i = 0; i < this.count; i++) {
            const targetIndex = Math.min(i, sorted.length - 1);
            const target = sorted[targetIndex].enemy;

            const dir = normalize(target.x - playerX, target.y - playerY);

            let finalDx = dir.x;
            let finalDy = dir.y;
            if (this.count > 1 && i > 0) {
                const spreadAngle = (i - (this.count - 1) / 2) * WEAPONS.FIRE_WAND.SPREAD_ANGLE;
                const cos = Math.cos(spreadAngle);
                const sin = Math.sin(spreadAngle);
                finalDx = dir.x * cos - dir.y * sin;
                finalDy = dir.x * sin + dir.y * cos;
            }

            const proj = projectilePool.get();
            proj.init({
                x: playerX,
                y: playerY,
                dx: finalDx,
                dy: finalDy,
                damage: Math.floor(this.damage * dmgMul),
                speed: this.speed * spdMul,
                size: this.size,
                color: WEAPONS.FIRE_WAND.COLOR,
                weaponId: this.id,
                pierce: this.pierce,
            });
        }
    }

    render() {
        // 투사체가 따로 렌더링됨
    }
}
