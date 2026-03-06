/**
 * 나이프 무기 (Knife)
 * - 빠르고 약한 투사체를 다량으로 발사한다
 * - 가장 짧은 쿨타임, 높은 발사 속도
 * - 레벨업하면 발사 수와 데미지 증가
 */
import { distance, normalize } from '../utils/MathUtils.js';
import { WEAPONS } from '../data/config.js';

export class Knife {
    constructor() {
        this.id = 'KNIFE';
        this.name = WEAPONS.KNIFE.NAME;
        this.level = 1;
        this.cooldownTimer = 0;

        this._loadLevelStats();
    }

    _loadLevelStats() {
        const stats = WEAPONS.KNIFE.LEVELS[this.level - 1];
        this.damage = stats.damage;
        this.cooldown = stats.cooldown;
        this.speed = stats.speed;
        this.count = stats.count;
        this.size = stats.size;
    }

    levelUp() {
        if (this.level >= WEAPONS.KNIFE.MAX_LEVEL) return false;
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
                const spreadAngle = (i - (this.count - 1) / 2) * WEAPONS.KNIFE.SPREAD_ANGLE;
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
                color: WEAPONS.KNIFE.COLOR,
                weaponId: this.id,
            });
        }
    }

    render() {
        // 투사체가 따로 렌더링됨
    }
}
