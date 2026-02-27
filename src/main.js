/**
 * 게임 진입점 (main.js)
 * - index.html에서 이 파일이 로드되면 게임이 시작된다
 * - 캔버스를 찾아서 Game 인스턴스를 생성하고 게임 루프를 시작한다
 */
import { Game } from './core/Game.js';

// DOM이 로드된 후 게임 초기화
window.addEventListener('DOMContentLoaded', () => {
    // 캔버스 요소 찾기
    const canvas = document.getElementById('gameCanvas');

    if (!canvas) {
        console.error('게임 캔버스를 찾을 수 없습니다! #gameCanvas 요소를 확인하세요.');
        return;
    }

    // 게임 인스턴스 생성 및 시작
    const game = new Game(canvas);
    game.start();

    // 디버그용: 콘솔에서 game 객체에 접근할 수 있도록
    window.__game = game;
});
