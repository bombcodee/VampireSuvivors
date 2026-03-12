/**
 * 사운드 매니저 (SoundManager)
 * - Web Audio API 기반 프로시저럴 효과음 시스템
 * - 8종 효과음을 코드로 생성 (외부 파일 없음)
 * - 디바운스로 동시 재생 과부하 방지
 * - GainNode 3단 구조: master → sfx / bgm
 */
import { SOUNDS } from '../data/config.js';

export class SoundManager {
    constructor() {
        // AudioContext는 유저 인터랙션 후 resume 필요
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();

        // ===== GainNode 체인: sfx/bgm → master → destination =====
        this._masterGain = this._ctx.createGain();
        this._masterGain.gain.value = SOUNDS.MASTER_VOLUME;
        this._masterGain.connect(this._ctx.destination);

        this._sfxGain = this._ctx.createGain();
        this._sfxGain.gain.value = SOUNDS.SFX_VOLUME;
        this._sfxGain.connect(this._masterGain);

        this._bgmGain = this._ctx.createGain();
        this._bgmGain.gain.value = SOUNDS.BGM_VOLUME;
        this._bgmGain.connect(this._masterGain);

        // ===== 디바운스 =====
        this._lastPlayTime = {};  // { soundId: timestamp }

        // ===== 보스 BGM 노드 참조 (정지용) =====
        this._bossBgmNodes = [];    // 현재 재생 중인 보스 BGM 오실레이터/게인 목록
        this._bossBgmPlaying = false;
        this._bossBgmTimer = null;  // 루프 패턴 반복용 타이머 ID

        // ===== 음소거 =====
        this._muted = false;
        this._prevMasterVolume = SOUNDS.MASTER_VOLUME;
    }

    /**
     * AudioContext를 resume한다 (유저 인터랙션 후 호출 필수)
     * 브라우저 정책: 유저가 클릭/키 입력 전에는 소리 재생 불가
     */
    resume() {
        if (this._ctx.state === 'suspended') {
            this._ctx.resume();
        }
    }

    /**
     * 효과음을 재생한다
     * @param {string} soundId - 사운드 ID (hit, kill, levelup, evolve, pickup, chest, bosswarn, ui_click)
     */
    play(soundId) {
        if (this._muted) return;

        // 디바운스: 같은 소리가 너무 빨리 반복되면 무시
        const now = this._ctx.currentTime;
        if (this._lastPlayTime[soundId] && now - this._lastPlayTime[soundId] < SOUNDS.DEBOUNCE_TIME) {
            return;
        }
        this._lastPlayTime[soundId] = now;

        // 사운드 ID별 재생
        switch (soundId) {
            case 'hit':      this._playHit(now); break;
            case 'kill':     this._playKill(now); break;
            case 'levelup':  this._playLevelUp(now); break;
            case 'evolve':   this._playEvolve(now); break;
            case 'pickup':   this._playPickup(now); break;
            case 'chest':    this._playChest(now); break;
            case 'bosswarn': this._playBossWarn(now); break;
            case 'draculawarn': this._playDraculaWarn(now); break;
            case 'ui_click': this._playUIClick(now); break;
        }
    }

    /**
     * 볼륨을 설정한다
     * @param {'master'|'sfx'|'bgm'} type - 볼륨 종류
     * @param {number} value - 0.0 ~ 1.0
     */
    setVolume(type, value) {
        const clamped = Math.max(0, Math.min(1, value));
        switch (type) {
            case 'master': this._masterGain.gain.value = clamped; break;
            case 'sfx':    this._sfxGain.gain.value = clamped; break;
            case 'bgm':    this._bgmGain.gain.value = clamped; break;
        }
    }

    /** 음소거 */
    mute() {
        this._muted = true;
        this._prevMasterVolume = this._masterGain.gain.value;
        this._masterGain.gain.value = 0;
    }

    /** 음소거 해제 */
    unmute() {
        this._muted = false;
        this._masterGain.gain.value = this._prevMasterVolume;
    }

    /** 음소거 토글 */
    toggleMute() {
        if (this._muted) this.unmute();
        else this.mute();
    }

    // ========================================
    // 보스 BGM (루프)
    // ========================================

    /**
     * 보스 BGM을 시작한다 (드라큘라 스폰 시)
     * - 어둡고 긴박한 루프: 저음 드론 + 맥동 베이스 + 불협화음 패드
     * - stopBossBGM()으로 정지
     */
    startBossBGM() {
        if (this._bossBgmPlaying || this._muted) return;
        this._bossBgmPlaying = true;

        // --- 레이어 1: 불길한 저음 드론 (sawtooth, 지속) ---
        const drone = this._ctx.createOscillator();
        const droneGain = this._ctx.createGain();
        drone.type = 'sawtooth';
        drone.frequency.value = 45;             // 매우 낮은 음
        droneGain.gain.value = 0.18;
        drone.connect(droneGain).connect(this._bgmGain);
        drone.start();
        this._bossBgmNodes.push(drone, droneGain);

        // --- 레이어 2: 맥동하는 서브베이스 (LFO로 볼륨 변조) ---
        const sub = this._ctx.createOscillator();
        const subGain = this._ctx.createGain();
        sub.type = 'sine';
        sub.frequency.value = 30;               // 깊은 서브베이스
        subGain.gain.value = 0.25;
        sub.connect(subGain).connect(this._bgmGain);
        sub.start();
        this._bossBgmNodes.push(sub, subGain);

        // LFO: 서브베이스 볼륨을 맥동시킨다 (심장박동 느낌)
        const lfo = this._ctx.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 1.5;              // 1.5Hz = 분당 90회 맥동
        const lfoGain = this._ctx.createGain();
        lfoGain.gain.value = 0.15;              // 맥동 깊이
        lfo.connect(lfoGain).connect(subGain.gain);
        lfo.start();
        this._bossBgmNodes.push(lfo, lfoGain);

        // --- 레이어 3: 불협화음 패드 (트라이톤, 지속) ---
        const pad1 = this._ctx.createOscillator();
        const padGain1 = this._ctx.createGain();
        pad1.type = 'triangle';
        pad1.frequency.value = 131;             // C3
        padGain1.gain.value = 0.08;
        pad1.connect(padGain1).connect(this._bgmGain);
        pad1.start();
        this._bossBgmNodes.push(pad1, padGain1);

        const pad2 = this._ctx.createOscillator();
        const padGain2 = this._ctx.createGain();
        pad2.type = 'triangle';
        pad2.frequency.value = 185;             // F#3 (트라이톤 = 악마의 음정)
        padGain2.gain.value = 0.08;
        pad2.connect(padGain2).connect(this._bgmGain);
        pad2.start();
        this._bossBgmNodes.push(pad2, padGain2);

        // --- 레이어 4: 긴박한 리듬 펄스 (4비트 느낌) ---
        this._startBossRhythm();
    }

    /**
     * 보스 BGM 리듬 패턴을 반복 재생한다 (스케줄링 방식)
     * - 0.4초 간격으로 짧은 킥/스내어 느낌의 펄스
     */
    _startBossRhythm() {
        const interval = 0.4;  // 150 BPM 느낌
        const playPulse = () => {
            if (!this._bossBgmPlaying) return;
            const now = this._ctx.currentTime;

            // 킥 (짧은 저음 펄스)
            const kick = this._ctx.createOscillator();
            const kickGain = this._ctx.createGain();
            kick.type = 'sine';
            kick.frequency.setValueAtTime(80, now);
            kick.frequency.exponentialRampToValueAtTime(30, now + 0.1);
            kickGain.gain.setValueAtTime(0.2, now);
            kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            kick.connect(kickGain).connect(this._bgmGain);
            kick.start(now);
            kick.stop(now + 0.15);

            this._bossBgmTimer = setTimeout(playPulse, interval * 1000);
        };
        playPulse();
    }

    /**
     * 보스 BGM을 정지한다 (드라큘라 처치 시)
     */
    stopBossBGM() {
        this._bossBgmPlaying = false;

        // 타이머 정지
        if (this._bossBgmTimer) {
            clearTimeout(this._bossBgmTimer);
            this._bossBgmTimer = null;
        }

        // 모든 오실레이터/게인 노드 정지 + 연결 해제
        for (const node of this._bossBgmNodes) {
            try {
                if (node.stop) node.stop();
                node.disconnect();
            } catch (_) {
                // 이미 정지된 노드는 무시
            }
        }
        this._bossBgmNodes = [];
    }

    // ========================================
    // 프로시저럴 효과음 9종
    // ========================================

    /**
     * 히트음: 짧은 square wave + 빠른 주파수 하강
     * 적에게 투사체가 맞을 때
     */
    _playHit(now) {
        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.05);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain).connect(this._sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * 처치음: 하강하는 square + triangle 이중톤 (뚝 떨어지는 느낌)
     * 적이 사망할 때
     */
    _playKill(now) {
        // 메인 톤: 빠르게 하강하는 square wave
        const osc1 = this._ctx.createOscillator();
        const gain1 = this._ctx.createGain();
        osc1.type = 'square';
        osc1.frequency.setValueAtTime(400, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + 0.12);
        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc1.connect(gain1).connect(this._sfxGain);
        osc1.start(now);
        osc1.stop(now + 0.12);

        // 보조 톤: 짧은 고음 핑 (타격감)
        const osc2 = this._ctx.createOscillator();
        const gain2 = this._ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.value = 600;
        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
        osc2.connect(gain2).connect(this._sfxGain);
        osc2.start(now);
        osc2.stop(now + 0.06);
    }

    /**
     * 레벨업: C-E-G 화음 (밝고 경쾌한 느낌)
     * 플레이어가 레벨업할 때
     */
    _playLevelUp(now) {
        const notes = [523.25, 659.25, 783.99];  // C5, E5, G5
        const duration = 0.3;

        for (let i = 0; i < notes.length; i++) {
            const osc = this._ctx.createOscillator();
            const gain = this._ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = notes[i];

            const startTime = now + i * 0.05;  // 약간씩 딜레이
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

            osc.connect(gain).connect(this._sfxGain);
            osc.start(startTime);
            osc.stop(startTime + duration);
        }
    }

    /**
     * 진화 팡파레: 상승하는 화음 (C→E→G→하이C, 장엄한 느낌)
     * 무기 진화 시
     */
    _playEvolve(now) {
        const notes = [261.63, 329.63, 392.00, 523.25];  // C4, E4, G4, C5
        const duration = 0.5;

        for (let i = 0; i < notes.length; i++) {
            const osc = this._ctx.createOscillator();
            const gain = this._ctx.createGain();

            osc.type = 'sine';
            osc.frequency.value = notes[i];

            const startTime = now + i * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration - i * 0.05);

            osc.connect(gain).connect(this._sfxGain);
            osc.start(startTime);
            osc.stop(startTime + duration);
        }
    }

    /**
     * 보석 수집: 짧은 고음 핑 (맑고 가벼운 느낌)
     * 경험치 보석을 주울 때
     */
    _playPickup(now) {
        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.connect(gain).connect(this._sfxGain);
        osc.start(now);
        osc.stop(now + 0.05);
    }

    /**
     * 상자 오픈: 메탈릭한 이중 톤 (보상 기대감)
     * 보물상자를 열 때
     */
    _playChest(now) {
        // 낮은 톤
        const osc1 = this._ctx.createOscillator();
        const gain1 = this._ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.value = 300;
        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc1.connect(gain1).connect(this._sfxGain);
        osc1.start(now);
        osc1.stop(now + 0.2);

        // 높은 톤 (약간 딜레이)
        const osc2 = this._ctx.createOscillator();
        const gain2 = this._ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.value = 600;
        gain2.gain.setValueAtTime(0, now + 0.05);
        gain2.gain.linearRampToValueAtTime(0.3, now + 0.07);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc2.connect(gain2).connect(this._sfxGain);
        osc2.start(now + 0.05);
        osc2.stop(now + 0.2);
    }

    /**
     * 보스 경고: "두둥..!!" 드라마틱한 이중 타격음
     * 보스가 스폰될 때
     */
    _playBossWarn(now) {
        // === "두" — 첫 번째 타격 (높은 임팩트) ===
        const osc1 = this._ctx.createOscillator();
        const gain1 = this._ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(180, now);
        osc1.frequency.exponentialRampToValueAtTime(80, now + 0.3);
        gain1.gain.setValueAtTime(0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc1.connect(gain1).connect(this._sfxGain);
        osc1.start(now);
        osc1.stop(now + 0.4);

        // 첫 타격 서브베이스 보강
        const sub1 = this._ctx.createOscillator();
        const subGain1 = this._ctx.createGain();
        sub1.type = 'sine';
        sub1.frequency.setValueAtTime(120, now);
        sub1.frequency.exponentialRampToValueAtTime(60, now + 0.3);
        subGain1.gain.setValueAtTime(0.4, now);
        subGain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        sub1.connect(subGain1).connect(this._sfxGain);
        sub1.start(now);
        sub1.stop(now + 0.35);

        // === "둥..!!" — 두 번째 타격 (더 깊고 길게) ===
        const delay = 0.35;
        const osc2 = this._ctx.createOscillator();
        const gain2 = this._ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(150, now + delay);
        osc2.frequency.exponentialRampToValueAtTime(50, now + delay + 0.5);
        gain2.gain.setValueAtTime(0.6, now + delay);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.7);
        osc2.connect(gain2).connect(this._sfxGain);
        osc2.start(now + delay);
        osc2.stop(now + delay + 0.7);

        // 두 번째 서브베이스 보강
        const sub2 = this._ctx.createOscillator();
        const subGain2 = this._ctx.createGain();
        sub2.type = 'sine';
        sub2.frequency.setValueAtTime(100, now + delay);
        sub2.frequency.exponentialRampToValueAtTime(40, now + delay + 0.5);
        subGain2.gain.setValueAtTime(0.5, now + delay);
        subGain2.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);
        sub2.connect(subGain2).connect(this._sfxGain);
        sub2.start(now + delay);
        sub2.stop(now + delay + 0.6);
    }

    /**
     * 드라큘라 경고: 불길한 저음 드론 → 불협화음 → 웅장한 임팩트 (~3초)
     * 29:30 경고 시점 + 드라큘라 스폰 시점에 재생
     */
    _playDraculaWarn(now) {
        // === Phase 1: 불길한 저음 드론 (으르르르...) ===
        const drone = this._ctx.createOscillator();
        const droneGain = this._ctx.createGain();
        drone.type = 'sawtooth';
        drone.frequency.setValueAtTime(55, now);          // A1 (매우 낮은 음)
        drone.frequency.linearRampToValueAtTime(45, now + 2.0);
        droneGain.gain.setValueAtTime(0, now);
        droneGain.gain.linearRampToValueAtTime(0.35, now + 0.3);
        droneGain.gain.setValueAtTime(0.35, now + 1.5);
        droneGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
        drone.connect(droneGain).connect(this._sfxGain);
        drone.start(now);
        drone.stop(now + 3.0);

        // 드론 보강: 서브베이스 (깊은 진동감)
        const subDrone = this._ctx.createOscillator();
        const subDroneGain = this._ctx.createGain();
        subDrone.type = 'sine';
        subDrone.frequency.setValueAtTime(35, now);
        subDrone.frequency.linearRampToValueAtTime(28, now + 2.5);
        subDroneGain.gain.setValueAtTime(0, now);
        subDroneGain.gain.linearRampToValueAtTime(0.4, now + 0.5);
        subDroneGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
        subDrone.connect(subDroneGain).connect(this._sfxGain);
        subDrone.start(now);
        subDrone.stop(now + 3.0);

        // === Phase 2: 불협화음 (트라이톤 — 악마의 음정) ===
        const dissonance1 = this._ctx.createOscillator();
        const disGain1 = this._ctx.createGain();
        dissonance1.type = 'triangle';
        dissonance1.frequency.value = 185;                  // F#3
        disGain1.gain.setValueAtTime(0, now + 0.5);
        disGain1.gain.linearRampToValueAtTime(0.2, now + 0.8);
        disGain1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        dissonance1.connect(disGain1).connect(this._sfxGain);
        dissonance1.start(now + 0.5);
        dissonance1.stop(now + 2.5);

        const dissonance2 = this._ctx.createOscillator();
        const disGain2 = this._ctx.createGain();
        dissonance2.type = 'triangle';
        dissonance2.frequency.value = 131;                  // C3 (트라이톤 관계)
        disGain2.gain.setValueAtTime(0, now + 0.5);
        disGain2.gain.linearRampToValueAtTime(0.2, now + 0.8);
        disGain2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
        dissonance2.connect(disGain2).connect(this._sfxGain);
        dissonance2.start(now + 0.5);
        dissonance2.stop(now + 2.5);

        // === Phase 3: 임팩트 "둥!!!" (최종 타격) ===
        const impact = this._ctx.createOscillator();
        const impactGain = this._ctx.createGain();
        impact.type = 'triangle';
        impact.frequency.setValueAtTime(120, now + 1.8);
        impact.frequency.exponentialRampToValueAtTime(30, now + 3.0);
        impactGain.gain.setValueAtTime(0.7, now + 1.8);
        impactGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
        impact.connect(impactGain).connect(this._sfxGain);
        impact.start(now + 1.8);
        impact.stop(now + 3.0);

        // 임팩트 서브베이스 (진동)
        const impactSub = this._ctx.createOscillator();
        const impactSubGain = this._ctx.createGain();
        impactSub.type = 'sine';
        impactSub.frequency.setValueAtTime(80, now + 1.8);
        impactSub.frequency.exponentialRampToValueAtTime(20, now + 3.0);
        impactSubGain.gain.setValueAtTime(0.6, now + 1.8);
        impactSubGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
        impactSub.connect(impactSubGain).connect(this._sfxGain);
        impactSub.start(now + 1.8);
        impactSub.stop(now + 3.0);
    }

    /**
     * UI 클릭: 부드러운 짧은 클릭 (거슬리지 않는 느낌)
     * 메뉴/레벨업 등 UI 조작 시
     */
    _playUIClick(now) {
        const osc = this._ctx.createOscillator();
        const gain = this._ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.06);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain).connect(this._sfxGain);
        osc.start(now);
        osc.stop(now + 0.06);
    }
}
