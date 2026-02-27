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
import { SPAWNER, ENEMY } from '../data/config.js';
import { UI } from '../data/config.js';

export class DebugMode {
    constructor() {
        // 디버그 모드 활성화 여부
        this.enabled = false;

        // ===== 디버그 기능 상태 =====
        this.godMode = false;       // 무적 모드
        this.timeScale = 1;         // 배속 (1, 2, 4)

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

        // T: 배속 변경 (1 → 2 → 4 → 1)
        if (input.isKeyPressed('KeyT')) {
            if (this.timeScale === 1) this.timeScale = 2;
            else if (this.timeScale === 2) this.timeScale = 4;
            else this.timeScale = 1;
        }

        // L: 즉시 레벨업
        if (input.isKeyPressed('KeyL')) {
            game.onLevelUp();
        }

        // K: 적 전체 처치
        if (input.isKeyPressed('KeyK')) {
            this._killAllEnemies(game);
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
    }

    /**
     * 디버그 정보 패널을 그린다 (좌상단, 흐리게)
     */
    _renderInfoPanel(ctx, game) {
        const player = game.player;
        const x = 10;
        let y = 100;
        const lineHeight = 16;

        // 패널 높이를 미리 계산 (적 타입 수에 따라 가변)
        const waveIndex = game.enemySpawner.currentWaveIndex;
        const wave = SPAWNER.WAVES[waveIndex];
        const totalWaves = SPAWNER.WAVES.length;
        const shownTypes = new Set(wave.types);
        if (game.enemySpawner.bossSpawned || game.gameTime >= SPAWNER.BOSS_SPAWN_TIME) {
            shownTypes.add('BOSS');
        }
        const panelLines = 12 + shownTypes.size;

        ctx.save();
        ctx.globalAlpha = 0.6;

        // 반투명 배경 패널 (흐리게)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(x - 5, y - 14, 260, lineHeight * panelLines + 14);

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

        for (const type of shownTypes) {
            const stats = ENEMY[type];
            if (stats) {
                ctx.fillStyle = stats.COLOR || '#ffffff';
                ctx.fillText(`${type}`, x, y);
                ctx.fillStyle = '#b0bec5';
                ctx.fillText(`HP:${stats.HP}  SPD:${stats.SPEED}  DMG:${stats.DAMAGE}`, x + 75, y);
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
            'L  : Level Up',
            'K  : Kill All',
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
     * 모든 활성 적을 처치한다 (보석 드롭 + 킬 카운트)
     * @param {Object} game - Game 인스턴스
     */
    _killAllEnemies(game) {
        const enemies = game.enemies.getActive();
        for (const enemy of [...enemies]) {
            if (!enemy.active) continue;

            // 킬 카운트 증가
            game.player.killCount++;

            // 보석 드롭
            const gem = game.gems.get();
            gem.init(enemy.x, enemy.y, enemy.expValue);

            // 적 비활성화
            enemy.active = false;
        }
        // 비활성 적 풀에 반환
        game.enemies.releaseWhere(e => !e.active);
    }
}
