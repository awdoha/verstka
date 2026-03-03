const Level3 = {
    spawnTimer: null,
    caught: 0,
    missed: 0,
    maxMissed: 5,
    targetScore: 10,
    startTime: null,
    levelTime: 120,
    currentSpeed: 1.2,
    spawnInterval: 2000,
    shuffleTimer: null,
    skipReward: 40,
    skipScore: 0,
    skipHits: 0,
    minVisibleCategories: 3,
    maxVisibleCategories: 5,
    visibleCategoryCount: 3,
    mode: 'normal',
    isEndless: false,
    basePoints: 220,
    scoreGoalLabel: '10',
    endlessReason: null,
    modeConfigs: {
        normal: {
            levelTime: 120,
            maxMissed: 5,
            spawnInterval: 4000,
            skipReward: 40,
            basePoints: 220,
            minCategories: 3,
            maxCategories: 4,
            endless: false,
            targetFallSeconds: 17
        },
        hard: {
            levelTime: 90,
            maxMissed: 4,
            spawnInterval: 3000,
            skipReward: 30,
            basePoints: 280,
            minCategories: 4,
            maxCategories: 5,
            endless: false,
            targetFallSeconds: 15
        },
        endless: {
            levelTime: null,
            maxMissed: 5,
            spawnInterval: 2400,
            skipReward: 50,
            basePoints: 240,
            minCategories: 3,
            maxCategories: 5,
            endless: true,
            targetFallSeconds: 15
        }
    },
    categories: [],
    categoryState: [],
    pathCanvas: null,
    pathCtx: null,
    pathDpr: 1,
    pathResizeBound: false,
    pathTypes: ['sin', 'cos', 'tan', 'cot'],
    pathPalette: {
        sin: { base: 'rgba(9,132,227,', progress: 'rgba(116,185,255,' },
        cos: { base: 'rgba(0,184,148,', progress: 'rgba(85,239,196,' },
        tan: { base: 'rgba(253,203,110,', progress: 'rgba(255,234,167,' },
        cot: { base: 'rgba(162,155,254,', progress: 'rgba(223,230,233,' }
    },
    applyModeSettings() {
        const stored = typeof LevelModeManager !== 'undefined'
            ? LevelModeManager.get(3, 'normal')
            : 'normal';
        this.mode = this.modeConfigs[stored] ? stored : 'normal';
        const cfg = this.modeConfigs[this.mode];
        this.levelTime = cfg.levelTime ?? 0;
        this.maxMissed = cfg.maxMissed;
        this.spawnInterval = cfg.spawnInterval;
        this.skipReward = cfg.skipReward;
        this.basePoints = cfg.basePoints;
        this.isEndless = !!cfg.endless;
        this.minVisibleCategories = cfg.minCategories ?? this.minVisibleCategories;
        this.maxVisibleCategories = cfg.maxCategories ?? this.maxVisibleCategories;
        this.targetFallSeconds = cfg.targetFallSeconds ?? this.targetFallSeconds ?? 10;
    },

    categoryPool: [
        {
            id: 'table_item',
            name: 'Поставить _Х_ на стол',
            description: 'Предметы, которые логично оставить на столе',
            count: 0,
            target: 4
        },
        {
            id: 'headwear',
            name: 'Надеть _Х_ на голову',
            description: 'Головные уборы и защита',
            count: 0,
            target: 4
        },
        {
            id: 'travel',
            name: 'Поехать на _Х_',
            description: 'Средства передвижения',
            count: 0,
            target: 4
        },
        {
            id: 'pour',
            name: 'Налить чай в _Х_',
            description: 'Посуда и ёмкости для напитков',
            count: 0,
            target: 4
        },
        {
            id: 'music',
            name: 'Сыграть на _Х_',
            description: 'Музыкальные инструменты',
            count: 0,
            target: 4
        },
        {
            id: 'light',
            name: 'Осветить комнату с помощью _Х_',
            description: 'Источники света',
            count: 0,
            target: 4
        },
        {
            id: 'nature_trip',
            name: 'Отправиться в _Х_',
            description: 'Природные зоны для путешествий',
            count: 0,
            target: 4
        },
        {
            id: 'picnic_place',
            name: 'Устроить пикник у _Х_',
            description: 'Места на природе для отдыха',
            count: 0,
            target: 4
        }
    ],
    words: [
        
        { text: 'ВАЗА', category: 'table_item,pour' },
        { text: 'ТОРТ', category: 'table_item' },
        { text: 'ЧАЙНИК', category: 'table_item,pour' },
        { text: 'ЧАШКА', category: 'table_item,pour' },
        { text: 'КРУЖКА', category: 'table_item,pour' },
        { text: 'СТАКАН', category: 'table_item,pour' },
        { text: 'ТЕРМОС', category: 'table_item,pour' },
        
        { text: 'ШАПКА', category: 'table_item,headwear' },
        { text: 'КАСКА', category: 'table_item,headwear' },
        { text: 'КОРОНА', category: 'table_item,headwear' },
        { text: 'ШЛЕМ', category: 'table_item,headwear' },
       
        { text: 'ПОЕЗД', category: 'travel' },
        { text: 'ВЕЛОСИПЕД', category: 'travel,table_item' },
        { text: 'САМОКАТ', category: 'travel,table_item' },
        { text: 'КОНЬ', category: 'travel' },
        
        { text: 'ГИТАРА', category: 'table_item,music' },
        { text: 'ПИАНИНО', category: 'table_item,music' },
        { text: 'СКРИПКА', category: 'table_item,music' },
        { text: 'БАРАБАН', category: 'table_item,music' },
        
        { text: 'ЛАМПА', category: 'table_item,light' },
        { text: 'СВЕЧА', category: 'table_item,light' },
        { text: 'ФОНАРЬ', category: 'table_item,light' },
        { text: 'ГИРЛЯНДА', category: 'table_item,light' },
        
        { text: 'ЛЕС', category: 'nature_trip,picnic_place' },
        { text: 'МОРЕ', category: 'nature_trip' },
        { text: 'ГОРЫ', category: 'nature_trip' },
        { text: 'РЕКА', category: 'nature_trip,picnic_place' },
        { text: 'ПОЛЯНА', category: 'picnic_place' },
        { text: 'ОЗЕРО', category: 'nature_trip,picnic_place' }
    ],

    normalizeCategories(value) {
        if (!value) return [];
        if (Array.isArray(value)) {
            return value.map(String).map(v => v.trim()).filter(Boolean);
        }
        return String(value)
            .split(',')
            .map(part => part.trim())
            .filter(Boolean);
    },

    getElementCategories(el) {
        if (!el) return [];
        const raw = el.dataset.categories || el.dataset.category || '';
        return raw
            .split(',')
            .map(part => part.trim())
            .filter(Boolean);
    },

    getVisibleCategoryBounds() {
        const min = Math.max(1, Math.min(this.minVisibleCategories, this.categoryPool.length));
        const max = Math.max(min, Math.min(this.maxVisibleCategories, this.categoryPool.length));
        return { min, max };
    },

    rollVisibleCategoryCount(minOverride = null, maxOverride = null) {
        const bounds = this.getVisibleCategoryBounds();
        const poolLimit = this.categoryPool.length;
        const min = Math.max(1, Math.min(minOverride ?? bounds.min, poolLimit));
        const max = Math.max(min, Math.min(maxOverride ?? bounds.max, poolLimit));
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    resetCategoryState() {
        this.categoryState = this.categoryPool.map(cat => ({ ...cat, count: 0 }));
    },

    shuffleCategoryState() {
        for (let i = this.categoryState.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.categoryState[i], this.categoryState[j]] = [this.categoryState[j], this.categoryState[i]];
        }
    },

    updateActiveCategories() {
        if (!this.categoryState.length) {
            this.resetCategoryState();
        }
        const limit = Math.max(1, Math.min(this.visibleCategoryCount, this.categoryState.length));
        this.categories = this.categoryState.slice(0, limit);
    },

    randomizeVisibleCategories() {
        if (!this.categoryState.length) {
            this.resetCategoryState();
        }
        this.visibleCategoryCount = this.rollVisibleCategoryCount();
        this.shuffleCategoryState();
        this.updateActiveCategories();
    },

    setupActiveCategories() {
        this.resetCategoryState();
        this.shuffleCategoryState();
        this.visibleCategoryCount = this.rollVisibleCategoryCount();
        this.updateActiveCategories();
    },

    init() {
        this.applyModeSettings();
        this.startTime = Date.now();
        this.caught = 0;
        this.missed = 0;
        this.skipScore = 0;
        this.skipHits = 0;
        this.endlessReason = null;
        this.setupActiveCategories();
        this.targetScore = this.categories.reduce((sum, cat) => sum + cat.target, 0);
        this.scoreGoalLabel = this.isEndless ? '∞' : this.targetScore;

        
        this.words.sort(() => 0.5 - Math.random());

        this.createUI();
        this.renderCategories();
        this.updateSkipDisplay();
        this.setupPathCanvas();

        const area = document.getElementById('storm-area');

        
        this.startSpawning();

        
        if (this.levelTime && this.levelTime > 0) {
            TimerManager.start(
                this.levelTime,
                (timeLeft, total) => this.updateTimer(timeLeft, total),
                () => this.finish(false, true)
            );
        } else {
            const display = document.getElementById('timer-display');
            if (display) {
                display.innerText = '∞';
            }
        }
    },

    createUI() {
        const card = document.querySelector('.level3-card') || document.querySelector('.card');
        let header = card ? card.querySelector('h2') : null;
        if (!header && card) {
            header = document.createElement('h2');
            card.insertBefore(header, card.firstChild);
        }
        if (!header) return;
        const timerLabel = (this.levelTime && this.levelTime > 0)
            ? TimerManager.formatTime(this.levelTime)
            : '∞';
        header.innerHTML = `
            <div class="level-header">
                <div class="level-stats-panel">
                    <div class="stat-item stat-item--time">
                        <div class="stat-label">⏱ Время</div>
                        <div class="stat-value" id="timer-display">${timerLabel}</div>
                    </div>
                    <div class="stat-item stat-item--good">
                        <div class="stat-label">🎯 Поймано</div>
                        <div class="stat-value">
                            <span id="score-count">0</span>/<span>${this.scoreGoalLabel}</span>
                        </div>
                    </div>
                    <div class="stat-item stat-item--bad">
                        <div class="stat-label">⚠ Пропущено</div>
                        <div class="stat-value">
                            <span id="missed-count">0</span>/<span>${this.maxMissed}</span>
                        </div>
                    </div>
                    <div class="stat-item stat-item--bonus">
                        <div class="stat-label">✨ Лишние</div>
                        <div class="stat-value">
                            <span id="skip-count">0</span>
                            <small>(+<span id="skip-points">0</span>)</small>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    renderCategories() {
        const catArea = document.getElementById('categories-area');
        if (!catArea) return;
        catArea.innerHTML = '';

        this.categories.forEach((cat, idx) => {
            const zone = document.createElement('div');
            zone.className = 'category-zone';
            zone.dataset.category = cat.id;
            const pathType = this.pathTypes[idx % this.pathTypes.length];
            zone.dataset.pathType = pathType;
            zone.innerHTML = 
            /*`
                <div class="category-label">${cat.name}</div>
                ${cat.description ? `<div class="category-description">${cat.description}</div>` : ''}
                <div class="category-counter">
                    <span class="cat-count">${cat.count}</span>
                </div>
            `;*/
            /*`
                <div class="category-label">
                    ${cat.name}
                    <span class="category-path-badge category-path-badge--${pathType}">${pathType}</span>
                </div>
            `;*/
            `
                <div class="category-label">
                    ${cat.name}
                </div>
            `;
            catArea.appendChild(zone);
        });
    },

    scheduleCategoryShuffle() {
        if (this.shuffleTimer) {
            clearTimeout(this.shuffleTimer);
        }
        this.shuffleTimer = setTimeout(() => {
            this.randomizeVisibleCategories();
            this.renderCategories();
            this.setupPathCanvas();
            this.shuffleTimer = null;
        }, 400);
    },

    updateSkipDisplay() {
        const count = document.getElementById('skip-count');
        const points = document.getElementById('skip-points');
        if (count) count.innerText = this.skipHits;
        if (points) points.innerText = this.skipScore;
    },

    setupPathCanvas() {
        const canvas = document.getElementById('path-canvas');
        if (!canvas) return;
        this.pathCanvas = canvas;
        this.pathCtx = canvas.getContext('2d');
        this.resizePathCanvas();
        if (!this.pathResizeBound) {
            this.pathResizeBound = true;
            window.addEventListener('resize', () => this.resizePathCanvas());
        }
    },

    resizePathCanvas() {
        const canvas = this.pathCanvas;
        const ctx = this.pathCtx;
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        this.pathDpr = dpr;

        const w = Math.max(1, Math.round(rect.width * dpr));
        const h = Math.max(1, Math.round(rect.height * dpr));
        if (canvas.width !== w) canvas.width = w;
        if (canvas.height !== h) canvas.height = h;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, rect.width, rect.height);
    },

    clearPathCanvas() {
        const canvas = this.pathCanvas;
        const ctx = this.pathCtx;
        if (!canvas || !ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);
    },

    canvasPointFromClient(clientX, clientY) {
        const canvas = this.pathCanvas;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return { x: clientX - rect.left, y: clientY - rect.top };
    },

    buildPathPoint(pathType, start, end, t, limits = null) {
        const lerp = (a, b, k) => a + (b - a) * k;
        const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));

        const x = lerp(start.x, end.x, t);
        const yBase = lerp(start.y, end.y, t);

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dist = Math.hypot(dx, dy) || 1;
        const nx = -dy / dist;
        const ny = dx / dist;

        const amp = Math.min(85, dist * 0.16);
        const waves = 2;
        const u = t * waves * 2 * Math.PI;
        const envelope = Math.sin(Math.PI * t);
        let off = 0;

        if (pathType === 'sin') {
            off = Math.sin(u);
        } else if (pathType === 'cos') {
            off = Math.cos(u);
        } else if (pathType === 'tan') {
            off = clamp(Math.tan((t - 0.5) * 1.25), -2.0, 2.0) / 2.0;
        } else if (pathType === 'cot') {
            const v = Math.tan((t - 0.5) * 1.25);
            off = (2 / Math.PI) * Math.atan2(1, v) - 1; 
        }

        off *= envelope;

        let px = x + nx * amp * off;
        let py = yBase + ny * amp * off;

        if (limits) {
            const minX = Number.isFinite(limits.minX) ? limits.minX : 0;
            const maxX = Number.isFinite(limits.maxX) ? limits.maxX : minX;
            const minY = Number.isFinite(limits.minY) ? limits.minY : 0;
            const maxY = Number.isFinite(limits.maxY) ? limits.maxY : minY;
            px = clamp(px, minX, maxX);
            py = clamp(py, minY, maxY);
        }

        return { x: px, y: py };
    },

    buildPathSamples(pathType, start, end, steps = 150) {
        const canvas = this.pathCanvas;
        const pad = 12;
        let limits = null;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            const maxX = Math.max(pad, rect.width - pad);
            const maxY = Math.max(pad, rect.height - pad);
            limits = { minX: pad, maxX, minY: pad, maxY };
        }
        const samples = [];
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const p = this.buildPathPoint(pathType, start, end, t, limits);
            samples.push({ t, x: p.x, y: p.y });
        }
        return samples;
    },

    findNearestOnPath(samples, p) {
        let best = null;
        let bestD2 = Infinity;
        for (const s of samples) {
            const dx = s.x - p.x;
            const dy = s.y - p.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < bestD2) {
                bestD2 = d2;
                best = s;
            }
        }
        if (!best) return null;
        return { t: best.t, dist: Math.sqrt(bestD2) };
    },

    drawPathOverlay(game) {
        const ctx = this.pathCtx;
        const canvas = this.pathCanvas;
        if (!ctx || !canvas || !game) return;
        const rect = canvas.getBoundingClientRect();
        ctx.clearRect(0, 0, rect.width, rect.height);

        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(0, 0, rect.width, rect.height);
        ctx.restore();

        const drawOne = (path, isActive) => {
            const alpha = isActive ? 1.0 : 0.55;
            const palette = this.pathPalette[path.pathType] || this.pathPalette.sin;
            ctx.save();
            ctx.lineWidth = isActive ? 4 : 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = `${palette.base}${alpha})`;
            ctx.beginPath();
            path.samples.forEach((s, idx) => {
                if (idx === 0) ctx.moveTo(s.x, s.y);
                else ctx.lineTo(s.x, s.y);
            });
            ctx.stroke();

            const prog = Math.max(0, Math.min(1, path.progress || 0));
            ctx.strokeStyle = `${palette.progress}${alpha})`;
            ctx.lineWidth = isActive ? 6 : 5;
            ctx.beginPath();
            let lastIdx = 0;
            for (let i = 0; i < path.samples.length; i++) {
                if (path.samples[i].t <= prog) lastIdx = i;
            }
            path.samples.slice(0, Math.max(1, lastIdx + 1)).forEach((s, idx) => {
                if (idx === 0) ctx.moveTo(s.x, s.y);
                else ctx.lineTo(s.x, s.y);
            });
            ctx.stroke();

            ctx.fillStyle = 'rgba(253, 203, 110, 0.95)';
            ctx.beginPath();
            ctx.arc(game.start.x, game.start.y, 6, 0, Math.PI * 2);
            ctx.fill();

            
            ctx.fillStyle = `${palette.base}${isActive ? 0.95 : 0.75})`;
            ctx.beginPath();
            ctx.arc(path.end.x, path.end.y, 7, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        };

        game.paths.forEach(p => drawOne(p, game.activeCategoryId === p.categoryId));

        if (game.invalid) {
            ctx.save();
            ctx.fillStyle = 'rgba(214,48,49,0.12)';
            ctx.fillRect(0, 0, rect.width, rect.height);
            ctx.restore();
        }
    },

    startPathGame(el) {
        this.setupPathCanvas();
        if (!this.pathCanvas) return;
        const canvasRect = this.pathCanvas.getBoundingClientRect();
        const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
        const pad = 12;
        const zones = Array.from(document.querySelectorAll('.category-zone'));
        if (!zones.length) return;

        const elRect = el.getBoundingClientRect();
        const rawStart = this.canvasPointFromClient(elRect.left + elRect.width / 2, elRect.top + elRect.height / 2);
        const start = {
            x: clamp(rawStart.x, pad, Math.max(pad, canvasRect.width - pad)),
            y: clamp(rawStart.y, pad, Math.max(pad, canvasRect.height - pad))
        };

        const paths = zones.map(zone => {
            const zr = zone.getBoundingClientRect();
            const rawEnd = this.canvasPointFromClient(zr.left + zr.width / 2, zr.top + Math.min(26, zr.height / 2));
            const end = {
                x: clamp(rawEnd.x, pad, Math.max(pad, canvasRect.width - pad)),
                y: clamp(rawEnd.y, pad, Math.max(pad, canvasRect.height - pad))
            };
            const pathType = zone.dataset.pathType || 'sin';
            const samples = this.buildPathSamples(pathType, start, end, 150);
            return { categoryId: zone.dataset.category, pathType, end, samples, progress: 0 };
        });

        el._pathGame = {
            start,
            paths,
            activeCategoryId: null,
            completedCategoryId: null,
            invalid: false,
            offPathSince: null,
            lastTByCategory: Object.fromEntries(paths.map(p => [p.categoryId, 0]))
        };

        this.drawPathOverlay(el._pathGame);
    },

    updatePathGame(el, e) {
        if (!el || !el._pathGame || !this.pathCanvas) return;
        const game = el._pathGame;
        const p = this.canvasPointFromClient(e.clientX, e.clientY);
        const tolerance = 22;
        const openRadius = 66; 
        const maxTJump = 0.25;  
        const now = Date.now();

        let best = null;
        for (const path of game.paths) {
            const nearest = this.findNearestOnPath(path.samples, p);
            if (!nearest) continue;
            if (!best || nearest.dist < best.nearest.dist) {
                best = { path, nearest };
            }
        }

        if (!best || best.nearest.dist > tolerance) {
            if (game.offPathSince == null) game.offPathSince = now;
            if (now - game.offPathSince > 220) game.invalid = true;
            game.activeCategoryId = null;
            this.drawPathOverlay(game);
            return;
        }

        game.offPathSince = null;
        game.invalid = false;
        const active = best.path;
        game.activeCategoryId = active.categoryId;

        const prevT = game.lastTByCategory[active.categoryId] || 0;
        const targetT = Math.max(0, Math.min(1, best.nearest.t));

        
        const tipIdx = Math.max(0, Math.min(active.samples.length - 1, Math.floor(prevT * (active.samples.length - 1))));
        const tip = active.samples[tipIdx];
        const distToTip = Math.hypot(p.x - tip.x, p.y - tip.y);
        const tJump = targetT - prevT;

        let nextT = prevT;
        if (tJump >= 0) {
            
            if (distToTip <= openRadius && tJump <= maxTJump) {
                nextT = targetT;
            }
        } else {
            
            nextT = prevT;
        }

        game.lastTByCategory[active.categoryId] = nextT;
        active.progress = Math.max(active.progress || 0, nextT);

        const endDx = p.x - active.end.x;
        const endDy = p.y - active.end.y;
        const nearEnd = Math.hypot(endDx, endDy) < 26;
        if (!game.invalid && nearEnd && active.progress >= 0.985) {
            game.completedCategoryId = active.categoryId;
        }

        const zones = document.querySelectorAll('.category-zone');
        zones.forEach(z => z.classList.toggle('highlight', z.dataset.category === game.activeCategoryId));

        this.drawPathOverlay(game);
    },

    stopPathGame(el) {
        if (!el) return;
        if (el._pathGame) delete el._pathGame;
        const zones = document.querySelectorAll('.category-zone');
        zones.forEach(z => z.classList.remove('highlight'));
        this.clearPathCanvas();
    },

    clearAreas() {
        const area = document.getElementById('storm-area');
        if (area) {
            Array.from(area.querySelectorAll('.falling-word')).forEach(word => {
                this.stopFall(word);
                word.remove();
            });
        }
        const catArea = document.getElementById('categories-area');
        if (catArea) catArea.innerHTML = '';
    },

    hasActiveCategory(categoryId) {
        return this.categories.some(cat => cat.id === categoryId);
    },

    canSkipWord(el) {
        if (!el) return false;
        const categories = this.getElementCategories(el);
        if (!categories.length) return true;
        return !categories.some(catId => this.hasActiveCategory(catId));
    },

    handleSkipWord(el) {
        if (!el || el.classList.contains('skip-resolved')) return;
        this.stopFall(el);
        this.stopPathGame(el);
        el.classList.add('skip-resolved');
        delete el._dragContext;

        this.skipHits++;
        this.skipScore += this.skipReward;
        this.updateSkipDisplay();
        SoundManager.success();

        el.style.transition = 'all 0.25s ease-out';
        el.style.transform = 'scale(1.2)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 200);
    },

    handleInvalidSkip(el) {
        if (!el || el.classList.contains('skip-resolved')) return;
        this.stopFall(el);
        this.stopPathGame(el);
        el.classList.add('skip-resolved');
        delete el._dragContext;

        UserManager.removePenalty(this.skipReward * 2);
        SoundManager.error();

        this.missed++;
        const missedDisplay = document.getElementById('missed-count');
        if (missedDisplay) missedDisplay.innerText = this.missed;

        const area = document.getElementById('storm-area');
        if (area) {
            area.style.animation = 'shake 0.4s';
            setTimeout(() => area.style.animation = '', 400);
        }

        el.style.transition = 'all 0.25s ease-out';
        el.style.transform = 'scale(0.8)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 200);

        if (this.missed >= this.maxMissed) {
            setTimeout(() => this.finish(false), 500);
        }
    },

    updateTimer(timeLeft, total) {
        const display = document.getElementById('timer-display');
        if (!display) return;

        display.innerText = TimerManager.formatTime(timeLeft);

        if (timeLeft <= 20) {
            display.style.color = '#d63031';
            display.style.animation = 'pulse 0.5s infinite';
            if (timeLeft <= 5) {
                SoundManager.warning();
            }
        } else if (timeLeft <= 40) {
            display.style.color = '#fdcb6e';
        } else {
            display.style.color = '#00b894';
            display.style.animation = 'none';
        }
    },

    startSpawning() {
        let wordIndex = 0;

        const spawnNext = () => {
            if (!this.isEndless && this.caught >= this.targetScore) {
                return;
            }
            if (!this.isEndless && wordIndex >= this.words.length) {
                return;
            }

            this.spawnWord(this.words[wordIndex]);
            wordIndex++;

            if (this.isEndless && wordIndex >= this.words.length) {
                wordIndex = 0;
                this.words.sort(() => 0.5 - Math.random());
            }
        };

        
        spawnNext();

        this.spawnTimer = setInterval(() => {
            spawnNext();

            
            if (this.caught > 0 && this.caught % 3 === 0) {
                this.currentSpeed = Math.min(3, this.currentSpeed + 0.2);
                this.spawnInterval = Math.max(1200, this.spawnInterval - 200);

                clearInterval(this.spawnTimer);
                this.startSpawning();
            }
        }, this.spawnInterval);
    },

    spawnWord(wordData) {
        const area = document.getElementById('storm-area');
        if (!area) return;

        const el = document.createElement('div');
        el.className = 'falling-word';
        el.innerText = wordData.text;
        const categories = this.normalizeCategories(wordData.category || wordData.categories);
        if (!categories.length) return;
        el.dataset.category = categories[0];
        el.dataset.categories = categories.join(',');
        el.style.top = '-20px';

        area.appendChild(el);

        const maxLeft = Math.max(0, area.clientWidth - el.offsetWidth);
        el.style.left = Math.random() * maxLeft + 'px';

        
        this.makeDraggable(el, area);

        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.canSkipWord(el)) {
                this.handleSkipWord(el);
            } else {
                this.handleInvalidSkip(el);
            }
        });

        
        this.startFall(el, area);

        
        this.applyWordEffect(el);
    },

    getVerticalSpeed(area) {
        const rectHeight = area?.getBoundingClientRect ? area.getBoundingClientRect().height : null;
        const areaHeight = Math.max(11, rectHeight || area?.clientHeight);
        const randomFactor = 0.9 + Math.random() * 0.3; 
        const effectiveTime = Math.max(
            0.4,
            (this.targetFallSeconds / Math.max(0.6, this.currentSpeed)) * randomFactor
        );
        const verticalSpeed = areaHeight / effectiveTime; 
        return { areaHeight, verticalSpeed };
    },

    applyWordEffect(el) {
        const effectType = Math.random() < 0.5 ? 'fade' : 'shrink';
        const delay = 1000 + Math.random() * 3000;

        if (effectType === 'fade') {
            const targetOpacity = 0.02 + Math.random() * 0.25;
            el.style.setProperty('--fade-target-opacity', targetOpacity.toFixed(2));
            el.classList.add('word-effect-base', 'word-effect-fade');
            setTimeout(() => {
                if (!el.isConnected || el.classList.contains('caught') || el.classList.contains('skip-resolved')) return;
                el.classList.add('word-effect-fade-active');
            }, delay);
        } else {
            const targetScale = 0.45 + Math.random() * 0.35;
            el.style.setProperty('--shrink-target-scale', targetScale.toFixed(2));
            el.classList.add('word-effect-base', 'word-effect-shrink');
            setTimeout(() => {
                if (!el.isConnected || el.classList.contains('caught') || el.classList.contains('skip-resolved')) return;
                el.classList.add('word-effect-shrink-active');
            }, delay);
        }
    },

    getTrajectoryType() {
        const types = ['straight', 'sine', 'diagonal'];
        return types[Math.floor(Math.random() * types.length)];
    },

    createTrajectory(area, el, forcedType = null, verticalMetrics = null) {
        const type = forcedType || this.getTrajectoryType();
        const widthLimit = Math.max(0, area.clientWidth - el.offsetWidth);
        const clampX = (val) => Math.max(0, Math.min(val, widthLimit));
        const startX = clampX(parseFloat(el.style.left) || 0);
        const startY = parseFloat(el.style.top) || -40;
        const metrics = verticalMetrics || this.getVerticalSpeed(area);
        const { areaHeight, verticalSpeed } = metrics;

        const trajectory = {
            type,
            baseX: startX,
            currentX: startX,
            currentY: startY,
            verticalSpeed,
            areaHeight,
            elapsed: 0,
            lastTimestamp: null,
            phase: Math.random() * Math.PI * 2
        };

        if (type === 'sine') {
            const amplitudeBase = 90 + Math.random() * 90;
            const amplitudeLimit = Math.max(10, widthLimit / 2);
            trajectory.amplitude = Math.min(amplitudeBase, amplitudeLimit);
            trajectory.frequency = 1 + Math.random() * 1.5;
            const minBase = trajectory.amplitude;
            const maxBase = Math.max(minBase, widthLimit - trajectory.amplitude);
            trajectory.baseX = clampX(Math.max(minBase, Math.min(startX, maxBase)));
            trajectory.currentX = trajectory.baseX;
        } else if (type === 'diagonal') {
            trajectory.horizontalSpeed = 60 + Math.random() * 60;
            trajectory.direction = Math.random() > 0.5 ? 1 : -1;
        }

        return trajectory;
    },

    startFall(el, area, forcedType = null) {
        if (!area) return;
        this.stopFall(el);

        const areaWidth = Math.max(0, area.clientWidth - el.offsetWidth);
        const clampX = (val) => Math.max(0, Math.min(val, areaWidth));
        const metrics = this.getVerticalSpeed(area);
        const trajectory = this.createTrajectory(area, el, forcedType, metrics);
        el._trajectory = trajectory;
        const areaHeight = trajectory.areaHeight;

        const animate = (timestamp) => {
            if (el.classList.contains('dragging') || el.classList.contains('caught')) {
                this.stopFall(el);
                return;
            }

            if (trajectory.lastTimestamp === null) {
                trajectory.lastTimestamp = timestamp;
            }

            const delta = (timestamp - trajectory.lastTimestamp) / 1000;
            trajectory.lastTimestamp = timestamp;
            trajectory.elapsed += delta;
            trajectory.currentY += trajectory.verticalSpeed * delta;

            if (trajectory.type === 'sine') {
                const nextX = trajectory.baseX +
                    Math.sin(trajectory.elapsed * trajectory.frequency + trajectory.phase) * trajectory.amplitude;
                trajectory.currentX = clampX(nextX);
            } else if (trajectory.type === 'diagonal') {
                let nextX = trajectory.currentX + trajectory.horizontalSpeed * delta * trajectory.direction;
                if (nextX <= 0 || nextX >= areaWidth) {
                    trajectory.direction *= -1;
                    nextX = clampX(nextX);
                }
                trajectory.currentX = nextX;
            } else {
                trajectory.currentX = clampX(trajectory.baseX);
            }

            el.style.left = trajectory.currentX + 'px';
            el.style.top = trajectory.currentY + 'px';

            if (trajectory.currentY > areaHeight) {
                this.stopFall(el);
                if (el.parentNode && !el.classList.contains('caught')) {
                    this.wordMissed();
                    el.remove();
                }
                return;
            }

            const frameId = requestAnimationFrame(animate);
            el.dataset.fallFrame = frameId;
        };

        const frameId = requestAnimationFrame(animate);
        el.dataset.fallFrame = frameId;
    },

    resumeFall(el, area) {
        if (!area) return;
        const type = el._trajectory ? el._trajectory.type : null;
        this.startFall(el, area, type);
    },

    stopFall(el) {
        if (!el || !el.dataset) return;
        const frameId = Number(el.dataset.fallFrame);
        if (frameId) {
            cancelAnimationFrame(frameId);
        }
        delete el.dataset.fallFrame;
    },

    makeDraggable(el, container) {
        let isDown = false;

        const promoteToGlobalLayer = (e) => {
            const rect = el.getBoundingClientRect();
            el._dragContext = {
                offsetX: e.clientX - rect.left,
                offsetY: e.clientY - rect.top,
                parent: el.parentElement,
                nextSibling: el.nextSibling,
                width: rect.width
            };

            document.body.appendChild(el);
            el.style.position = 'fixed';
            el.style.left = rect.left + 'px';
            el.style.top = rect.top + 'px';
            el.style.width = rect.width + 'px';
        };

        const restoreToStormArea = () => {
            if (!el._dragContext) return;
            const host = el._dragContext.parent || container;
            if (!host) return;

            const hostRect = host.getBoundingClientRect();
            const currentLeft = parseFloat(el.style.left) || 0;
            const currentTop = parseFloat(el.style.top) || 0;
            const relativeLeft = currentLeft - hostRect.left;
            const relativeTop = currentTop - hostRect.top;

            if (el._dragContext.parent) {
                const { parent, nextSibling } = el._dragContext;
                if (nextSibling && nextSibling.parentNode === parent) {
                    parent.insertBefore(el, nextSibling);
                } else {
                    parent.appendChild(el);
                }
            } else {
                host.appendChild(el);
            }

            el.style.position = 'absolute';
            el.style.width = '';

            const maxX = Math.max(0, host.clientWidth - el.offsetWidth);
            const clampedLeft = Math.max(0, Math.min(relativeLeft, maxX));
            const clampedTop = Math.max(-20, relativeTop);
            el.style.left = clampedLeft + 'px';
            el.style.top = clampedTop + 'px';

            delete el._dragContext;
        };

        const onMouseDown = (e) => {
            if (e.button !== 0) return;

            isDown = true;

            
            this.stopFall(el);
            promoteToGlobalLayer(e);

            el.style.zIndex = 10000;
            el.classList.add('dragging');
            SoundManager.click();

            
            this.startPathGame(el);
        };

        const onMouseUp = (e) => {
            if (!isDown) return;
            isDown = false;
            el.style.zIndex = 100;
            el.classList.remove('dragging');

            const completedCategoryId = el._pathGame ? el._pathGame.completedCategoryId : null;
            const isInvalid = el._pathGame ? !!el._pathGame.invalid : false;
            this.stopPathGame(el);

            if (!completedCategoryId || isInvalid) {
                
                restoreToStormArea();
                this.resumeFall(el, container);
            } else {
                const zone = document.querySelector(`.category-zone[data-category="${completedCategoryId}"]`);
                if (!zone) {
                    restoreToStormArea();
                    this.resumeFall(el, container);
                    return;
                }

                const wordCategories = this.getElementCategories(el);
                if (wordCategories.includes(completedCategoryId)) {
                    this.catchWord(el, zone);
                    delete el._dragContext;
                } else {
                    this.wrongCategory(zone);
                    restoreToStormArea();
                    this.resumeFall(el, container);
                }
            }
        };

        const onMouseMove = (e) => {
            if (isDown) {
                e.preventDefault();
                if (!el._dragContext) return;
                const maxX = window.innerWidth - el.offsetWidth;
                const maxY = window.innerHeight - el.offsetHeight;
                const newX = e.clientX - el._dragContext.offsetX;
                const newY = e.clientY - el._dragContext.offsetY;

                el.style.left = Math.max(0, Math.min(newX, maxX)) + 'px';
                el.style.top = Math.max(0, Math.min(newY, maxY)) + 'px';

                
                this.updatePathGame(el, e);
            }
        };

        el.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);
    },

    highlightZones(e) {
        const zones = document.querySelectorAll('.category-zone');
        zones.forEach(zone => {
            const rect = zone.getBoundingClientRect();
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {
                zone.classList.add('highlight');
            } else {
                zone.classList.remove('highlight');
            }
        });
    },

    checkDrop(el, e) {
        const zones = document.querySelectorAll('.category-zone');
        let dropped = false;

        zones.forEach(zone => {
            const rect = zone.getBoundingClientRect();

            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {

                zone.classList.remove('highlight');

                const wordCategories = this.getElementCategories(el);
                const zoneCategory = zone.dataset.category;

                if (wordCategories.includes(zoneCategory)) {
                    
                    this.catchWord(el, zone);
                    dropped = true;
                } else {
                    
                    this.wrongCategory(zone);
                }
            }
        });

        
        zones.forEach(z => z.classList.remove('highlight'));

        return dropped;
    },

    catchWord(el, zone) {
        el.classList.add('caught');
        this.stopFall(el);
        this.stopPathGame(el);
        delete el._dragContext;

        
        el.style.transition = 'all 0.3s ease-out';
        el.style.transform = 'scale(1.5)';
        el.style.opacity = '0';

        setTimeout(() => el.remove(), 300);

        
        zone.classList.add('correct');
        setTimeout(() => zone.classList.remove('correct'), 500);

        
        const cat = this.categoryState.find(c => c.id === zone.dataset.category);
        if (cat) {
            cat.count++;
            const counter = zone.querySelector('.cat-count');
            if (counter) counter.innerText = cat.count;
        }

        this.caught++;
        document.getElementById('score-count').innerText = this.caught;

        SoundManager.success();

        this.scheduleCategoryShuffle();

        if (!this.isEndless && this.caught >= this.targetScore) {
            setTimeout(() => this.finish(true), 500);
        }
    },

    wrongCategory(zone) {
        zone.classList.add('wrong');
        setTimeout(() => zone.classList.remove('wrong'), 500);

        SoundManager.error();
        UserManager.removePenalty(5);
    },

    wordMissed() {
        this.missed++;

        document.getElementById('missed-count').innerText = this.missed;

        SoundManager.error();
        UserManager.removePenalty(10);

        
        const area = document.getElementById('storm-area');
        area.style.animation = 'shake 0.5s';
        setTimeout(() => {
            area.style.animation = '';
        }, 500);

        if (this.missed >= this.maxMissed) {
            if (this.isEndless) {
                this.endlessReason = 'Слишком много пропусков';
            }
            setTimeout(() => this.finish(false), 600);
        }
    },

    finish(success, timeout = false) {
        clearInterval(this.spawnTimer);
        TimerManager.stop();

        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        const timeLeft = this.levelTime ? Math.max(0, this.levelTime - elapsedTime) : 0;
        const skipWordPoints = this.skipScore;
        const basePoints = this.basePoints;
        const timeBonus = this.levelTime ? Math.max(0, timeLeft * 2) : 0;
        const accuracyBonus = this.isEndless
            ? Math.max(0, (this.caught * 15) - (this.missed * 25))
            : Math.max(0, (this.targetScore * 15) - (this.missed * 20));

        let overlayMessage;
        if (success) {
            overlayMessage = 'Подведение итогов...';
        } else if (timeout) {
            overlayMessage = 'Время вышло. Подождите...';
        } else {
            overlayMessage = 'Попытка завершена. Подождите...';
        }

        if (!success && this.isEndless) {
            success = true;
        }

        ScreenBlocker.show(overlayMessage);
        this.clearAreas();

        if (success) {
            const result = UserManager.addScore(3, basePoints, timeBonus + accuracyBonus + skipWordPoints);
            if (this.levelTime) {
                UserManager.updateBestTime(3, elapsedTime);
            }

            let message;
            if (this.isEndless && this.endlessReason) {
                message = `Бесконечный режим завершён!\n\nПричина: ${this.endlessReason}\n\nОчки за попытку: ${result.runScore}\nВ зачёт пошло: +${result.points} очков`;
            } else if (result.firstTime) {
                message = `СУПЕР!\n\n+${basePoints} базовых очков\n+${timeBonus} бонус за время\n+${accuracyBonus} бонус за точность\n+${skipWordPoints} бонус за лишние слова\n\nИтого за попытку: ${result.runScore} очков\nВ зачёт пошло: +${result.points} очков`;
            } else if (result.improved) {
                message = `Лучший результат улучшен!\n\nБыло: ${result.previousBest} очков\nСтало: ${result.newBest} очков\nДополнительно за лишние слова: +${skipWordPoints} очков\nВ зачёт пошло: +${result.points} очков`;
            } else {
                message = `Уровень пройден повторно!\n\nНовый результат: ${result.runScore} очков\nВаш рекорд: ${result.previousBest} очков\nБонус за лишние слова: +${skipWordPoints} очков\nВ зачёт пошло: +0 очков`;
            }

            NotificationManager.show(message, 'success', 6000);
            setTimeout(() => window.location.href = "../../index.html", 3500);
        } else {
            const reason = timeout
                ? "Время вышло!"
                : `Слишком много пропущено (${this.missed}/${this.maxMissed})`;
            NotificationManager.show(`Уровень не пройден!\n\n${reason}\n\nПопробуйте снова!`, 'error', 5000);
            setTimeout(() => window.location.href = "../../index.html", 2500);
        }
    }
};


const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }

    .falling-word.word-effect-base {
        transition: transform 0.9s ease, opacity 0.9s ease, color 0.9s ease, background 0.9s ease;
    }

    .falling-word.word-effect-fade {
        color: #f1f2f6;
        background: rgba(255, 255, 255, 0.18);
        border: 1px solid rgba(255, 255, 255, 0.45);
        box-shadow: 0 0 8px rgba(255, 255, 255, 0.2);
    }

    .falling-word.word-effect-fade.word-effect-fade-active {
        opacity: var(--fade-target-opacity, 0.1);
        color: #ffffff;
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 0 0 12px rgba(255, 255, 255, 0.4);
    }

    .falling-word.word-effect-shrink {
        color: #ffeaa7;
        background: rgba(255, 214, 10, 0.18);
        border: 1px solid rgba(255, 214, 10, 0.45);
        box-shadow: 0 0 8px rgba(255, 214, 10, 0.2);
    }

    .falling-word.word-effect-shrink.word-effect-shrink-active {
        transform: scale(var(--shrink-target-scale, 0.6));
        opacity: 0.85;
        box-shadow: 0 0 12px rgba(255, 214, 10, 0.4);
    }
`;
document.head.appendChild(style);

window.addEventListener("load", () => Level3.init());