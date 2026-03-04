/**
 * 게임 설정 파일 (Config)
 * - 모든 게임 수치를 한 곳에서 관리한다
 * - 밸런스 조정 시 이 파일만 수정하면 된다
 * - 코드에 직접 숫자를 쓰지 않고(매직넘버 금지) 여기서 가져다 쓴다
 */

// ===== 캔버스/화면 설정 =====
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

// ===== 플레이어 설정 =====
export const PLAYER = {
    SPEED: 200,             // 이동 속도 (px/초)
    MAX_HP: 100,            // 최대 체력
    RADIUS: 16,             // 충돌 반경 (px)
    COLOR: '#4fc3f7',       // 플레이어 색상 (하늘색)
    INVINCIBLE_TIME: 1.0,   // 피격 후 무적 시간 (초)
    PICKUP_RANGE: 60,       // 보석 자동 흡수 범위 (px)
};

// ===== 캐릭터 설정 =====
export const CHARACTERS = {
    ANTONIO: {
        NAME: 'Antonio',
        DESCRIPTION: '공격력 +10%',
        COLOR: '#4fc3f7',       // 하늘색
        BONUS: { stat: 'damageMultiplier', value: 0.1 },
        START_WEAPON: 'MAGIC_WAND',
    },
    IMELDA: {
        NAME: 'Imelda',
        DESCRIPTION: '경험치 +10%',
        COLOR: '#ce93d8',       // 보라색
        BONUS: { stat: 'expMultiplier', value: 0.1 },
        START_WEAPON: 'MAGIC_WAND',
    },
    PASQUALINA: {
        NAME: 'Pasqualina',
        DESCRIPTION: '투사체 속도 +10%',
        COLOR: '#ffab91',       // 연한 주황
        BONUS: { stat: 'projSpeedMultiplier', value: 0.1 },
        START_WEAPON: 'KNIFE',
    },
};

// ===== 적(Enemy) 설정 =====
export const ENEMY = {
    // 기본 적 (박쥐)
    BAT: {
        HP: 10,
        SPEED: 85,
        DAMAGE: 5,
        RADIUS: 12,
        COLOR: '#ef5350',       // 빨간색
        EXP_VALUE: 1,           // 드롭 경험치
    },
    // 중간 적 (좀비)
    ZOMBIE: {
        HP: 25,
        SPEED: 50,
        DAMAGE: 10,
        RADIUS: 16,
        COLOR: '#ab47bc',       // 보라색
        EXP_VALUE: 3,
    },
    // 강한 적 (스켈레톤)
    SKELETON: {
        HP: 50,
        SPEED: 60,
        DAMAGE: 15,
        RADIUS: 18,
        COLOR: '#ffee58',       // 노란색
        EXP_VALUE: 5,
    },
    // 보스
    BOSS: {
        HP: 1500,
        SPEED: 40,
        DAMAGE: 30,
        RADIUS: 40,
        COLOR: '#ff1744',       // 진한 빨강
        EXP_VALUE: 50,
    },
};

// ===== 적 스폰 설정 =====
export const SPAWNER = {
    SPAWN_DISTANCE: 500,        // 플레이어로부터 스폰 거리 (px)
    INITIAL_INTERVAL: 1.5,      // 초기 스폰 간격 (초)
    MIN_INTERVAL: 0.3,          // 최소 스폰 간격 (초)
    MAX_ENEMIES: 200,           // 최대 동시 적 수
    DESPAWN_DISTANCE: 800,      // 이 거리 이상 멀어지면 디스폰 (px)
    // 시간대별 스폰 설정 (초 단위) — 10분(600초) 전체 커버
    WAVES: [
        { time: 0,   types: ['BAT'],                spawnCount: 1, interval: 1.5 },
        { time: 30,  types: ['BAT'],                spawnCount: 2, interval: 1.2 },
        { time: 60,  types: ['BAT', 'ZOMBIE'],      spawnCount: 2, interval: 1.0 },
        { time: 120, types: ['BAT', 'ZOMBIE'],      spawnCount: 3, interval: 0.8 },
        { time: 180, types: ['ZOMBIE', 'SKELETON'], spawnCount: 3, interval: 0.6 },
        { time: 240, types: ['ZOMBIE', 'SKELETON'], spawnCount: 4, interval: 0.5 },
        { time: 300, types: ['SKELETON'],           spawnCount: 5, interval: 0.4 },
        // 후반 웨이브 (보스 이후, 더 어려워짐)
        { time: 360, types: ['SKELETON', 'ZOMBIE'], spawnCount: 6, interval: 0.35 },
        { time: 420, types: ['SKELETON'],           spawnCount: 7, interval: 0.3 },
        { time: 480, types: ['SKELETON'],           spawnCount: 8, interval: 0.25 },
        { time: 540, types: ['SKELETON'],           spawnCount: 10, interval: 0.2 },
    ],
    BOSS_SPAWN_TIME: 300,       // 보스 등장 시간 (5분 = 300초)
    // 시간 경과에 따른 적 스탯 스케일링 (5분 이후 적용)
    SCALING_START_TIME: 300,    // 스케일링 시작 시간 (초)
    SCALING_HP_PER_MIN: 0.15,   // 분당 HP 증가율 (15%)
    SCALING_DMG_PER_MIN: 0.10,  // 분당 데미지 증가율 (10%)
    SCALING_SPD_PER_MIN: 0.12,  // 분당 이동속도 증가율 (12%)
};

// ===== 무기 설정 =====
export const WEAPONS = {
    // 매직 완드: 가장 가까운 적에게 투사체 발사
    MAGIC_WAND: {
        NAME: 'Magic Wand',
        DESCRIPTION: '가장 가까운 적에게 투사체를 발사한다',
        COLOR: '#ffab40',       // 주황색 투사체
        LEVELS: [
            { damage: 10, cooldown: 1.0, speed: 350, count: 1, size: 6 },
            { damage: 15, cooldown: 0.9, speed: 370, count: 1, size: 7 },
            { damage: 15, cooldown: 0.85, speed: 390, count: 2, size: 7 },
            { damage: 20, cooldown: 0.75, speed: 410, count: 2, size: 8 },
            { damage: 25, cooldown: 0.65, speed: 430, count: 3, size: 9 },
        ],
        MAX_LEVEL: 5,
    },
    // 갈릭(마늘): 플레이어 주변 범위 피해
    GARLIC: {
        NAME: 'Garlic',
        DESCRIPTION: '주변의 적에게 지속적으로 피해를 준다',
        COLOR: 'rgba(200, 230, 201, 0.3)',  // 연두색 반투명
        LEVELS: [
            { damage: 5, cooldown: 1.0, radius: 80, knockback: 10 },
            { damage: 7, cooldown: 0.9, radius: 90, knockback: 15 },
            { damage: 9, cooldown: 0.8, radius: 100, knockback: 20 },
            { damage: 12, cooldown: 0.7, radius: 115, knockback: 25 },
            { damage: 15, cooldown: 0.6, radius: 130, knockback: 30 },
        ],
        MAX_LEVEL: 5,
    },
    // 성수: 바닥에 설치되는 장판 데미지
    HOLY_WATER: {
        NAME: 'Holy Water',
        DESCRIPTION: '바닥에 성수 웅덩이를 만들어 적에게 지속 피해를 준다',
        COLOR: 'rgba(100, 181, 246, 0.4)',  // 파란색 반투명
        LEVELS: [
            { damage: 8,  cooldown: 3.0, radius: 50,  duration: 2.5, tickRate: 0.5 },
            { damage: 10, cooldown: 2.8, radius: 55,  duration: 3.0, tickRate: 0.45 },
            { damage: 12, cooldown: 2.5, radius: 60,  duration: 3.5, tickRate: 0.4 },
            { damage: 15, cooldown: 2.2, radius: 70,  duration: 4.0, tickRate: 0.35 },
            { damage: 20, cooldown: 2.0, radius: 80,  duration: 4.5, tickRate: 0.3 },
        ],
        MAX_LEVEL: 5,
    },
    // 킹 바이블: 플레이어 주변을 회전하는 투사체
    KING_BIBLE: {
        NAME: 'King Bible',
        DESCRIPTION: '플레이어 주변을 회전하며 적을 공격한다',
        COLOR: '#ce93d8',          // 보라색
        LEVELS: [
            { damage: 8,  cooldown: 3.5, orbitRadius: 80,  count: 1, duration: 3.0, speed: 2.5 },
            { damage: 10, cooldown: 3.2, orbitRadius: 85,  count: 2, duration: 3.0, speed: 2.7 },
            { damage: 12, cooldown: 3.0, orbitRadius: 90,  count: 2, duration: 3.5, speed: 2.9 },
            { damage: 15, cooldown: 2.8, orbitRadius: 95,  count: 3, duration: 3.5, speed: 3.1 },
            { damage: 20, cooldown: 2.5, orbitRadius: 100, count: 3, duration: 4.0, speed: 3.3 },
        ],
        MAX_LEVEL: 5,
    },
    // 파이어 완드: 관통하는 불꽃 투사체
    FIRE_WAND: {
        NAME: 'Fire Wand',
        DESCRIPTION: '적을 관통하는 불꽃을 발사한다',
        COLOR: '#ff7043',          // 주황빨강
        LEVELS: [
            { damage: 20, cooldown: 1.5, speed: 300, count: 1, size: 8,  pierce: 2 },
            { damage: 25, cooldown: 1.4, speed: 320, count: 1, size: 9,  pierce: 2 },
            { damage: 30, cooldown: 1.3, speed: 340, count: 1, size: 10, pierce: 3 },
            { damage: 35, cooldown: 1.1, speed: 360, count: 2, size: 10, pierce: 3 },
            { damage: 45, cooldown: 1.0, speed: 380, count: 2, size: 12, pierce: 4 },
        ],
        MAX_LEVEL: 5,
    },
    // 나이프: 빠르고 많이 발사하는 투사체
    KNIFE: {
        NAME: 'Knife',
        DESCRIPTION: '빠른 나이프를 여러 개 연속 발사한다',
        COLOR: '#b0bec5',          // 은색
        LEVELS: [
            { damage: 6,  cooldown: 0.5, speed: 500, count: 1, size: 4 },
            { damage: 7,  cooldown: 0.45, speed: 520, count: 1, size: 4 },
            { damage: 8,  cooldown: 0.4, speed: 540, count: 2, size: 5 },
            { damage: 10, cooldown: 0.35, speed: 560, count: 2, size: 5 },
            { damage: 12, cooldown: 0.3, speed: 580, count: 3, size: 5 },
        ],
        MAX_LEVEL: 5,
    },
    // 라이트닝 링: 무작위 적에게 번개
    LIGHTNING_RING: {
        NAME: 'Lightning Ring',
        DESCRIPTION: '무작위 적에게 번개를 내린다',
        COLOR: '#ffeb3b',          // 노란색
        LEVELS: [
            { damage: 15, cooldown: 2.0, count: 1, range: 300 },
            { damage: 18, cooldown: 1.8, count: 1, range: 320 },
            { damage: 22, cooldown: 1.6, count: 2, range: 340 },
            { damage: 28, cooldown: 1.4, count: 2, range: 360 },
            { damage: 35, cooldown: 1.2, count: 3, range: 400 },
        ],
        MAX_LEVEL: 5,
    },
    // 채찍: 전방 근접 공격
    WHIP: {
        NAME: 'Whip',
        DESCRIPTION: '전방의 적을 채찍으로 공격한다',
        COLOR: '#8d6e63',          // 갈색
        LEVELS: [
            { damage: 15, cooldown: 1.2, range: 100, knockback: 15 },
            { damage: 20, cooldown: 1.1, range: 110, knockback: 18 },
            { damage: 25, cooldown: 1.0, range: 120, knockback: 20 },
            { damage: 35, cooldown: 0.9, range: 130, knockback: 22 },
            { damage: 45, cooldown: 0.8, range: 145, knockback: 25 },
        ],
        MAX_LEVEL: 5,
    },
};

// ===== 패시브 아이템 설정 =====
export const PASSIVES = {
    MOVE_SPEED: {
        NAME: 'Speed Boost',
        DESCRIPTION: '이동 속도 +10%',
        EFFECT: { stat: 'speedMultiplier', value: 0.1 },
        MAX_LEVEL: 5,
        COLOR: '#81d4fa',
    },
    MAX_HP_UP: {
        NAME: 'HP Boost',
        DESCRIPTION: '최대 체력 +20, 체력 회복',
        EFFECT: { stat: 'maxHp', value: 20 },
        MAX_LEVEL: 5,
        COLOR: '#ef9a9a',
    },
    PICKUP_RANGE: {
        NAME: 'Magnet',
        DESCRIPTION: '보석 흡수 범위 +20%',
        EFFECT: { stat: 'pickupMultiplier', value: 0.2 },
        MAX_LEVEL: 5,
        COLOR: '#ce93d8',
    },
    ARMOR: {
        NAME: 'Armor',
        DESCRIPTION: '받는 피해 -1',
        EFFECT: { stat: 'armor', value: 1 },
        MAX_LEVEL: 5,
        COLOR: '#a5d6a7',
    },
};

// ===== 경험치/레벨 설정 =====
export const EXP = {
    BASE_TO_LEVEL: 5,           // 레벨 2가 되는데 필요한 경험치
    GROWTH_RATE: 1.3,           // 레벨당 필요 경험치 증가율 (1.3배씩)
    GEM_RADIUS: 8,              // 보석 크기
    GEM_COLOR: '#69f0ae',       // 보석 색상 (초록)
    GEM_MAGNET_SPEED: 400,      // 자석에 끌릴 때 이동 속도
    GEM_LIFETIME: 30,           // 보석 수명 (초) — 이 시간 후 자동 소멸
    GEM_BLINK_TIME: 5,          // 소멸 전 깜빡임 시작 시간 (초)
    LEVELUP_CHOICES: 3,         // 레벨업 시 선택지 개수
};

// ===== UI 설정 =====
export const UI = {
    HP_BAR_WIDTH: 200,
    HP_BAR_HEIGHT: 16,
    HP_BAR_COLOR: '#ef5350',
    HP_BAR_BG: '#424242',
    EXP_BAR_HEIGHT: 8,
    EXP_BAR_COLOR: '#69f0ae',
    EXP_BAR_BG: '#2e2e2e',
    FONT_FAMILY: 'Arial, sans-serif',
    FONT_COLOR: '#ffffff',
    OVERLAY_COLOR: 'rgba(0, 0, 0, 0.7)',
};

// ===== 투사체 설정 =====
export const PROJECTILE = {
    MAX_LIFETIME: 3.0,          // 투사체 최대 생존 시간 (초)
    MAX_DISTANCE: 600,          // 투사체 최대 이동 거리 (px)
};

// ===== 풀 사이즈 설정 =====
export const POOL_SIZES = {
    ENEMIES: 250,
    PROJECTILES: 150,
    GEMS: 400,
    DAMAGE_TEXTS: 30,
};

// ===== 카메라 설정 =====
export const CAMERA = {
    SHAKE_INTENSITY: 5,         // 화면 흔들림 강도 (px)
    SHAKE_DURATION: 0.15,       // 화면 흔들림 지속 시간 (초)
};

// ===== 게임 전체 설정 =====
export const GAME = {
    GAME_DURATION: 600,         // 게임 제한 시간 (10분 = 600초)
    BACKGROUND_GRID_SIZE: 64,   // 배경 격자 크기 (px)
    BACKGROUND_COLOR: '#1a1a2e',
    BACKGROUND_LINE_COLOR: '#16213e',
};
