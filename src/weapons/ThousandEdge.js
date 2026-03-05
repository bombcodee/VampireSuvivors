/**
 * 사우전드 에지 (Thousand Edge) — Knife의 진화 무기
 * - 조건: Knife Lv5 + PickupRange 패시브
 * - 8발 방사형 발사, 초고속 쿨다운
 * - 레벨업 없음 (진화 무기는 최종 형태)
 */
import { EVOLUTIONS } from '../data/config.js';

const CFG = EVOLUTIONS.THOUSAND_EDGE;

export class ThousandEdge {
    constructor() {
        this.id = 'THOUSAND_EDGE';
        this.name = CFG.NAME;
        this.level = 1;
        this.isEvolved = true;
        this.cooldownTimer = 0;

        // 스탯
        this.damage = CFG.STATS.damage;
        this.cooldown = CFG.STATS.cooldown;
        this.speed = CFG.STATS.speed;
        this.count = CFG.STATS.count;
        this.size = CFG.STATS.size;
    }

    levelUp() {
        return false;
    }

    update(dt, playerX, playerY, enemies, projectilePool, game) {
        this.cooldownTimer -= dt;

        if (this.cooldownTimer <= 0) {
            this.cooldownTimer = this.cooldown;
            this._fire(playerX, playerY, projectilePool, game);
        }
    }

    /**
     * 8방향 방사형 발사 (적 타겟팅 아닌 전방위 발사)
     */
    _fire(playerX, playerY, projectilePool, game) {
        const dmgMul = game ? game.player.damageMultiplier : 1;
        const spdMul = game ? game.player.projSpeedMultiplier : 1;

        const angleStep = (Math.PI * 2) / this.count;

        for (let i = 0; i < this.count; i++) {
            const angle = angleStep * i;
            const dx = Math.cos(angle);
            const dy = Math.sin(angle);

            const proj = projectilePool.get();
            proj.init({
                x: playerX,
                y: playerY,
                dx: dx,
                dy: dy,
                damage: Math.floor(this.damage * dmgMul),
                speed: this.speed * spdMul,
                size: this.size,
                color: CFG.COLOR,
                weaponId: this.id,
            });
        }
    }

    render() {
        // 투사체가 따로 렌더링됨
    }
}
