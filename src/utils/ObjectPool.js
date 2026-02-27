/**
 * 오브젝트 풀 (Object Pool)
 * - 객체를 미리 만들어두고 재활용하는 성능 최적화 기법
 * - 적, 투사체, 보석 등 대량으로 생성/삭제되는 객체에 사용
 *
 * 원리:
 *   new로 매번 생성 → 메모리 낭비, 가비지 컬렉션으로 끊김
 *   풀에서 꺼내서 쓰고 돌려놓기 → 빠르고 끊김 없음
 *
 * 사용 예:
 *   const pool = new ObjectPool(() => new Enemy(), 100);
 *   const enemy = pool.get();     // 풀에서 꺼냄
 *   pool.release(enemy);          // 다 쓰면 풀에 반환
 */
export class ObjectPool {
    /**
     * @param {Function} createFn - 새 객체를 생성하는 함수 (예: () => new Enemy())
     * @param {number} initialSize - 처음에 미리 만들어둘 개수
     */
    constructor(createFn, initialSize = 50) {
        this._createFn = createFn;
        this._pool = [];       // 비활성(대기 중) 객체들
        this._active = [];     // 활성(사용 중) 객체들

        // 초기 객체를 미리 생성해둔다
        for (let i = 0; i < initialSize; i++) {
            const obj = this._createFn();
            obj.active = false;
            this._pool.push(obj);
        }
    }

    /**
     * 풀에서 비활성 객체를 하나 꺼내 활성화한다
     * - 풀이 비어있으면 새로 생성한다 (자동 확장)
     * @returns {Object} 활성화된 객체
     */
    get() {
        let obj;

        if (this._pool.length > 0) {
            // 풀에 여유분이 있으면 꺼냄
            obj = this._pool.pop();
        } else {
            // 풀이 비었으면 새로 생성 (자동 확장)
            obj = this._createFn();
        }

        obj.active = true;
        this._active.push(obj);
        return obj;
    }

    /**
     * 사용이 끝난 객체를 풀에 반환한다
     * @param {Object} obj - 반환할 객체
     */
    release(obj) {
        obj.active = false;
        const index = this._active.indexOf(obj);
        if (index !== -1) {
            this._active.splice(index, 1);
        }
        this._pool.push(obj);
    }

    /**
     * 현재 활성 상태인 객체 목록을 반환한다
     * @returns {Array} 활성 객체 배열
     */
    getActive() {
        return this._active;
    }

    /**
     * 조건에 맞는 활성 객체들을 한꺼번에 반환(비활성화)한다
     * - 예: 화면 밖으로 나간 투사체들을 한번에 정리
     * @param {Function} conditionFn - 반환 조건 함수 (true면 반환)
     */
    releaseWhere(conditionFn) {
        for (let i = this._active.length - 1; i >= 0; i--) {
            if (conditionFn(this._active[i])) {
                this.release(this._active[i]);
            }
        }
    }

    /**
     * 모든 활성 객체를 풀에 반환한다 (게임 리셋 시 사용)
     */
    releaseAll() {
        while (this._active.length > 0) {
            this.release(this._active[0]);
        }
    }

    /**
     * 디버그용: 현재 풀 상태를 반환한다
     * @returns {{ active: number, inactive: number, total: number }}
     */
    getStats() {
        return {
            active: this._active.length,
            inactive: this._pool.length,
            total: this._active.length + this._pool.length
        };
    }
}
