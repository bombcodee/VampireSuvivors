/**
 * 스토리지 유틸리티 (Storage)
 * - localStorage를 안전하게 사용하기 위한 래퍼 클래스
 * - JSON 직렬화/역직렬화 + 에러 처리 내장
 * - Safari 비공개 브라우징, 용량 초과 등 모든 예외를 안전하게 처리
 * - Phase 3의 골드/영구 업그레이드/설정 저장에 재사용할 인프라
 *
 * 사용 예:
 *   Storage.save('settings', { volume: 0.8 });
 *   const settings = Storage.load('settings', { volume: 1.0 });
 *   Storage.remove('settings');
 */

// ===== 상수 =====
const _PREFIX = 'vs_';    // 키 접두사 (다른 사이트 데이터와 충돌 방지)
const _VERSION = 1;        // 스키마 버전 (향후 데이터 마이그레이션용)

/**
 * localStorage 래퍼 (static 메서드만 사용)
 */
export class Storage {

    /**
     * 데이터를 localStorage에 저장한다
     * - JSON으로 직렬화하여 저장
     * - 버전 정보를 자동 포함 (향후 마이그레이션용)
     *
     * @param {string} key - 저장 키 (접두사 자동 추가)
     * @param {*} data - 저장할 데이터 (JSON 직렬화 가능한 값)
     * @returns {{ success: boolean, error?: string }}
     */
    static save(key, data) {
        try {
            const wrapped = {
                _version: _VERSION,
                data: data,
                savedAt: Date.now(),
            };
            localStorage.setItem(_PREFIX + key, JSON.stringify(wrapped));
            return { success: true };
        } catch (error) {
            // QuotaExceededError (용량 초과) 또는 Safari 비공개 브라우징
            console.warn(`[Storage] 저장 실패 (${key}):`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * localStorage에서 데이터를 불러온다
     * - 키가 없거나 파싱 실패 시 기본값을 반환
     *
     * @param {string} key - 불러올 키 (접두사 자동 추가)
     * @param {*} defaultValue - 키가 없을 때 반환할 기본값
     * @returns {*} 저장된 데이터 또는 기본값
     */
    static load(key, defaultValue = null) {
        try {
            const raw = localStorage.getItem(_PREFIX + key);
            if (raw === null) return defaultValue;

            const wrapped = JSON.parse(raw);

            // 버전 체크 (향후 마이그레이션 포인트)
            if (wrapped._version && wrapped._version !== _VERSION) {
                console.warn(`[Storage] 버전 불일치 (${key}): v${wrapped._version} → v${_VERSION}`);
                // 현재는 그냥 데이터 반환 (향후 여기에 마이그레이션 로직 추가)
            }

            return wrapped.data !== undefined ? wrapped.data : defaultValue;
        } catch (error) {
            // JSON 파싱 실패 등
            console.warn(`[Storage] 불러오기 실패 (${key}):`, error.message);
            return defaultValue;
        }
    }

    /**
     * localStorage에서 특정 키를 삭제한다
     *
     * @param {string} key - 삭제할 키 (접두사 자동 추가)
     * @returns {{ success: boolean }}
     */
    static remove(key) {
        try {
            localStorage.removeItem(_PREFIX + key);
            return { success: true };
        } catch (error) {
            return { success: false };
        }
    }

    /**
     * 특정 키가 존재하는지 확인한다
     *
     * @param {string} key - 확인할 키 (접두사 자동 추가)
     * @returns {boolean}
     */
    static has(key) {
        try {
            return localStorage.getItem(_PREFIX + key) !== null;
        } catch (error) {
            return false;
        }
    }

    /**
     * 이 게임의 모든 저장 데이터를 삭제한다
     * - 접두사(vs_)가 붙은 키만 삭제 (다른 사이트 데이터는 건드리지 않음)
     *
     * @returns {{ success: boolean, keysRemoved: number }}
     */
    static clear() {
        try {
            const keysToRemove = [];

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(_PREFIX)) {
                    keysToRemove.push(key);
                }
            }

            for (const key of keysToRemove) {
                localStorage.removeItem(key);
            }

            return { success: true, keysRemoved: keysToRemove.length };
        } catch (error) {
            return { success: false, keysRemoved: 0 };
        }
    }

    /**
     * 저장소 사용량을 추정한다 (바이트)
     * - 이 게임의 키(vs_ 접두사)만 계산
     *
     * @returns {{ used: number, keys: number }}
     */
    static getUsage() {
        try {
            let totalBytes = 0;
            let keyCount = 0;

            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(_PREFIX)) {
                    const value = localStorage.getItem(key);
                    // UTF-16 문자 기준 (JS 문자열 1문자 = 2바이트)
                    totalBytes += (key.length + (value ? value.length : 0)) * 2;
                    keyCount++;
                }
            }

            return { used: totalBytes, keys: keyCount };
        } catch (error) {
            return { used: 0, keys: 0 };
        }
    }
}
