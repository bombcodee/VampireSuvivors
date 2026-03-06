/**
 * 홀리 완드 (Holy Wand) — MagicWand의 진화 무기
 * - 조건: MagicWand Lv5 + Armor 패시브
 * - 5발 관통 투사체, 높은 데미지, 큰 사이즈
 * - 레벨업 없음 (진화 무기는 최종 형태)
 */
import { distance, normalize } from '../utils/MathUtils.js';
import { EVOLUTIONS } from '../data/config.js';

const CFG = EVOLUTIONS.HOLY_WAND;

export class HolyWand {
    constructor() {
        this.id = 'HOLY_WAND';
        this.name = CFG.NAME;
        this.level = 1;          // 진화 무기는 레벨 1 고정
        this.isEvolved = true;   // 진화 무기 표식
        this.cooldownTimer = 0;

        // 스탯 (config에서 로드)
        this.damage = CFG.STATS.damage;
        this.cooldown = CFG.STATS.cooldown;
        this.speed = CFG.STATS.speed;
        this.count = CFG.STATS.count;
        this.size = CFG.STATS.size;
        this.pierce = CFG.STATS.pierce;
    }

    /** 진화 무기는 레벨업 불가 */
    levelUp() {
        return false;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        this.cooldownTimer -= dt;

        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = this.cooldown;
            this._fire(playerX, playerY, enemies, projectilePool, game);
        }
    }

    /**
     * 관통 투사체 5발을 가까운 적들에게 발사한다
     */
    _fire(playerX, playerY, enemies, projectilePool, game) {
        if (enemies.length === 0) return;

        const dmgMul = game ? game.player.damageMultiplier : 1;
        const spdMul = game ? game.player.projSpeedMultiplier : 1;

        // 가까운 적 정렬
        const sorted = enemies
            .filter(e => e.active)
            .map(e => ({ enemy: e, dist: distance(playerX, playerY, e.x, e.y) }))
            .sort((a, b) => a.dist - b.dist);

        if (sorted.length === 0) return;

        for (let i = 0; i < this.count; i++) {
            const targetIndex = Math.min(i, sorted.length - 1);
            const target = sorted[targetIndex].enemy;
            const dir = normalize(target.x - playerX, target.y - playerY);

            // 다발 발사 시 각도 분산
            let finalDx = dir.x;
            let finalDy = dir.y;
            if (this.count > 1 && i > 0) {
                const spreadAngle = (i - (this.count - 1) / 2) * CFG.SPREAD_ANGLE;
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
                color: CFG.COLOR,
                weaponId: this.id,
                pierce: this.pierce,
            });
        }
    }

    render() {
        // 투사체가 따로 렌더링됨
    }
}
