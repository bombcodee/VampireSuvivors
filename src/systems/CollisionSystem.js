/**
 * 충돌 판정 시스템 (CollisionSystem)
 * - 투사체 ↔ 적 충돌
 * - 적 ↔ 플레이어 충돌
 * - 보석 ↔ 플레이어 충돌 (흡수)
 * - 원형 충돌 판정(Circle Collision)을 사용한다
 */
import { distance } from '../utils/MathUtils.js';
import { CHEST, HIT_GLOW } from '../data/config.js';

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
                    // 적에게 데미지 (무기별 글로우 색상 전달)
                    const isDead = enemy.takeDamage(proj.damage, proj.x, proj.y, proj.hitColor);

                    // 히트 파티클 (무기별 피격 이펙트)
                    game.particles.emitHit(enemy.x, enemy.y, proj.hitColor, proj.x, proj.y);

                    // 데미지 텍스트 표시 (히트 글로우 색상 = 파티클 색상과 통일)
                    this._spawnDamageText(game, enemy.x, enemy.y - enemy.radius, proj.damage, proj.hitColor || proj.color);

                    // 적 사망 처리
                    if (isDead) {
                        enemy.onDeath(game);
                    } else {
                        game.sound.play('hit');
                        // 보스/드라큘라 피격 시 히트프리즈
                        if (enemy.type === 'BOSS' || enemy.type === 'DRACULA') {
                            game.screenFx.freeze(HIT_GLOW.BOSS_HIT_FREEZE);
                        }
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
                // 무적 또는 디버그 무적이면 스킵 (소리/흔들림 포함)
                if (player.isInvincible) continue;
                if (game.debug && game.debug.godMode) continue;

                // 플레이어에게 데미지
                const isDead = player.takeDamage(enemy.damage);
                game.sound.play('hit');
                game.screenFx.flash('#ff0000', 0.1);

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
                game.sound.play('pickup');
                game.particles.emit(gem.x, gem.y, 'GEM_SPARKLE');

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
     * 데미지 텍스트를 생성한다
     * @param {Object} game - Game 인스턴스
     * @param {number} x - X 위치
     * @param {number} y - Y 위치
     * @param {number} damage - 데미지 값
     */
    _spawnDamageText(game, x, y, damage, color = '#ffab40') {
        const text = game.damageTexts.get();
        text.init(x, y, damage, color);
    }
}
