/**
 * 적 스폰 시스템 (EnemySpawner)
 * - 시간 경과에 따라 적을 생성한다
 * - 난이도 곡선: 시간이 지날수록 더 강한 적이 더 자주 등장
 * - 화면 밖 랜덤 위치에서 적을 스폰
 */
import { SPAWNER, ENEMY } from '../data/config.js';
import { randomAngle, randomPick } from '../utils/MathUtils.js';

export class EnemySpawner {
    constructor() {
        this.spawnTimer = 0;            // 스폰 쿨타임 타이머
        this.currentWaveIndex = 0;      // 현재 웨이브 인덱스
        this.bossSpawned = false;       // 보스 스폰 여부
        this._lastBossTime = 0;         // 마지막 보스 스폰 시간
    }

    /**
     * 매 프레임 스폰 시스템을 업데이트한다
     * @param {number} dt - 델타타임 (초)
     * @param {Object} player - 플레이어 (스폰 위치 기준점)
     * @param {ObjectPool} enemyPool - 적 오브젝트 풀
     * @param {number} gameTime - 현재 게임 경과 시간 (초)
     */
    update(dt, player, enemyPool, gameTime, game) {
        // 현재 시간에 맞는 웨이브 설정을 가져온다
        this._updateWave(gameTime);

        const wave = SPAWNER.WAVES[this.currentWaveIndex];

        // 최대 적 수 초과 시 스폰하지 않음
        if (enemyPool.getActive().length >= SPAWNER.MAX_ENEMIES) {
            return;
        }

        // 스폰 타이머 감소
        this.spawnTimer -= dt;

        if (this.spawnTimer <= 0) {
            // 웨이브 설정에 따른 스폰
            this.spawnTimer = wave.interval;

            for (let i = 0; i < wave.spawnCount; i++) {
                this._spawnEnemy(player, enemyPool, wave.types, gameTime);
            }
        }

        // 보스 스폰 체크 (첫 등장 + 이후 반복)
        if (!this.bossSpawned && gameTime >= SPAWNER.BOSS_SPAWN_TIME) {
            this._spawnBoss(player, enemyPool, gameTime);
            this.bossSpawned = true;
            this._lastBossTime = gameTime;
            if (game) game.sound.play('bosswarn');
        } else if (this.bossSpawned && SPAWNER.BOSS_RESPAWN_INTERVAL > 0) {
            if (gameTime - this._lastBossTime >= SPAWNER.BOSS_RESPAWN_INTERVAL) {
                this._spawnBoss(player, enemyPool, gameTime);
                this._lastBossTime = gameTime;
                if (game) game.sound.play('bosswarn');
            }
        }

        // 너무 멀리 떨어진 적 디스폰 (성능 최적화)
        this._despawnFarEnemies(player, enemyPool);
    }

    /**
     * 현재 시간에 맞는 웨이브 인덱스를 업데이트한다
     * @param {number} gameTime - 게임 경과 시간
     */
    _updateWave(gameTime) {
        for (let i = SPAWNER.WAVES.length - 1; i >= 0; i--) {
            if (gameTime >= SPAWNER.WAVES[i].time) {
                this.currentWaveIndex = i;
                return;
            }
        }
    }

    /**
     * 적 하나를 스폰한다
     * @param {Object} player - 플레이어
     * @param {ObjectPool} enemyPool - 적 풀
     * @param {Array<string>} types - 스폰 가능한 적 타입 목록
     * @param {number} gameTime - 현재 게임 시간 (스케일링용)
     */
    _spawnEnemy(player, enemyPool, types, gameTime) {
        // 랜덤 적 타입 선택
        const typeName = randomPick(types);
        const baseStats = ENEMY[typeName];

        if (!baseStats) return;

        // 시간 경과에 따른 스탯 스케일링 (SCALING_START_TIME 이후)
        const stats = this._getScaledStats(baseStats, gameTime);

        // 스폰 위치: 플레이어 주변 원형 범위 밖 (화면 밖)
        const angle = randomAngle();
        const x = player.x + Math.cos(angle) * SPAWNER.SPAWN_DISTANCE;
        const y = player.y + Math.sin(angle) * SPAWNER.SPAWN_DISTANCE;

        // 풀에서 적 꺼내서 초기화
        const enemy = enemyPool.get();
        enemy.init(x, y, stats, typeName);
    }

    /**
     * 시간에 따라 스케일링된 적 스탯을 반환한다
     * @param {Object} baseStats - 기본 스탯 (config에서)
     * @param {number} gameTime - 현재 게임 시간
     * @returns {Object} 스케일링된 스탯
     */
    _getScaledStats(baseStats, gameTime) {
        if (gameTime < SPAWNER.SCALING_START_TIME) {
            return baseStats;
        }

        // 스케일링 시작 이후 경과 분
        const elapsedMin = (gameTime - SPAWNER.SCALING_START_TIME) / 60;
        const hpMultiplier = 1 + SPAWNER.SCALING_HP_PER_MIN * elapsedMin;
        const dmgMultiplier = 1 + SPAWNER.SCALING_DMG_PER_MIN * elapsedMin;
        const spdMultiplier = 1 + SPAWNER.SCALING_SPD_PER_MIN * elapsedMin;

        return {
            ...baseStats,
            HP: Math.floor(baseStats.HP * hpMultiplier),
            DAMAGE: Math.floor(baseStats.DAMAGE * dmgMultiplier),
            SPEED: Math.floor(baseStats.SPEED * spdMultiplier),
        };
    }

    /**
     * 보스를 스폰한다 (시간 스케일링 적용)
     * @param {Object} player - 플레이어
     * @param {ObjectPool} enemyPool - 적 풀
     * @param {number} gameTime - 현재 게임 시간
     */
    _spawnBoss(player, enemyPool, gameTime) {
        const angle = randomAngle();
        const x = player.x + Math.cos(angle) * SPAWNER.SPAWN_DISTANCE;
        const y = player.y + Math.sin(angle) * SPAWNER.SPAWN_DISTANCE;

        // 보스도 시간 스케일링 적용
        const stats = this._getScaledStats(ENEMY.BOSS, gameTime);

        const boss = enemyPool.get();
        boss.init(x, y, stats, 'BOSS');
    }

    /**
     * 플레이어로부터 너무 먼 적을 디스폰한다 (성능 최적화)
     * @param {Object} player - 플레이어
     * @param {ObjectPool} enemyPool - 적 풀
     */
    _despawnFarEnemies(player, enemyPool) {
        const maxDist = SPAWNER.DESPAWN_DISTANCE;
        enemyPool.releaseWhere((enemy) => {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            return (dx * dx + dy * dy) > (maxDist * maxDist);
        });
    }

    /**
     * 스폰 시스템을 리셋한다 (게임 재시작 시)
     */
    reset() {
        this.spawnTimer = 0;
        this.currentWaveIndex = 0;
        this.bossSpawned = false;
        this._lastBossTime = 0;
    }
}
