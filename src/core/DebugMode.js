/**
 * 디버그 모드 (DebugMode)
 * - 개발/테스트용 치트 기능 모음
 * - F1: 디버그 모드 ON/OFF
 * - G: 무적 모드 토글
 * - T: 배속 변경 (1x → 2x → 4x → 1x)
 * - L: 즉시 레벨업
 * - K: 적 전체 처치
 * - 배포 시에는 비활성화할 것
 */
import { SPAWNER, ENEMY, WEAPONS, PASSIVES, GAME, EVOLUTIONS } from '../data/config.js';
import { UI } from '../data/config.js';
import { ErrorGuard } from '../utils/ErrorGuard.js';
import { Storage } from '../utils/Storage.js';

export class DebugMode {
    constructor() {
        // 디버그 모드 활성화 여부
        this.enabled = false;

        // ===== 디버그 기능 상태 =====
        this.godMode = false;       // 무적 모드
        this.timeScale = 1;         // 배속 (1, 2, 4)
        this.magnetMode = false;    // 파워자석 모드 (전체 보석 흡수)
        this.autoLevelUp = false;   // 자동 레벨업 (랜덤 선택)
        this._weaponSelectMode = false;  // V키: 무기 선택 패널
        this._passiveSelectMode = false; // P키: 패시브 선택 패널

        // ===== FPS 측정 =====
        this._frameCount = 0;
        this._fpsTimer = 0;
        this.fps = 0;
    }

    /**
     * 매 프레임 디버그 입력을 처리한다
     * @param {Input} input - 입력 시스템
     * @param {Object} game - Game 인스턴스
     * @param {number} dt - 원본 델타타임 (배속 적용 전)
     */
    update(input, game, dt) {
        // FPS 계산 (항상, 디버그 모드 꺼져있어도)
        this._frameCount++;
        this._fpsTimer += dt;
        if (this._fpsTimer >= 1.0) {
            this.fps = this._frameCount;
            this._frameCount = 0;
            this._fpsTimer = 0;
        }

        // F1: 디버그 모드 토글
        if (input.isKeyPressed('F1')) {
            this.enabled = !this.enabled;
        }

        // 디버그 모드가 꺼져있으면 나머지 키 무시
        if (!this.enabled) return;

        // G: 무적 모드 토글
        if (input.isKeyPressed('KeyG')) {
            this.godMode = !this.godMode;
        }

        // Shift+T: 타임스킵 (+60초) — 드라큘라 테스트용
        // T: 배속 변경 (1 → 2 → 4 → 1)
        if (input.isKeyPressed('KeyT')) {
            if (input.isKeyDown('ShiftLeft') || input.isKeyDown('ShiftRight')) {
                // Shift+T: 게임 시간 60초 점프
                game.gameTime += 60;
            } else {
                if (this.timeScale === 1) this.timeScale = 2;
                else if (this.timeScale === 2) this.timeScale = 4;
                else this.timeScale = 1;
            }
        }

        // L: 즉시 레벨업
        if (input.isKeyPressed('KeyL')) {
            game.onLevelUp();
        }

        // K: 적 전체 처치
        if (input.isKeyPressed('KeyK')) {
            this._killAllEnemies(game);
        }

        // M: 파워자석 모드 토글
        if (input.isKeyPressed('KeyM')) {
            this.magnetMode = !this.magnetMode;
        }

        // A: 자동 레벨업 토글
        if (input.isKeyPressed('KeyA')) {
            this.autoLevelUp = !this.autoLevelUp;
        }

        // C: 테스트용 상자 강제 스폰 (플레이어 근처)
        if (input.isKeyPressed('KeyC')) {
            this._spawnTestChest(game);
        }

        // B: 골드 +1000 (빠른 테스트용, HUD + 상점 둘 다 반영)
        if (input.isKeyPressed('KeyB')) {
            game.goldEarned += 1000;   // HUD에서 바로 보이게
            game.totalGold += 1000;    // 상점에서 쓸 수 있게
            Storage.save('gold', game.totalGold);
        }

        // X: 즉사 (GameOver 테스트)
        if (input.isKeyPressed('KeyX')) {
            game.player.hp = 0;
            game.onPlayerDeath();
        }

        // N: 드라큘라 즉시 소환 (GAME_DURATION으로 점프 → 드라큘라 스폰 트리거)
        if (input.isKeyPressed('KeyN')) {
            game.gameTime = GAME.GAME_DURATION;
        }

        // O: 보스 즉시 소환
        if (input.isKeyPressed('KeyO')) {
            this._spawnBoss(game);
        }

        // V: 무기 선택 패널 토글 (P 모드 해제)
        if (input.isKeyPressed('KeyV')) {
            this._weaponSelectMode = !this._weaponSelectMode;
            this._passiveSelectMode = false;
        }

        // P: 패시브 선택 패널 토글 (V 모드 해제)
        if (input.isKeyPressed('KeyP')) {
            this._passiveSelectMode = !this._passiveSelectMode;
            this._weaponSelectMode = false;
        }

        // 숫자키: 선택 패널에서 항목 선택
        if (this._weaponSelectMode || this._passiveSelectMode) {
            for (let i = 1; i <= 8; i++) {
                if (input.isKeyPressed(`Digit${i}`)) {
                    if (this._weaponSelectMode) {
                        this._maxWeaponByIndex(game, i - 1);
                    } else {
                        this._grantPassiveByIndex(game, i - 1);
                    }
                    break;
                }
            }
        }

        // 파워자석 활성 시: 모든 보석을 플레이어에게 끌어당김
        if (this.magnetMode) {
            this._pullAllGems(game);
        }

        // 자동 레벨업 활성 시: LEVELUP 상태면 랜덤 선택
        if (this.autoLevelUp && game.state === 'LEVELUP') {
            this._autoSelectLevelUp(game);
        }
    }

    /**
     * 배속이 적용된 델타타임을 반환한다
     * @param {number} dt - 원본 델타타임
     * @returns {number} 배속 적용된 델타타임
     */
    getScaledDt(dt) {
        if (!this.enabled) return dt;
        return dt * this.timeScale;
    }

    /**
     * 디버그 정보를 화면에 그린다
     * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
     * @param {Object} game - Game 인스턴스
     */
    render(ctx, game) {
        if (!this.enabled) return;

        this._renderInfoPanel(ctx, game);
        this._renderKeyHelp(ctx, game);
        this._renderSelectPanel(ctx, game);
    }

    /**
     * 디버그 정보 패널을 그린다 (좌상단, 흐리게)
     */
    _renderInfoPanel(ctx, game) {
        const player = game.player;
        const x = 10;
        let y = 100;
        const lineHeight = 16;

        // 패널 높이를 미리 계산
        const waveIndex = game.enemySpawner.currentWaveIndex;
        const wave = SPAWNER.WAVES[waveIndex];
        const totalWaves = SPAWNER.WAVES.length;
        // 모든 적 타입을 항상 표시 (생존 수 0이어도 표시)
        const allTypes = ['BAT', 'ZOMBIE', 'SKELETON', 'BOSS', 'DRACULA'];
        // 에러 로그 줄 수 계산 (최대 3개 + 헤더 1줄)
        const errors = ErrorGuard.getErrors();
        const errorLines = errors.length > 0 ? Math.min(errors.length, 3) + 1 : 0;
        const panelLines = 13 + allTypes.length + errorLines;

        ctx.save();
        ctx.globalAlpha = 0.6;

        // 반투명 배경 패널 (흐리게)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x - 5, y - 14, 340, lineHeight * panelLines + 14);

        ctx.globalAlpha = 0.85;
        ctx.font = `12px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'left';

        // 타이틀 + FPS
        ctx.fillStyle = '#ff5252';
        ctx.font = `bold 13px ${UI.FONT_FAMILY}`;
        ctx.fillText('[DEBUG]', x, y);
        ctx.fillStyle = '#ffffff';
        ctx.font = `12px ${UI.FONT_FAMILY}`;
        ctx.fillText(`FPS: ${this.fps}`, x + 170, y);
        y += lineHeight;

        // 플레이어 좌표
        ctx.fillStyle = '#81d4fa';
        ctx.fillText(`Pos: (${Math.floor(player.x)}, ${Math.floor(player.y)})`, x, y);
        y += lineHeight;

        // 디버그 상태 (한 줄로 압축)
        ctx.fillStyle = this.godMode ? '#69f0ae' : '#ef9a9a';
        const godText = this.godMode ? 'ON' : 'OFF';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`God: `, x, y);
        ctx.fillStyle = this.godMode ? '#69f0ae' : '#ef9a9a';
        ctx.fillText(godText, x + 30, y);
        ctx.fillStyle = this.timeScale > 1 ? '#ffd54f' : '#ffffff';
        ctx.fillText(`Speed: ${this.timeScale}x`, x + 80, y);
        ctx.fillStyle = this.magnetMode ? '#69f0ae' : '#ef9a9a';
        ctx.fillText(`Mag: ${this.magnetMode ? 'ON' : 'OFF'}`, x + 160, y);
        y += lineHeight;

        ctx.fillStyle = '#ffffff';
        ctx.fillText(`AutoLv: `, x, y);
        ctx.fillStyle = this.autoLevelUp ? '#69f0ae' : '#ef9a9a';
        ctx.fillText(this.autoLevelUp ? 'ON' : 'OFF', x + 50, y);
        y += lineHeight + 3;

        // 오브젝트 수
        ctx.fillStyle = '#78909c';
        ctx.fillText('[Objects]', x, y);
        y += lineHeight;

        const enemyCount = game.enemies.getActive().length;
        const gemCount = game.gems.getActive().length;
        const projCount = game.projectiles.getActive().length;

        ctx.fillStyle = '#b0bec5';
        ctx.fillText(`Enemy: ${enemyCount}/200  Gem: ${gemCount}  Proj: ${projCount}`, x, y);
        y += lineHeight + 3;

        // 웨이브 정보
        ctx.fillStyle = '#78909c';
        ctx.fillText('[Current Wave]', x, y);
        y += lineHeight;

        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Wave ${waveIndex + 1}/${totalWaves}  ${wave.types.join(', ')}`, x, y);
        y += lineHeight;

        ctx.fillStyle = '#b0bec5';
        ctx.fillText(`Interval: ${wave.interval}s  x${wave.spawnCount}`, x, y);
        y += lineHeight + 3;

        // 적 스탯
        ctx.fillStyle = '#78909c';
        ctx.fillText('[Enemy Stats]', x, y);
        y += lineHeight;

        // 타입별 생존 수 집계
        const typeCounts = {};
        for (const enemy of game.enemies.getActive()) {
            typeCounts[enemy.type] = (typeCounts[enemy.type] || 0) + 1;
        }

        // 현재 웨이브에 포함된 적 타입 (스폰 중 판별용)
        const spawningTypes = new Set(wave.types);
        const spawner = game.enemySpawner;
        const gt = game.gameTime;

        for (const type of allTypes) {
            const stats = ENEMY[type];
            if (!stats) continue;

            const count = typeCounts[type] || 0;

            // ● 스폰 상태 표시: 초록=스폰중, 빨강=중단, 노랑=조건부
            let dotColor;
            if (type === 'BOSS') {
                dotColor = spawner.bossSpawned ? '#69f0ae' : '#ffd54f';
            } else if (type === 'DRACULA') {
                dotColor = spawner._draculaSpawned ? '#69f0ae' : '#ffd54f';
            } else {
                dotColor = spawningTypes.has(type) ? '#69f0ae' : '#ef5350';
            }
            // 드라큘라 스폰 후 모든 일반 적/보스 스폰 중단
            if (spawner._draculaSpawned && type !== 'DRACULA') {
                dotColor = '#ef5350';
            }

            ctx.fillStyle = dotColor;
            ctx.fillText('●', x, y);

            ctx.fillStyle = stats.COLOR || '#ffffff';
            ctx.fillText(`${type}`, x + 12, y);
            ctx.fillStyle = '#b0bec5';
            ctx.fillText(`HP:${stats.HP}  SPD:${stats.SPEED}  DMG:${stats.DAMAGE}`, x + 87, y);

            // 카운트 + 추가 정보 (타이머 x좌표 통일: x+295)
            const countX = x + 245;
            const timerX = x + 280;
            ctx.fillStyle = '#ffd54f';
            if (type === 'BOSS') {
                // (생존/총스폰) ↻남은시간
                const total = spawner.totalBossSpawned;
                ctx.fillText(`(${count}/${total})`, countX, y);
                if (spawner.bossSpawned && !spawner._draculaSpawned) {
                    const nextIn = Math.max(0, SPAWNER.BOSS_RESPAWN_INTERVAL - (gt - spawner._lastBossTime));
                    ctx.fillStyle = '#81d4fa';
                    ctx.fillText(`↻${this._fmtTime(nextIn)}`, timerX, y);
                } else if (!spawner.bossSpawned) {
                    const untilFirst = Math.max(0, SPAWNER.BOSS_SPAWN_TIME - gt);
                    ctx.fillStyle = '#81d4fa';
                    ctx.fillText(`in ${this._fmtTime(untilFirst)}`, timerX, y);
                }
            } else if (type === 'DRACULA') {
                ctx.fillText(`(${count})`, countX, y);
                if (!spawner._draculaSpawned) {
                    const untilSpawn = Math.max(0, SPAWNER.DRACULA_SPAWN_TIME - gt);
                    ctx.fillStyle = '#81d4fa';
                    ctx.fillText(`in ${this._fmtTime(untilSpawn)}`, timerX, y);
                }
            } else {
                ctx.fillText(`(${count})`, countX, y);
            }

            y += lineHeight;
        }

        // 에러 로그 (있을 때만 표시, 빨간색)
        if (errors.length > 0) {
            y += 3;
            ctx.fillStyle = '#ff5252';
            ctx.fillText(`[Errors: ${errors.length}]`, x, y);
            y += lineHeight;

            // 최근 3개만 표시
            const recentErrors = errors.slice(-3);
            for (const err of recentErrors) {
                ctx.fillStyle = '#ef9a9a';
                const countText = err.count > 1 ? ` (x${err.count})` : '';
                // 너무 긴 메시지는 잘라서 표시
                const msg = err.message.length > 30
                    ? err.message.substring(0, 30) + '...'
                    : err.message;
                ctx.fillText(`${err.source}: ${msg}${countText}`, x, y);
                y += lineHeight;
            }
        }

        ctx.restore();
    }

    /**
     * 단축키 안내를 그린다 (우하단, 더 흐리게)
     */
    _renderKeyHelp(ctx, game) {
        const canvasW = game.canvas.width;
        const canvasH = game.canvas.height;
        const lineHeight = 15;
        const keys = [
            'F1 : Toggle Debug',
            'G  : God Mode',
            'T  : Speed (1x/2x/4x)',
            'Sh+T: Time Skip +60s',
            'L  : Level Up',
            'K  : Kill All',
            `M  : Magnet ${this.magnetMode ? 'ON' : 'OFF'}`,
            `A  : Auto LvUp ${this.autoLevelUp ? 'ON' : 'OFF'}`,
            'C  : Spawn Chest',
            'O  : Spawn Boss',
            'B  : Gold +1000',
            'X  : Instant Death',
            'N  : Spawn Dracula',
            'V  : Weapon → MAX',
            'P  : Grant Passive',
        ];

        const x = canvasW - 155;
        let y = canvasH - (keys.length * lineHeight) - 5;

        ctx.save();
        ctx.globalAlpha = 0.4;

        // 반투명 배경
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x - 5, y - 12, 150, keys.length * lineHeight + 10);

        ctx.font = `11px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#b0bec5';

        for (const key of keys) {
            ctx.fillText(key, x, y);
            y += lineHeight;
        }

        ctx.restore();
    }

    /**
     * V/P 선택 패널을 좌하단에 그린다 (HUD 무기 목록 위에 덮어씀)
     */
    _renderSelectPanel(ctx, game) {
        if (!this._weaponSelectMode && !this._passiveSelectMode) return;

        const player = game.player;
        const x = 12;
        const lineHeight = 18;
        const isWeapon = this._weaponSelectMode;

        // 표시할 항목 목록 생성
        const entries = isWeapon ? Object.entries(WEAPONS) : Object.entries(PASSIVES);
        const title = isWeapon ? '[V] Weapon → Lv.MAX (1-8)' : '[P] Passive → Grant (1-4)';

        // 패널 높이 계산 (타이틀 + 항목 수)
        const panelHeight = (entries.length + 1) * lineHeight + 12;
        const panelY = game.canvas.height - panelHeight - 4;

        ctx.save();

        // 불투명 배경 (HUD 무기 목록을 완전히 덮음)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(x - 4, panelY, 230, panelHeight);
        ctx.strokeStyle = '#ffd700';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 4, panelY, 230, panelHeight);

        let y = panelY + lineHeight;

        // 타이틀
        ctx.font = `bold 12px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'left';
        ctx.fillStyle = '#ffd700';
        ctx.fillText(title, x, y);
        y += lineHeight;

        // 항목 목록
        ctx.font = `12px ${UI.FONT_FAMILY}`;
        for (let i = 0; i < entries.length; i++) {
            const [id, config] = entries[i];
            const num = i + 1;

            if (isWeapon) {
                const weapon = player.getWeapon(id);
                if (weapon) {
                    const isMax = weapon.level >= (config.MAX_LEVEL || 5);
                    ctx.fillStyle = isMax ? '#69f0ae' : '#ffffff';
                    const lvText = isMax ? 'MAX' : `Lv.${weapon.level}`;
                    ctx.fillText(`[${num}] ${config.NAME}  ${lvText}`, x, y);
                } else {
                    // 진화된 무기인지 체크
                    const evolvedId = this._getEvolvedId(player, id);
                    if (evolvedId) {
                        ctx.fillStyle = '#ffd700';
                        ctx.fillText(`[${num}] ${config.NAME}  → ★${EVOLUTIONS[evolvedId].NAME}`, x, y);
                    } else {
                        ctx.fillStyle = '#555555';
                        ctx.fillText(`[${num}] ${config.NAME}  (없음)`, x, y);
                    }
                }
            } else {
                const level = player.passiveLevels[id] || 0;
                if (level > 0) {
                    const isMax = level >= (config.MAX_LEVEL || 5);
                    ctx.fillStyle = isMax ? '#69f0ae' : '#ffffff';
                    const lvText = isMax ? 'MAX' : `Lv.${level}`;
                    ctx.fillText(`[${num}] ${config.NAME}  ${lvText}`, x, y);
                } else {
                    ctx.fillStyle = '#555555';
                    ctx.fillText(`[${num}] ${config.NAME}  (없음)`, x, y);
                }
            }
            y += lineHeight;
        }

        ctx.restore();
    }

    /**
     * 무기 슬롯 인덱스로 해당 무기를 MAX 레벨로 올린다
     * - 보유 중이면 MAX로, 미보유면 추가 후 MAX
     */
    _maxWeaponByIndex(game, index) {
        const weaponEntries = Object.entries(WEAPONS);
        if (index >= weaponEntries.length) return;

        const [weaponId, config] = weaponEntries[index];
        const player = game.player;

        // 이미 진화된 무기면 스킵 (중복 생성 방지)
        if (this._getEvolvedId(player, weaponId)) {
            this._weaponSelectMode = false;
            return;
        }

        let weapon = player.getWeapon(weaponId);

        // 미보유 무기면 새로 추가
        if (!weapon) {
            const WeaponClass = game.expSystem._weaponClasses[weaponId];
            if (!WeaponClass) return;
            weapon = new WeaponClass();
            player.addWeapon(weapon);
        }

        // MAX 레벨까지 올리기
        const maxLevel = config.MAX_LEVEL || 5;
        while (weapon.level < maxLevel) {
            weapon.levelUp();
        }

        this._weaponSelectMode = false;
    }

    /**
     * 기본 무기 ID에 대응하는 진화 무기가 플레이어에게 있는지 확인한다
     * @param {Object} player - Player 인스턴스
     * @param {string} baseWeaponId - 기본 무기 ID (예: 'MAGIC_WAND')
     * @returns {string|null} 진화 무기 ID 또는 null
     */
    _getEvolvedId(player, baseWeaponId) {
        for (const [evoId, evoCfg] of Object.entries(EVOLUTIONS)) {
            if (evoCfg.BASE_WEAPON === baseWeaponId && player.getWeapon(evoId)) {
                return evoId;
            }
        }
        return null;
    }

    /**
     * 패시브 인덱스로 해당 패시브를 부여한다
     */
    _grantPassiveByIndex(game, index) {
        const passiveEntries = Object.entries(PASSIVES);
        if (index >= passiveEntries.length) return;

        const [passiveId] = passiveEntries[index];
        const player = game.player;

        // 이미 보유 중이면 스킵
        if (player.passiveLevels[passiveId] > 0) {
            this._passiveSelectMode = false;
            return;
        }

        // 패시브 부여 (ExpSystem의 내부 메서드 활용)
        game.expSystem._applyPassive(player, passiveId);
        this._passiveSelectMode = false;
    }

    /**
     * 모든 보석을 플레이어에게 강제 흡수시킨다
     */
    _pullAllGems(game) {
        for (const gem of game.gems.getActive()) {
            gem.isMagneted = true;
        }
    }

    /**
     * 레벨업 선택지 중 랜덤으로 하나를 자동 선택한다
     */
    _autoSelectLevelUp(game) {
        const choices = game._currentChoices;
        if (choices.length === 0) return;

        const randomIndex = Math.floor(Math.random() * choices.length);
        game.expSystem.applyChoice(game.player, choices[randomIndex]);
        game.player.expToNext = game.expSystem.getExpToNext(game.player.level);
        game.state = 'PLAY';
    }

    /**
     * 테스트용 상자를 플레이어 근처에 스폰한다
     */
    _spawnTestChest(game) {
        const chest = game.chests.get();
        chest.init(game.player.x + 60, game.player.y);
    }

    /**
     * 보스를 플레이어 근처에 즉시 소환한다
     */
    _spawnBoss(game) {
        const boss = game.enemies.get();
        const stats = ENEMY.BOSS;
        boss.init(
            game.player.x + SPAWNER.SPAWN_DISTANCE * 0.5,
            game.player.y,
            stats,
            'BOSS'
        );
        game.sound.play('bosswarn');
    }

    /**
     * 초 단위를 m:ss 또는 ss 형식으로 변환한다 (디버그 표시용)
     * @param {number} seconds - 초
     * @returns {string} 포맷된 시간 문자열
     */
    _fmtTime(seconds) {
        const s = Math.ceil(seconds);
        if (s >= 60) {
            const m = Math.floor(s / 60);
            const sec = s % 60;
            return `${m}:${sec.toString().padStart(2, '0')}`;
        }
        return `${s}s`;
    }

    /**
     * 모든 활성 적을 처치한다 (보석 드롭 + 킬 카운트)
     * @param {Object} game - Game 인스턴스
     */
    _killAllEnemies(game) {
        const enemies = game.enemies.getActive();
        for (const enemy of [...enemies]) {
            if (!enemy.active) continue;
            enemy.onDeath(game);
        }
        // 비활성 적 풀에 반환
        game.enemies.releaseWhere(e => !e.active);
    }
}
