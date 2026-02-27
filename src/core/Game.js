/**
 * 게임 매니저 (Game) - 싱글톤
 * - 게임 전체를 관리하는 "사령탑"
 * - 모든 시스템을 소유하고 매 프레임 업데이트/렌더를 지휘한다
 * - 게임 상태(MENU, PLAY, LEVELUP, PAUSE, GAMEOVER, VICTORY) 관리
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME, POOL_SIZES } from '../data/config.js';
import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Gem } from '../entities/Gem.js';
import { Projectile } from '../entities/Projectile.js';
import { DamageText } from '../entities/DamageText.js';
import { MagicWand } from '../weapons/MagicWand.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { ExpSystem } from '../systems/ExpSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { HUD } from '../ui/HUD.js';
import { LevelUpUI } from '../ui/LevelUpUI.js';
import { MenuUI } from '../ui/MenuUI.js';
import { GameOverUI } from '../ui/GameOverUI.js';
import { VictoryUI } from '../ui/VictoryUI.js';
import { DebugMode } from './DebugMode.js';

/**
 * 게임 상태 열거값
 * - 게임은 항상 이 6가지 상태 중 하나
 */
const STATE = {
    MENU: 'MENU',
    PLAY: 'PLAY',
    LEVELUP: 'LEVELUP',
    PAUSE: 'PAUSE',
    GAMEOVER: 'GAMEOVER',
    VICTORY: 'VICTORY',
};

export class Game {
    /**
     * @param {HTMLCanvasElement} canvas - 게임 캔버스 요소
     */
    constructor(canvas) {
        // ===== 캔버스 =====
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;

        // ===== 게임 상태 =====
        this.state = STATE.MENU;
        this.gameTime = 0;          // 게임 경과 시간 (초)
        this._lastTime = 0;        // 이전 프레임 타임스탬프

        // ===== 코어 시스템 =====
        this.input = new Input(canvas);
        this.camera = new Camera(CANVAS_WIDTH, CANVAS_HEIGHT);

        // ===== 플레이어 =====
        this.player = new Player(0, 0);

        // ===== 오브젝트 풀 =====
        this.enemies = new ObjectPool(() => new Enemy(), POOL_SIZES.ENEMIES);
        this.projectiles = new ObjectPool(() => new Projectile(), POOL_SIZES.PROJECTILES);
        this.gems = new ObjectPool(() => new Gem(), POOL_SIZES.GEMS);
        this.damageTexts = new ObjectPool(() => new DamageText(), POOL_SIZES.DAMAGE_TEXTS);

        // ===== 게임 시스템 =====
        this.enemySpawner = new EnemySpawner();
        this.expSystem = new ExpSystem();
        this.collisionSystem = new CollisionSystem();

        // ===== UI =====
        this.hud = new HUD();
        this.levelUpUI = new LevelUpUI();
        this.menuUI = new MenuUI();
        this.gameOverUI = new GameOverUI();
        this.victoryUI = new VictoryUI();

        // ===== 레벨업 선택지 =====
        this._currentChoices = [];

        // ===== 디버그 모드 =====
        this.debug = new DebugMode();

        // 게임 루프를 미리 바인딩 (매 프레임 새 함수 생성 방지)
        this._gameLoop = this._gameLoop.bind(this);
    }

    /**
     * 게임 루프를 시작한다
     */
    start() {
        this._lastTime = performance.now();
        requestAnimationFrame(this._gameLoop);
    }

    /**
     * 게임 루프 (매 프레임 자동 호출)
     * - 시간 계산 → 업데이트 → 렌더 → 다음 프레임 예약
     * @param {number} currentTime - 현재 시간 (밀리초)
     */
    _gameLoop(currentTime) {
        // 델타타임 계산 (초 단위)
        const dt = Math.min((currentTime - this._lastTime) / 1000, 0.1);
        this._lastTime = currentTime;

        // 디버그 모드 업데이트 (배속 전 원본 dt 사용)
        this.debug.update(this.input, this, dt);

        // 배속 적용된 dt로 게임 업데이트
        const scaledDt = this.debug.getScaledDt(dt);

        // 업데이트 → 렌더 → 입력 초기화
        this._update(scaledDt);
        this._render();
        this.input.update(); // 프레임 끝에 입력 상태 리셋

        // 다음 프레임 예약
        requestAnimationFrame(this._gameLoop);
    }

    /**
     * 게임 상태별 업데이트
     * @param {number} dt - 델타타임 (초)
     */
    _update(dt) {
        switch (this.state) {
            case STATE.MENU:
                this._updateMenu(dt);
                break;
            case STATE.PLAY:
                this._updatePlay(dt);
                break;
            case STATE.LEVELUP:
                this._updateLevelUp(dt);
                break;
            case STATE.PAUSE:
                this._updatePause(dt);
                break;
            case STATE.GAMEOVER:
                this._updateGameOver(dt);
                break;
            case STATE.VICTORY:
                this._updateVictory(dt);
                break;
        }
    }

    /**
     * 화면 렌더링
     */
    _render() {
        // 캔버스 전체 지우기
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        switch (this.state) {
            case STATE.MENU:
                this.menuUI.render(this.ctx, this.canvas.width, this.canvas.height);
                break;

            case STATE.PLAY:
            case STATE.PAUSE:
                this._renderGame();
                this.hud.render(this.ctx, this);
                this.debug.render(this.ctx, this);
                if (this.state === STATE.PAUSE) {
                    this._renderPauseOverlay();
                }
                break;

            case STATE.LEVELUP:
                this._renderGame();
                this.hud.render(this.ctx, this);
                this.levelUpUI.render(this.ctx, this.canvas.width, this.canvas.height);
                break;

            case STATE.GAMEOVER:
                this._renderGame();
                this.gameOverUI.render(this.ctx, this.canvas.width, this.canvas.height, {
                    gameTime: this.gameTime,
                    level: this.player.level,
                    killCount: this.player.killCount,
                    totalExp: this.player.totalExp,
                });
                break;

            case STATE.VICTORY:
                this._renderGame();
                this.victoryUI.render(this.ctx, this.canvas.width, this.canvas.height, {
                    gameTime: this.gameTime,
                    level: this.player.level,
                    killCount: this.player.killCount,
                    totalExp: this.player.totalExp,
                });
                break;
        }
    }

    // ===== 상태별 업데이트 메서드 =====

    _updateMenu(dt) {
        this.menuUI.update(dt);

        if (this.input.isKeyPressed('Enter') || this.input.isKeyPressed('Space')) {
            this._startGame();
        }
    }

    _updatePlay(dt) {
        // 일시정지 체크
        if (this.input.isKeyPressed('Escape')) {
            this.state = STATE.PAUSE;
            return;
        }

        // 게임 시간 증가
        this.gameTime += dt;

        // 게임 클리어 체크 (제한 시간 초과)
        if (this.gameTime >= GAME.GAME_DURATION) {
            this.state = STATE.VICTORY;
            return;
        }

        // 카메라 업데이트
        this.camera.update(dt);
        this.camera.follow(this.player);

        // 플레이어 업데이트 (이동)
        this.player.update(dt, this.input);

        // 무기 업데이트 (자동 공격)
        this.player.updateWeapons(
            dt,
            this.enemies.getActive(),
            this.projectiles,
            this    // Game 참조 (Garlic 등 범위무기 킬 처리용)
        );

        // 적 스폰
        this.enemySpawner.update(dt, this.player, this.enemies, this.gameTime);

        // 적 업데이트 (이동)
        for (const enemy of this.enemies.getActive()) {
            enemy.update(dt, this.player.x, this.player.y);
        }

        // 투사체 업데이트 (이동)
        for (const proj of this.projectiles.getActive()) {
            proj.update(dt);
        }

        // 보석 업데이트 (자석 효과)
        for (const gem of this.gems.getActive()) {
            gem.update(dt, this.player.x, this.player.y, this.player.currentPickupRange);
        }

        // 데미지 텍스트 업데이트
        for (const text of this.damageTexts.getActive()) {
            text.update(dt);
        }

        // 충돌 판정 (내부에서 비활성 투사체/보석 정리도 수행)
        this.collisionSystem.update(this);

        // 비활성 오브젝트 정리 (수명 만료 보석 포함)
        this.gems.releaseWhere(g => !g.active);
        this.damageTexts.releaseWhere(t => !t.active);
        this.enemies.releaseWhere(e => !e.active);
    }

    _updateLevelUp() {
        const selectedIndex = this.levelUpUI.update(
            this.input,
            this.canvas.width,
            this.canvas.height
        );

        if (selectedIndex >= 0 && selectedIndex < this._currentChoices.length) {
            // 선택 적용
            this.expSystem.applyChoice(this.player, this._currentChoices[selectedIndex]);

            // 다음 레벨 필요 경험치 설정
            this.player.expToNext = this.expSystem.getExpToNext(this.player.level);

            // 게임 재개
            this.state = STATE.PLAY;
        }
    }

    _updatePause() {
        if (this.input.isKeyPressed('Escape')) {
            this.state = STATE.PLAY;
        }
    }

    _updateGameOver(dt) {
        this.gameOverUI.update(dt);

        if (this.input.isKeyPressed('Enter') || this.input.isKeyPressed('Space')) {
            this.state = STATE.MENU;
        }
    }

    _updateVictory(dt) {
        this.victoryUI.update(dt);

        if (this.input.isKeyPressed('Enter') || this.input.isKeyPressed('Space')) {
            this.state = STATE.MENU;
        }
    }

    // ===== 게임 월드 렌더링 =====

    _renderGame() {
        // 배경 격자
        this._renderBackground();

        // 갈릭 범위 이펙트 (있으면)
        for (const weapon of this.player.weapons) {
            if (weapon.render) {
                weapon.render(this.ctx, this.camera, this.player.x, this.player.y);
            }
        }

        // 보석
        for (const gem of this.gems.getActive()) {
            gem.render(this.ctx, this.camera);
        }

        // 적
        for (const enemy of this.enemies.getActive()) {
            enemy.render(this.ctx, this.camera);
        }

        // 플레이어
        this.player.render(this.ctx, this.camera);

        // 투사체
        for (const proj of this.projectiles.getActive()) {
            proj.render(this.ctx, this.camera);
        }

        // 데미지 텍스트
        for (const text of this.damageTexts.getActive()) {
            text.render(this.ctx, this.camera);
        }
    }

    /**
     * 배경 격자를 그린다 (무한 반복 타일)
     */
    _renderBackground() {
        const gridSize = GAME.BACKGROUND_GRID_SIZE;
        const ctx = this.ctx;

        ctx.fillStyle = GAME.BACKGROUND_COLOR;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.strokeStyle = GAME.BACKGROUND_LINE_COLOR;
        ctx.lineWidth = 1;

        // 카메라 위치에 따라 격자 오프셋 계산
        const offsetX = -(this.camera.x % gridSize);
        const offsetY = -(this.camera.y % gridSize);

        // 세로선
        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.canvas.height);
            ctx.stroke();
        }

        // 가로선
        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvas.width, y);
            ctx.stroke();
        }
    }

    /**
     * 일시정지 오버레이
     */
    _renderPauseOverlay() {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2 - 10);

        ctx.font = '16px Arial';
        ctx.fillStyle = '#b0bec5';
        ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 25);
    }

    // ===== 게임 이벤트 =====

    /**
     * 새 게임을 시작한다
     */
    _startGame() {
        // 플레이어 초기화
        this.player.reset(0, 0);

        // 초기 무기: 매직 완드 지급
        const wand = new MagicWand();
        this.player.addWeapon(wand);

        // 초기 경험치 설정
        this.player.expToNext = this.expSystem.getExpToNext(1);

        // 오브젝트 풀 초기화
        this.enemies.releaseAll();
        this.projectiles.releaseAll();
        this.gems.releaseAll();
        this.damageTexts.releaseAll();

        // 시스템 초기화
        this.enemySpawner.reset();
        this.gameTime = 0;

        // 게임 시작!
        this.state = STATE.PLAY;
    }

    /**
     * 레벨업 시 호출된다 (CollisionSystem에서 호출)
     */
    onLevelUp() {
        // 선택지 생성
        this._currentChoices = this.expSystem.generateChoices(this.player);

        // 선택지가 없으면 (모든 것이 최대 레벨) 레벨업 스킵
        if (this._currentChoices.length === 0) {
            this.player.expToNext = this.expSystem.getExpToNext(this.player.level);
            return;
        }

        // 레벨업 UI에 선택지 설정
        this.levelUpUI.setChoices(this._currentChoices);

        // 레벨업 상태로 전환 (게임 일시정지)
        this.state = STATE.LEVELUP;
    }

    /**
     * 플레이어 사망 시 호출된다 (CollisionSystem에서 호출)
     */
    onPlayerDeath() {
        this.state = STATE.GAMEOVER;
    }
}
