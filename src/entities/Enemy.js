/**
 * 적(Enemy) 클래스
 * - 플레이어를 향해 이동하고, 접촉 시 데미지를 준다
 * - 사망 시 경험치 보석을 드롭한다
 * - 오브젝트 풀에서 재사용된다
 */
import { normalize } from '../utils/MathUtils.js';
import { GOLD } from '../data/config.js';

export class Enemy {
    constructor() {
        // ===== 위치/크기 =====
        this.x = 0;
        this.y = 0;
        this.radius = 12;

        // ===== 스탯 =====
        this.hp = 10;
        this.maxHp = 10;
        this.speed = 80;
        this.damage = 5;
        this.expValue = 1;

        // ===== 상태 =====
        this.active = false;        // 오브젝트 풀 활성 상태
        this.color = '#ef5350';
        this.type = 'BAT';          // 적 타입명

        // ===== 피격 이펙트 =====
        this.flashTimer = 0;        // 피격 시 흰색 깜빡
        this.knockbackX = 0;        // 넉백 속도 X
        this.knockbackY = 0;        // 넉백 속도 Y
    }

    /**
     * 적을 초기화한다 (오브젝트 풀에서 꺼낼 때 호출)
     * @param {number} x - 스폰 X 위치
     * @param {number} y - 스폰 Y 위치
     * @param {Object} stats - 적 스탯 객체 (config.js의 ENEMY.BAT 등)
     * @param {string} type - 적 타입명
     */
    init(x, y, stats, type) {
        this.x = x;
        this.y = y;
        this.hp = stats.HP;
        this.maxHp = stats.HP;
        this.speed = stats.SPEED;
        this.damage = stats.DAMAGE;
        this.radius = stats.RADIUS;
        this.color = stats.COLOR;
        this.expValue = stats.EXP_VALUE;
        this.type = type;
        this.active = true;
        this.flashTimer = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
    }

    /**
     * 매 프레임 적의 상태를 업데이트한다
     * @param {number} dt - 델타타임 (초)
     * @param {number} playerX - 플레이어 X 위치
     * @param {number} playerY - 플레이어 Y 위치
     */
    update(dt, playerX, playerY) {
        if (!this.active) return;

        // 넉백 처리
        const isKnockedBack = (this.knockbackX !== 0 || this.knockbackY !== 0);
        if (isKnockedBack) {
            this.x += this.knockbackX * dt;
            this.y += this.knockbackY * dt;
            // 프레임레이트 독립적인 넉백 감쇠
            const decay = Math.pow(0.005, dt); // dt초 후 남는 비율
            this.knockbackX *= decay;
            this.knockbackY *= decay;
            if (Math.abs(this.knockbackX) < 1) this.knockbackX = 0;
            if (Math.abs(this.knockbackY) < 1) this.knockbackY = 0;
        }

        // 넉백 중이 아닐 때만 플레이어를 향해 이동
        if (!isKnockedBack) {
            const dir = normalize(playerX - this.x, playerY - this.y);
            this.x += dir.x * this.speed * dt;
            this.y += dir.y * this.speed * dt;
        }

        // 피격 플래시 타이머 감소
        if (this.flashTimer > 0) {
            this.flashTimer -= dt;
        }
    }

    /**
     * 적을 화면에 그린다
     * @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
     * @param {Camera} camera - 카메라
     */
    render(ctx, camera) {
        if (!this.active) return;

        // 카메라 밖이면 렌더링 스킵 (성능 최적화)
        if (!camera.isVisible(this.x, this.y)) return;

        const screen = camera.worldToScreen(this.x, this.y);

        ctx.save();

        // 피격 시 흰색 플래시
        if (this.flashTimer > 0) {
            ctx.fillStyle = '#ffffff';
        } else {
            ctx.fillStyle = this.color;
        }

        // 몸체 (원)
        ctx.beginPath();
        ctx.arc(screen.x, screen.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // 보스는 테두리 추가
        if (this.type === 'BOSS') {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
        }

        // 체력바 (보스이거나 HP가 풀이 아닐 때)
        if (this.type === 'BOSS' || this.hp < this.maxHp) {
            const barWidth = this.radius * 2;
            const barHeight = 3;
            const barX = screen.x - barWidth / 2;
            const barY = screen.y - this.radius - 8;
            const hpRatio = this.hp / this.maxHp;

            // 배경 (회색)
            ctx.fillStyle = '#424242';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // 체력 (빨강)
            ctx.fillStyle = '#ef5350';
            ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
        }

        ctx.restore();
    }

    /**
     * 적이 피해를 받는다
     * @param {number} amount - 피해량
     * @param {number} [fromX] - 공격 출발 X (넉백 방향 계산용)
     * @param {number} [fromY] - 공격 출발 Y
     * @returns {boolean} 사망했으면 true
     */
    takeDamage(amount, fromX, fromY) {
        if (!this.active) return false;

        this.hp -= amount;
        this.flashTimer = 0.1;

        // 넉백 (공격 반대 방향으로 밀기)
        if (fromX !== undefined && fromY !== undefined) {
            const dir = normalize(this.x - fromX, this.y - fromY);
            this.knockbackX = dir.x * 200;
            this.knockbackY = dir.y * 200;
        }

        return this.hp <= 0;
    }

    /**
     * 적 사망 시 일괄 처리 (킬 카운트, 골드, 보석, 상자)
     * - 모든 무기/시스템에서 적이 죽으면 이 메서드만 호출한다
     * @param {Object} game - Game 인스턴스
     */
    onDeath(game) {
        if (!this.active) return;

        game.sound.play('kill');

        // 킬 카운트 증가
        game.player.killCount++;

        // 골드 획득
        game.goldEarned += this._calcGoldValue(game);

        // 경험치 보석 드롭
        const gem = game.gems.get();
        gem.init(this.x, this.y, this.expValue);

        // 보스 사망 시 상자 드롭
        if (this.type === 'BOSS') {
            const chest = game.chests.get();
            chest.init(this.x, this.y);
        }

        // 적 비활성화
        this.active = false;
    }

    /**
     * 적 처치 시 획득 골드를 계산한다
     * @param {Object} game - Game 인스턴스
     * @returns {number} 획득 골드
     */
    _calcGoldValue(game) {
        const baseGold = GOLD[this.type] || 1;

        // 시간 보너스: 5분마다 +20%, 최대 +120%
        const timeBonusStacks = Math.floor(game.gameTime / GOLD.TIME_BONUS_INTERVAL);
        const timeBonus = 1 + Math.min(timeBonusStacks * GOLD.TIME_BONUS_RATE, GOLD.TIME_BONUS_MAX);

        // 골드 배율 (영구 업그레이드)
        return Math.floor(baseGold * timeBonus * game.player.goldMultiplier);
    }
}
