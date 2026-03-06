/**
 * 충돌 판정 시스템 (CollisionSystem)
 * - 투사체 ↔ 적 충돌
 * - 적 ↔ 플레이어 충돌
 * - 보석 ↔ 플레이어 충돌 (흡수)
 * - 원형 충돌 판정(Circle Collision)을 사용한다
 */
import { distance } from '../utils/MathUtils.js';
import { CHEST, GOLD } from '../data/config.js';

export class CollisionSystem {
    /**
     * 모든 충돌을 검사한다 (매 프레임 호출)
     * @param {Object} game - Game 인스턴스 (모든 시스템에 접근)
     */
    update(game) {
        this._checkProjectileVsEnemy(game);
        this._checkEnemyVsPlayer(game);
        this._checkGemVsPlayer(game);
        this._checkChestVsPlayer(game);
    }

    /**
     * 투사체 ↔ 적 충돌 검사
     * - 투사체가 적에게 맞으면 데미지를 주고
     * - 적이 죽으면 보석을 드롭한다
     */
    _checkProjectileVsEnemy(game) {
        const projectiles = game.projectiles.getActive();
        const enemies = game.enemies.getActive();

        for (const proj of projectiles) {
            if (!proj.active) continue;

            for (const enemy of enemies) {
                if (!enemy.active) continue;

                // 원형 충돌 판정: 두 원의 중심 거리 < 두 반경의 합
                const dist = distance(proj.x, proj.y, enemy.x, enemy.y);
                if (dist < proj.radius + enemy.radius) {
                    // 적에게 데미지
                    const isDead = enemy.takeDamage(proj.damage, proj.x, proj.y);

                    // 데미지 텍스트 표시
                    this._spawnDamageText(game, enemy.x, enemy.y - enemy.radius, proj.damage);

                    // 적 사망 처리
                    if (isDead) {
                        this._onEnemyDeath(game, enemy);
                    }

                    // 투사체 관통 체크
                    const shouldDestroy = proj.onHit();
                    if (shouldDestroy) {
                        proj.active = false;
                    }

                    // 이 투사체가 소멸했으면 다음 투사체로
                    if (!proj.active) break;
                }
            }
        }

        // 비활성 투사체 풀에 반환
        game.projectiles.releaseWhere(p => !p.active);
    }

    /**
     * 적 ↔ 플레이어 충돌 검사
     * - 적이 플레이어에게 닿으면 데미지를 준다
     */
    _checkEnemyVsPlayer(game) {
        const player = game.player;
        if (!player.active) return;

        const enemies = game.enemies.getActive();

        for (const enemy of enemies) {
            if (!enemy.active) continue;

            const dist = distance(player.x, player.y, enemy.x, enemy.y);
            if (dist < player.radius + enemy.radius) {
                // 디버그 무적 모드면 데미지 스킵
                if (game.debug && game.debug.godMode) continue;

                // 플레이어에게 데미지
                const isDead = player.takeDamage(enemy.damage);

                if (isDead) {
                    // 게임 오버!
                    game.onPlayerDeath();
                    return;
                }

                // 화면 흔들림
                game.camera.shake();
            }
        }
    }

    /**
     * 보석 ↔ 플레이어 충돌 검사 (흡수)
     * - 보석이 플레이어에게 닿으면 경험치 획득
     */
    _checkGemVsPlayer(game) {
        const player = game.player;
        if (!player.active) return;

        const gems = game.gems.getActive();

        for (const gem of gems) {
            if (!gem.active) continue;

            const dist = distance(player.x, player.y, gem.x, gem.y);

            // 흡수 판정 (보석이 플레이어 몸체에 닿으면)
            if (dist < player.radius + gem.radius) {
                // 경험치 획득
                const leveledUp = player.addExp(gem.value);

                // 보석 비활성화 (풀에 반환)
                gem.active = false;

                // 레벨업 체크
                if (leveledUp) {
                    game.onLevelUp();
                }
            }
        }

        // 비활성 보석 풀에 반환
        game.gems.releaseWhere(g => !g.active);
    }

    /**
     * 상자 ↔ 플레이어 충돌 검사 (수집)
     * - 상자는 자석 효과 없음, 직접 걸어가야 함
     */
    _checkChestVsPlayer(game) {
        const player = game.player;
        if (!player.active) return;

        const chests = game.chests.getActive();

        for (const chest of chests) {
            if (!chest.active) continue;

            const dist = distance(player.x, player.y, chest.x, chest.y);
            if (dist < CHEST.PICKUP_RADIUS + player.radius) {
                chest.active = false;
                game.onChestPickup();
                return; // 한 번에 1개만 수집
            }
        }
    }

    /**
     * 적 사망 시 처리
     * @param {Object} game - Game 인스턴스
     * @param {Object} enemy - 사망한 적
     */
    _onEnemyDeath(game, enemy) {
        // 킬 카운트 증가
        game.player.killCount++;

        // 골드 획득
        game.goldEarned += this._calcGoldValue(game, enemy);

        // 경험치 보석 드롭
        const gem = game.gems.get();
        gem.init(enemy.x, enemy.y, enemy.expValue);

        // 보스 사망 시 상자 드롭
        if (enemy.type === 'BOSS') {
            const chest = game.chests.get();
            chest.init(enemy.x, enemy.y);
        }

        // 적 비활성화
        enemy.active = false;
    }

    /**
     * 적 처치 시 획득 골드를 계산한다
     * - 기본 골드 × 시간 보너스 × 골드 배율
     */
    _calcGoldValue(game, enemy) {
        const baseGold = GOLD[enemy.type] || 1;

        // 시간 보너스: 5분마다 +20%, 최대 +120%
        const timeBonusStacks = Math.floor(game.gameTime / GOLD.TIME_BONUS_INTERVAL);
        const timeBonus = 1 + Math.min(timeBonusStacks * GOLD.TIME_BONUS_RATE, GOLD.TIME_BONUS_MAX);

        // 골드 배율 (영구 업그레이드)
        const goldMultiplier = game.player.goldMultiplier;

        return Math.floor(baseGold * timeBonus * goldMultiplier);
    }

    /**
     * 데미지 텍스트를 생성한다
     * @param {Object} game - Game 인스턴스
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     * @param {number} damage - 데미지 값
     */
    _spawnDamageText(game, x, y, damage) {
        const text = game.damageTexts.get();
        text.init(x, y, damage, '#ffab40');
    }
}
