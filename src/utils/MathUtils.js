/**
 * 수학 유틸리티 함수 모음
 * - 게임에서 자주 사용하는 수학 계산을 모아놓은 파일
 * - 거리 계산, 방향 정규화, 랜덤 등
 */

/**
 * 두 점 사이의 거리를 계산한다
 * @param {number} x1 - 첫 번째 점의 x좌표
 * @param {number} y1 - 첫 번째 점의 y좌표
 * @param {number} x2 - 두 번째 점의 x좌표
 * @param {number} y2 - 두 번째 점의 y좌표
 * @returns {number} 두 점 사이의 거리
 */
export function distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * 벡터를 정규화한다 (방향은 유지, 크기를 1로)
 * - 대각선 이동 시 속도가 빨라지는 것을 방지할 때 사용
 * @param {number} x - x 성분
 * @param {number} y - y 성분
 * @returns {{ x: number, y: number }} 정규화된 벡터
 */
export function normalize(x, y) {
    const length = Math.sqrt(x * x + y * y);

    // 길이가 0이면 (움직이지 않으면) 그대로 반환
    if (length === 0) {
        return { x: 0, y: 0 };
    }

    return { x: x / length, y: y / length };
}

/**
 * min 이상 max 이하의 랜덤 정수를 반환한다
 * @param {number} min - 최솟값
 * @param {number} max - 최댓값
 * @returns {number} 랜덤 정수
 */
export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * min 이상 max 이하의 랜덤 실수를 반환한다
 * @param {number} min - 최솟값
 * @param {number} max - 최댓값
 * @returns {number} 랜덤 실수
 */
export function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

/**
 * 랜덤 각도를 라디안으로 반환한다 (0 ~ 2π)
 * @returns {number} 라디안 각도
 */
export function randomAngle() {
    return Math.random() * Math.PI * 2;
}

/**
 * 값을 min ~ max 범위로 제한한다 (clamp)
 * - 예: clamp(150, 0, 100) → 100
 * - 예: clamp(-10, 0, 100) → 0
 * @param {number} value - 제한할 값
 * @param {number} min - 최솟값
 * @param {number} max - 최댓값
 * @returns {number} 제한된 값
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * 배열에서 랜덤으로 하나를 선택한다
 * @param {Array} array - 배열
 * @returns {*} 랜덤으로 선택된 요소
 */
export function randomPick(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * 배열을 셔플(무작위 섞기)한다 (Fisher-Yates 알고리즘)
 * - 원본 배열을 변경하지 않고 새 배열을 반환
 * @param {Array} array - 원본 배열
 * @returns {Array} 셔플된 새 배열
 */
export function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
