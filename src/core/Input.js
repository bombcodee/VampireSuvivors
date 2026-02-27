/**
 * 입력 처리 클래스 (Input)
 * - 키보드와 마우스 입력을 추적한다
 * - 어떤 키가 눌려있는지, 마우스가 어디 있는지 알 수 있다
 * - 게임 전체에서 하나만 존재 (Game이 소유)
 */
import { normalize } from '../utils/MathUtils.js';

export class Input {
    constructor(canvas) {
        // 현재 눌려있는 키를 저장하는 Set (집합)
        this._keysDown = new Set();

        // 이번 프레임에 새로 눌린 키 (한 번만 감지용)
        this._keysPressed = new Set();

        // 마우스 위치 (캔버스 기준 좌표)
        this.mouseX = 0;
        this.mouseY = 0;

        // 마우스 클릭 여부
        this.mouseClicked = false;

        // 캔버스 참조 (마우스 좌표 변환용)
        this._canvas = canvas;

        // 이벤트 리스너 등록
        this._setupListeners();
    }

    /**
     * 키보드/마우스 이벤트 리스너를 등록한다
     */
    _setupListeners() {
        // 키 누름
        window.addEventListener('keydown', (e) => {
            // 이미 눌려있지 않은 키만 "새로 눌림"으로 등록
            if (!this._keysDown.has(e.code)) {
                this._keysPressed.add(e.code);
            }
            this._keysDown.add(e.code);

            // 브라우저 기본 동작 방지 (스크롤, 탭 이동, F1 도움말 등)
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'F1'].includes(e.code)) {
                e.preventDefault();
            }
        });

        // 키 뗌
        window.addEventListener('keyup', (e) => {
            this._keysDown.delete(e.code);
        });

        // 마우스 이동
        this._canvas.addEventListener('mousemove', (e) => {
            const rect = this._canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
        });

        // 마우스 클릭
        this._canvas.addEventListener('click', (e) => {
            const rect = this._canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            this.mouseClicked = true;
        });

        // 창이 포커스를 잃으면 모든 키 해제 (탭 전환 시 키 고정 방지)
        window.addEventListener('blur', () => {
            this._keysDown.clear();
        });
    }

    /**
     * 매 프레임 끝에 호출하여 "이번 프레임" 상태를 초기화한다
     * - isKeyPressed는 누른 순간 1프레임만 true
     * - mouseClicked도 클릭한 순간 1프레임만 true
     */
    update() {
        this._keysPressed.clear();
        this.mouseClicked = false;
    }

    /**
     * 특정 키가 현재 눌려있는지 확인한다 (누르고 있는 동안 계속 true)
     * @param {string} code - 키 코드 (예: 'KeyW', 'ArrowUp', 'Space')
     * @returns {boolean}
     */
    isKeyDown(code) {
        return this._keysDown.has(code);
    }

    /**
     * 특정 키가 이번 프레임에 새로 눌렸는지 확인한다 (누른 순간 1프레임만 true)
     * - 메뉴 선택, 일시정지 토글 등에 사용
     * @param {string} code - 키 코드
     * @returns {boolean}
     */
    isKeyPressed(code) {
        return this._keysPressed.has(code);
    }

    /**
     * WASD / 방향키 입력을 정규화된 방향 벡터로 반환한다
     * - 대각선 이동 시에도 속도가 일정하도록 정규화
     * @returns {{ x: number, y: number }} 방향 벡터 (-1~1 범위)
     */
    getDirection() {
        let x = 0;
        let y = 0;

        // 왼쪽 (A 또는 ←)
        if (this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) {
            x -= 1;
        }
        // 오른쪽 (D 또는 →)
        if (this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) {
            x += 1;
        }
        // 위쪽 (W 또는 ↑)
        if (this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) {
            y -= 1;
        }
        // 아래쪽 (S 또는 ↓)
        if (this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) {
            y += 1;
        }

        // 대각선 이동 시 속도 정규화 (1.414배 빨라지는 것 방지)
        return normalize(x, y);
    }
}
