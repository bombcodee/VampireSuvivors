/**
 * 에러 가드 (ErrorGuard)
 * - 게임이 에러로 멈추지 않도록 보호하는 유틸리티
 * - 엔티티 루프를 안전하게 감싸서, 1개 에러 시 해당 엔티티만 비활성화
 * - 에러 로그를 버퍼에 저장해서 DebugMode에서 확인 가능
 *
 * 사용 예:
 *   // 기존: for (const enemy of enemies) { enemy.update(dt); }
 *   // 변경: ErrorGuard.safeLoopUpdate(enemies, (e) => e.update(dt));
 *   //       → 1마리 에러나도 나머지는 정상 진행
 */

// ===== 에러 로그 버퍼 (모듈 레벨) =====
const _errors = [];          // 최근 에러 목록
const _MAX_ERRORS = 20;      // 최대 저장 개수
const _errorCounts = new Map(); // 중복 에러 카운트 (메시지 → 횟수)

/**
 * 에러 가드 유틸리티 (static 메서드만 사용)
 */
export class ErrorGuard {

    /**
     * 엔티티 배열을 안전하게 순회하며 업데이트한다
     * - 1개 엔티티에서 에러 발생 시: 해당 엔티티만 비활성화, 나머지 정상 진행
     * - 게임이 멈추는 것을 방지하는 핵심 메서드
     *
     * @param {Array} items - 활성 엔티티 배열 (enemies, projectiles 등)
     * @param {Function} updateFn - 각 엔티티에 실행할 함수 (item) => { ... }
     */
    static safeLoopUpdate(items, updateFn) {
        for (const item of items) {
            try {
                updateFn(item);
            } catch (error) {
                // 에러 난 엔티티만 비활성화 (다음 정리 사이클에서 풀로 반환됨)
                item.active = false;
                ErrorGuard.logError('Entity', error);
            }
        }
    }

    /**
     * 엔티티 배열을 안전하게 순회하며 렌더링한다
     * - safeLoopUpdate와 동일하지만, 에러 시 비활성화하지 않음
     * - 렌더 에러는 일시적일 수 있으므로 다음 프레임에 재시도
     *
     * @param {Array} items - 활성 엔티티 배열
     * @param {Function} renderFn - 각 엔티티에 실행할 렌더 함수
     */
    static safeLoopRender(items, renderFn) {
        for (const item of items) {
            try {
                renderFn(item);
            } catch (error) {
                // 렌더 에러는 비활성화하지 않음 (다음 프레임에 복구 가능)
                ErrorGuard.logError('Render', error);
            }
        }
    }

    /**
     * 에러를 로그 버퍼에 기록한다
     * - 같은 메시지의 에러는 중복 카운트로 합침 (로그 폭주 방지)
     * - 최대 _MAX_ERRORS 개까지 저장
     *
     * @param {string} source - 에러 발생 위치 (예: 'GameLoop', 'Weapon:WHIP')
     * @param {Error} error - 에러 객체
     */
    static logError(source, error) {
        const message = error.message || String(error);
        const key = `${source}:${message}`;

        // 중복 에러 카운트 증가
        if (_errorCounts.has(key)) {
            const existing = _errors.find(e => e.key === key);
            if (existing) {
                existing.count++;
                existing.timestamp = Date.now();
                return;
            }
        }

        // 새 에러 추가
        _errorCounts.set(key, true);
        _errors.push({
            key,
            source,
            message,
            timestamp: Date.now(),
            count: 1,
        });

        // 오래된 에러 삭제 (최대 개수 유지)
        while (_errors.length > _MAX_ERRORS) {
            const removed = _errors.shift();
            _errorCounts.delete(removed.key);
        }

        // 콘솔에도 출력 (개발 중 확인용)
        console.warn(`[ErrorGuard] ${source}: ${message}`);
    }

    /**
     * 현재 에러 로그 목록을 반환한다 (DebugMode에서 사용)
     * @returns {Array} 에러 로그 배열 [{ source, message, timestamp, count }, ...]
     */
    static getErrors() {
        return _errors;
    }

    /**
     * 에러 로그를 모두 지운다
     */
    static clearErrors() {
        _errors.length = 0;
        _errorCounts.clear();
    }
}
