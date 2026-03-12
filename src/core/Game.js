/**
 * 게임 매니저 (Game) - 싱글톤
 * - 게임 전체를 관리하는 "사령탑"
 * - 모든 시스템을 소유하고 매 프레임 업데이트/렌더를 지휘한다
 * - 게임 상태(MENU, CHARSELECT, SHOP, PLAY, LEVELUP, PAUSE, GAMEOVER, VICTORY) 관리
 */
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME, POOL_SIZES, CHARACTERS } from '../data/config.js';
import { Input } from './Input.js';
import { Camera } from './Camera.js';
import { Player } from '../entities/Player.js';
import { Enemy } from '../entities/Enemy.js';
import { Gem } from '../entities/Gem.js';
import { Projectile } from '../entities/Projectile.js';
import { DamageText } from '../entities/DamageText.js';
import { Chest } from '../entities/Chest.js';
import { ObjectPool } from '../utils/ObjectPool.js';
import { EnemySpawner } from '../systems/EnemySpawner.js';
import { ExpSystem } from '../systems/ExpSystem.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { EvolutionSystem } from '../systems/EvolutionSystem.js';
import { HUD } from '../ui/HUD.js';
import { LevelUpUI } from '../ui/LevelUpUI.js';
import { EvolutionUI } from '../ui/EvolutionUI.js';
import { MenuUI } from '../ui/MenuUI.js';
import { GameOverUI } from '../ui/GameOverUI.js';
import { VictoryUI } from '../ui/VictoryUI.js';
import { CharSelectUI } from '../ui/CharSelectUI.js';
import { PauseUI } from '../ui/PauseUI.js';
import { UpgradeShopUI } from '../ui/UpgradeShopUI.js';
import { UpgradeSystem } from '../systems/UpgradeSystem.js';
import { Storage } from '../utils/Storage.js';
import { DebugMode } from './DebugMode.js';
import { SoundManager } from './SoundManager.js';
import { ParticlePool } from '../effects/ParticlePool.js';
import { ScreenEffects } from '../effects/ScreenEffects.js';
import { ErrorGuard } from '../utils/ErrorGuard.js';

/**
 * 게임 상태 열거값
 * - 게임은 항상 이 7가지 상태 중 하나
 */
const STATE = {
    MENU: 'MENU',
    CHARSELECT: 'CHARSELECT',
    SHOP: 'SHOP',
    PLAY: 'PLAY',
    LEVELUP: 'LEVELUP',
    EVOLUTION: 'EVOLUTION',
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
        this.chests = new ObjectPool(() => new Chest(), POOL_SIZES.CHESTS);

        // ===== 게임 시스템 =====
        this.enemySpawner = new EnemySpawner();
        this.expSystem = new ExpSystem();
        this.collisionSystem = new CollisionSystem();
        this.evolutionSystem = new EvolutionSystem();
        this.upgradeSystem = new UpgradeSystem();

        // ===== 골드 =====
        this.totalGold = Storage.load('gold', 0);  // 누적 보유 골드
        this.goldEarned = 0;                        // 현재 런 획득 골드

        // ===== UI =====
        this.hud = new HUD();
        this.levelUpUI = new LevelUpUI();
        this.evolutionUI = new EvolutionUI();
        this.menuUI = new MenuUI();
        this.charSelectUI = new CharSelectUI();
        this.gameOverUI = new GameOverUI();
        this.victoryUI = new VictoryUI();
        this.pauseUI = new PauseUI();
        this.upgradeShopUI = new UpgradeShopUI();

        // ===== 레벨업 선택지 =====
        this._currentChoices = [];

        // ===== VFX =====
        this.particles = new ParticlePool();
        this.screenFx = new ScreenEffects();

        // ===== 사운드 =====
        this.sound = new SoundManager();

        // ===== 디버그 모드 =====
        this.debug = new DebugMode();

        // 게임 루프를 미리 바인딩 (매 프레임 새 함수 생성 방지)
        this._gameLoop = this._gameLoop.bind(this);

        // AudioContext resume (브라우저 정책: 첫 유저 입력 필요)
        this._setupAudioResume();
    }

    /**
     * AudioContext resume을 위한 이벤트 리스너 등록
     * 브라우저 정책: 유저가 클릭/키 입력 전에는 소리 재생 불가
     */
    _setupAudioResume() {
        const resume = () => {
            this.sound.resume();
            this.canvas.removeEventListener('click', resume);
            document.removeEventListener('keydown', resume);
        };
        this.canvas.addEventListener('click', resume);
        document.addEventListener('keydown', resume);
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
        try {
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
        } catch (error) {
            // 치명적 에러 발생 시 로그만 남기고 루프는 계속 진행
            ErrorGuard.logError('GameLoop', error);
        }

        // 다음 프레임 예약 (try 밖 — 루프는 절대 죽지 않음)
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
            case STATE.CHARSELECT:
                this._updateCharSelect();
                break;
            case STATE.SHOP:
                this._updateShop(dt);
                break;
            case STATE.PLAY:
                this._updatePlay(dt);
                break;
            case STATE.LEVELUP:
                this._updateLevelUp(dt);
                break;
            case STATE.EVOLUTION:
                this._updateEvolution();
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
                this.menuUI.render(this.ctx, this.canvas.width, this.canvas.height, this.totalGold);
                break;

            case STATE.CHARSELECT:
                this.charSelectUI.render(this.ctx, this.canvas.width, this.canvas.height);
                break;

            case STATE.SHOP:
                this.upgradeShopUI.render(this.ctx, this.canvas.width, this.canvas.height);
                break;

            case STATE.PLAY:
            case STATE.PAUSE:
                this._renderGame();
                this.hud.render(this.ctx, this);
                this.screenFx.render(this.ctx, this.canvas.width, this.canvas.height);
                this.debug.render(this.ctx, this);
                if (this.state === STATE.PAUSE) {
                    this._renderPauseOverlay();
                }
                break;

            case STATE.LEVELUP:
                this._renderGame();
                this.hud.render(this.ctx, this);
                this.screenFx.render(this.ctx, this.canvas.width, this.canvas.height);
                this.levelUpUI.render(this.ctx, this.canvas.width, this.canvas.height);
                break;

            case STATE.EVOLUTION:
                this._renderGame();
                this.hud.render(this.ctx, this);
                this.screenFx.render(this.ctx, this.canvas.width, this.canvas.height);
                this.evolutionUI.render(this.ctx, this.canvas.width, this.canvas.height);
                break;

            case STATE.GAMEOVER:
                this._renderGame();
                this.gameOverUI.render(this.ctx, this.canvas.width, this.canvas.height, {
                    gameTime: this.gameTime,
                    level: this.player.level,
                    killCount: this.player.killCount,
                    totalExp: this.player.totalExp,
                    goldEarned: this.goldEarned,
                });
                break;

            case STATE.VICTORY:
                this._renderGame();
                this.victoryUI.render(this.ctx, this.canvas.width, this.canvas.height, {
                    gameTime: this.gameTime,
                    level: this.player.level,
                    killCount: this.player.killCount,
                    totalExp: this.player.totalExp,
                    goldEarned: this.goldEarned,
                });
                break;
        }
    }

    // ===== 상태별 업데이트 메서드 =====

    _updateMenu(dt) {
        this.menuUI.update(dt);

        if (this.input.isKeyPressed('Enter') || this.input.isKeyPressed('Space')) {
            this.sound.play('ui_click');
            this.charSelectUI.selectedIndex = 0; // 선택 초기화
            this.state = STATE.CHARSELECT;
        }

        // S키 → 상점
        if (this.input.isKeyPressed('KeyS')) {
            this.sound.play('ui_click');
            this.upgradeShopUI.selectedIndex = 0;
            this.upgradeShopUI.refresh(this.upgradeSystem.getAll(), this.totalGold);
            this.state = STATE.SHOP;
        }
    }

    _updateShop(dt) {
        const result = this.upgradeShopUI.update(this.input, dt);

        if (result.action === 'close') {
            this.state = STATE.MENU;
        } else if (result.action === 'purchase') {
            const { success, remainingGold } = this.upgradeSystem.purchase(result.upgradeId, this.totalGold);
            if (success) {
                this.totalGold = remainingGold;
                Storage.save('gold', this.totalGold);
                // UI 새로고침
                this.upgradeShopUI.refresh(this.upgradeSystem.getAll(), this.totalGold);
            }
        }
    }

    _updateCharSelect() {
        const characterId = this.charSelectUI.update(this.input);
        if (characterId) {
            this._startGame(characterId);
        }
    }

    _updatePlay(dt) {
        // 일시정지 체크
        if (this.input.isKeyPressed('Escape')) {
            this.state = STATE.PAUSE;
            return;
        }

        // Hit Freeze: 프리즈 중이면 타이머만 감소하고 업데이트 스킵
        this.screenFx.update(dt);
        if (this.screenFx.isFrozen) return;

        // 게임 시간 증가
        this.gameTime += dt;

        // 30분 자동 승리 제거 — 드라큘라를 처치해야 승리
        // (EnemySpawner가 30분에 드라큘라를 스폰한다)

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
        this.enemySpawner.update(dt, this.player, this.enemies, this.gameTime, this);

        // 적 업데이트 (이동) — 1마리 에러 시 해당 적만 비활성화
        ErrorGuard.safeLoopUpdate(this.enemies.getActive(), (enemy) => {
            enemy.update(dt, this.player.x, this.player.y);
        });

        // 투사체 업데이트 (이동)
        ErrorGuard.safeLoopUpdate(this.projectiles.getActive(), (proj) => {
            proj.update(dt);
        });

        // 보석 업데이트 (자석 효과)
        ErrorGuard.safeLoopUpdate(this.gems.getActive(), (gem) => {
            gem.update(dt, this.player.x, this.player.y, this.player.currentPickupRange);
        });

        // 데미지 텍스트 업데이트
        ErrorGuard.safeLoopUpdate(this.damageTexts.getActive(), (text) => {
            text.update(dt);
        });

        // 상자 업데이트
        ErrorGuard.safeLoopUpdate(this.chests.getActive(), (chest) => {
            chest.update(dt);
        });

        // 충돌 판정 (내부에서 비활성 투사체/보석 정리도 수행)
        this.collisionSystem.update(this);

        // 파티클 업데이트
        this.particles.update(dt);

        // 비활성 오브젝트 정리 (수명 만료 보석 포함)
        this.gems.releaseWhere(g => !g.active);
        this.damageTexts.releaseWhere(t => !t.active);
        this.enemies.releaseWhere(e => !e.active);
        this.chests.releaseWhere(c => !c.active);
    }

    _updateLevelUp() {
        const selectedIndex = this.levelUpUI.update(
            this.input,
            this.canvas.width,
            this.canvas.height
        );

        if (selectedIndex >= 0 && selectedIndex < this._currentChoices.length) {
            this.sound.play('ui_click');

            // 선택 적용
            this.expSystem.applyChoice(this.player, this._currentChoices[selectedIndex]);

            // 다음 레벨 필요 경험치 설정
            this.player.expToNext = this.expSystem.getExpToNext(this.player.level);

            // 게임 재개
            this.state = STATE.PLAY;
        }
    }

    _updateEvolution() {
        const selectedIndex = this.evolutionUI.update(
            this.input,
            this.canvas.width,
            this.canvas.height
        );

        if (selectedIndex >= 0) {
            if (this.evolutionUI.isFallback) {
                this.sound.play('ui_click');
                // 폴백 보상 적용
                this.evolutionSystem.applyFallbackReward(this.player);
            } else {
                this.sound.play('evolve');
                this.particles.emit(this.player.x, this.player.y, 'EVOLUTION_FLASH');
                this.screenFx.flash('#ffd700', 0.2);
                // 진화 실행
                const evo = this.evolutionUI.evolutions[selectedIndex];
                if (evo) {
                    this.evolutionSystem.evolveWeapon(this.player, evo.id);
                }
            }
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
            this.sound.play('ui_click');
            this._saveGold();
            this.state = STATE.MENU;
        }
    }

    _updateVictory(dt) {
        this.victoryUI.update(dt);

        if (this.input.isKeyPressed('Enter') || this.input.isKeyPressed('Space')) {
            this.sound.play('ui_click');
            this._saveGold();
            this.state = STATE.MENU;
        }
    }

    /**
     * 런에서 획득한 골드를 누적 저장한다
     */
    _saveGold() {
        if (this.goldEarned > 0) {
            this.totalGold += this.goldEarned;
            Storage.save('gold', this.totalGold);
            this.goldEarned = 0;
        }
    }

    // ===== 게임 월드 렌더링 =====

    _renderGame() {
        // 배경 격자
        this._renderBackground();

        // 무기 이펙트 렌더 (갈릭 범위, 채찍 호 등)
        ErrorGuard.safeLoopRender(this.player.weapons, (weapon) => {
            if (weapon.render) {
                weapon.render(this.ctx, this.camera, this.player.x, this.player.y);
            }
        });

        // 상자
        ErrorGuard.safeLoopRender(this.chests.getActive(), (chest) => {
            chest.render(this.ctx, this.camera);
        });

        // 보석
        ErrorGuard.safeLoopRender(this.gems.getActive(), (gem) => {
            gem.render(this.ctx, this.camera);
        });

        // 적
        ErrorGuard.safeLoopRender(this.enemies.getActive(), (enemy) => {
            enemy.render(this.ctx, this.camera);
        });

        // 플레이어
        this.player.render(this.ctx, this.camera);

        // 투사체
        ErrorGuard.safeLoopRender(this.projectiles.getActive(), (proj) => {
            proj.render(this.ctx, this.camera);
        });

        // 데미지 텍스트
        ErrorGuard.safeLoopRender(this.damageTexts.getActive(), (text) => {
            text.render(this.ctx, this.camera);
        });

        // 파티클
        this.particles.render(this.ctx, this.camera);
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
     * 일시정지 오버레이 (PauseUI에 위임)
     */
    _renderPauseOverlay() {
        this.pauseUI.render(this.ctx, this.canvas.width, this.canvas.height, this.player, this.upgradeSystem);
    }

    // ===== 게임 이벤트 =====

    /**
     * 새 게임을 시작한다
     */
    _startGame(characterId) {
        // 플레이어 초기화
        this.player.reset(0, 0);

        // 캐릭터 보너스 적용
        this.player.applyCharacter(characterId);

        // 영구 업그레이드 보너스 적용 (캐릭터 보너스 이후)
        this.upgradeSystem.applyToPlayer(this.player);

        // 런 골드 초기화
        this.goldEarned = 0;

        // 캐릭터의 시작 무기 지급
        const startWeaponId = CHARACTERS[characterId].START_WEAPON;
        const WeaponClass = this.expSystem._weaponClasses[startWeaponId];
        const startWeapon = new WeaponClass();
        this.player.addWeapon(startWeapon);

        // 초기 경험치 설정
        this.player.expToNext = this.expSystem.getExpToNext(1);

        // 오브젝트 풀 초기화
        this.enemies.releaseAll();
        this.projectiles.releaseAll();
        this.gems.releaseAll();
        this.damageTexts.releaseAll();
        this.chests.releaseAll();

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
        this.sound.play('levelup');
        this.particles.emit(this.player.x, this.player.y, 'LEVELUP_RING');
        this.screenFx.flash('#ffffff', 0.15);

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
     * 상자 수집 시 호출된다 (CollisionSystem에서 호출)
     * - 진화 가능 무기 체크 → EVOLUTION 상태 전환
     */
    onChestPickup() {
        this.sound.play('chest');
        const eligible = this.evolutionSystem.getEligibleEvolutions(this.player);
        this.evolutionUI.setEvolutions(eligible);
        this.state = STATE.EVOLUTION;
    }

    /**
     * 드라큘라(최종 보스) 처치 시 호출된다 (Enemy.onDeath에서 호출)
     * - 화면 효과 + 승리 처리
     */
    onDraculaKilled() {
        this.sound.stopBossBGM();       // 보스 BGM 정지
        this.sound.play('evolve');
        this.particles.emit(this.player.x, this.player.y, 'EVOLUTION_FLASH');
        this.screenFx.flash('#ffffff', 0.3);
        this.state = STATE.VICTORY;
    }

    /**
     * 플레이어 사망 시 호출된다 (CollisionSystem에서 호출)
     */
    onPlayerDeath() {
        this.sound.stopBossBGM();       // 보스 BGM 정지 (드라큘라전 중 사망 대비)
        this.state = STATE.GAMEOVER;
    }
}
