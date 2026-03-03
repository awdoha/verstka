// ============================================================================
// ========== УРОВЕНЬ 2: ПАДАЮЩИЕ СЛОВА ==========
// ============================================================================
// Этот уровень — динамическая игра:
// - Слова падают сверху вниз по разным траекториям
// - Нужно перетаскивать слова в подходящие категории
// - Можно пропускать "лишние" слова правой кнопкой мыши
// ============================================================================

const Level2 = {
    // ==========================================================================
    // ========== 1. СОСТОЯНИЕ УРОВНЯ ==========
    // ==========================================================================
    spawnTimer: null,           // Таймер появления новых слов
    caught: 0,                   // Сколько слов поймано правильно
    missed: 0,                   // Сколько слов пропущено (упали вниз)
    maxMissed: 5,                // Максимальное количество пропусков
    targetScore: 10,             // Целевое количество пойманных слов
    startTime: null,             // Время начала уровня
    levelTime: 120,              // Время на уровень в секундах
    currentSpeed: 1.2,           // Текущая скорость падения (увеличивается)
    spawnInterval: 2000,         // Интервал появления новых слов (мс)
    shuffleTimer: null,          // Таймер для перетасовки категорий
    skipReward: 40,              // Бонус за правильно пропущенное слово
    skipScore: 0,                // Всего бонусных очков за пропуски
    skipHits: 0,                 // Количество правильных пропусков
    mode: 'normal',              // Текущий режим
    isEndless: false,            // Бесконечный режим?
    basePoints: 200,             // Базовые очки за уровень
    scoreGoalLabel: '10',        // Отображение цели (число или ∞)
    endlessReason: null,         // Причина завершения бесконечного режима
    visibleCategoryPreset: null, // Предустановка видимых категорий
    targetFallSeconds: 15,       // Базовое время падения слова

    // ==========================================================================
    // ========== 2. КОНФИГУРАЦИИ РЕЖИМОВ ==========
    // ==========================================================================
    modeConfigs: {
        // Обычный режим
        normal: {
            levelTime: 120,
            maxMissed: 5,
            spawnInterval: 5000,      // Слова появляются каждые 5 секунд
            skipReward: 40,
            basePoints: 200,
            visibleCategories: 3,      // Показываем 3 категории
            endless: false,
            targetFallSeconds: 15
        },
        // Сложный режим
        hard: {
            levelTime: 90,
            maxMissed: 4,
            spawnInterval: 3500,       // Чаще появление
            skipReward: 30,
            basePoints: 260,
            visibleCategories: 4,       // Больше категорий
            endless: false,
            targetFallSeconds: 12       // Слова падают быстрее
        },
        // Бесконечный режим
        endless: {
            levelTime: null,
            maxMissed: 5,
            spawnInterval: 3000,
            skipReward: 50,
            basePoints: 220,
            visibleCategories: 4,
            endless: true,
            targetFallSeconds: 12
        }
    },

    defaultVisibleCategories: 3,
    visibleCategoryStorageKey: 'level2VisibleCategories',

    // ==========================================================================
    // ========== 3. КАТЕГОРИИ И СЛОВА ==========
    // ==========================================================================
    categories: [],  // Текущие активные категории

    // Пул всех возможных категорий
    categoryPool: [
        { id: 'animals', name: 'Животные', description: 'Живые существа', count: 0, target: 4 },
        { id: 'food', name: 'Еда', description: 'Продукты питания', count: 0, target: 4 },
        { id: 'objects', name: 'Мебель', description: 'Вещи и инструменты', count: 0, target: 4 },
        { id: 'transport', name: 'Транспорт', description: 'Средства передвижения', count: 0, target: 4 },
        { id: 'nature', name: 'Природная зона', description: 'Природные объекты', count: 0, target: 4 },
        { id: 'technology', name: 'Технологии', description: 'Гаджеты и техника', count: 0, target: 4 }
    ],

    // Все возможные слова с их категориями
    words: [
        // Животные
        { text: 'КОТ', category: 'animals' },
        { text: 'СЛОН', category: 'animals' },
        { text: 'ЛЕВ', category: 'animals' },
        { text: 'ПИНГВИН', category: 'animals' },
        { text: 'ЗЕБРА', category: 'animals' },
        // Еда
        { text: 'ПИЦЦА', category: 'food' },
        { text: 'ХЛЕБ', category: 'food' },
        { text: 'СУП', category: 'food' },
        { text: 'СЫР', category: 'food' },
        { text: 'САЛАТ', category: 'food' },
        // Предметы
        { text: 'СТОЛ', category: 'objects' },
        { text: 'СТУЛ', category: 'objects' },
        { text: 'КРОВАТЬ', category: 'objects' },
        { text: 'ДИВАН', category: 'objects' },
        // Транспорт
        { text: 'МАШИНА', category: 'transport' },
        { text: 'ПОЕЗД', category: 'transport' },
        { text: 'САМОЛЁТ', category: 'transport' },
        { text: 'КОРАБЛЬ', category: 'transport' },
        { text: 'ВЕЛОСИПЕД', category: 'transport' },
        // Природа
        { text: 'ЛЕС', category: 'nature' },
        { text: 'РЕКА', category: 'nature' },
        { text: 'ГОРЫ', category: 'nature' },
        { text: 'МОРЕ', category: 'nature' },
        { text: 'ПУСТЫНЯ', category: 'nature' },
        // Технологии
        { text: 'ЭКЗОСКЕЛЕТ', category: 'technology' },
        { text: 'СМАРТФОН', category: 'technology' },
        { text: 'РОБОТ', category: 'technology' },
        { text: 'ДРОН', category: 'technology' },
        { text: 'ЛАЗЕР', category: 'technology' }
    ],

    // ==========================================================================
    // ========== 4. МЕТОДЫ НАСТРОЙКИ ==========
    // ==========================================================================

    /**
     * Применение настроек выбранного режима
     */
    applyModeSettings() {
        const stored = typeof LevelModeManager !== 'undefined'
            ? LevelModeManager.get(2, 'normal')
            : 'normal';
            
        this.mode = this.modeConfigs[stored] ? stored : 'normal';
        const cfg = this.modeConfigs[this.mode];
        
        this.levelTime = cfg.levelTime ?? 0;
        this.maxMissed = cfg.maxMissed;
        this.spawnInterval = cfg.spawnInterval;
        this.skipReward = cfg.skipReward;
        this.basePoints = cfg.basePoints;
        this.isEndless = !!cfg.endless;
        this.visibleCategoryPreset = cfg.visibleCategories ?? null;
        this.targetFallSeconds = cfg.targetFallSeconds ?? this.targetFallSeconds ?? 6;
    },

    /**
     * Ограничение количества категорий
     */
    clampVisibleCategoryCount(value) {
        const safeValue = Number.isFinite(value) ? value : this.defaultVisibleCategories;
        return Math.min(this.categoryPool.length, Math.max(1, safeValue));
    },

    /**
     * Загрузка количества видимых категорий (из localStorage)
     */
    loadVisibleCategoryCount() {
        try {
            const stored = localStorage.getItem(this.visibleCategoryStorageKey);
            if (!stored) return this.defaultVisibleCategories;
            const parsed = Number(stored);
            return this.clampVisibleCategoryCount(Number.isFinite(parsed) ? parsed : this.defaultVisibleCategories);
        } catch (e) {
            console.warn('Level2: unable to read visible category count', e);
            return this.defaultVisibleCategories;
        }
    },

    /**
     * Выбор активных категорий
     * @param {number} count - сколько категорий нужно
     * @returns {Array} - массив категорий
     */
    pickActiveCategories(count) {
        // Копируем и обнуляем счетчики
        const pool = this.categoryPool.map(cat => ({ ...cat, count: 0 }));
        
        // Перемешиваем
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        
        return pool.slice(0, count);
    },

    /**
     * Настройка активных категорий
     */
    setupActiveCategories() {
        const requested = this.visibleCategoryPreset ?? this.loadVisibleCategoryCount();
        const clamped = this.clampVisibleCategoryCount(requested);
        this.categories = this.pickActiveCategories(clamped);
    },

    // ==========================================================================
    // ========== 5. ИНИЦИАЛИЗАЦИЯ ==========
    // ==========================================================================

    /**
     * Инициализация уровня
     */
    init() {
        // Применяем настройки режима
        this.applyModeSettings();
        
        // Сбрасываем все счетчики
        this.startTime = Date.now();
        this.caught = 0;
        this.missed = 0;
        this.skipScore = 0;
        this.skipHits = 0;
        this.endlessReason = null;
        
        // Настраиваем категории
        this.setupActiveCategories();
        
        // Вычисляем целевую сумму слов
        this.targetScore = this.categories.reduce((sum, cat) => sum + cat.target, 0);
        this.scoreGoalLabel = this.isEndless ? '∞' : this.targetScore;

        // Перемешиваем слова
        this.words.sort(() => 0.5 - Math.random());

        // Создаем интерфейс
        this.createUI();
        this.renderCategories();
        this.updateSkipDisplay();

        const area = document.getElementById('storm-area');

        // Запускаем спавн слов
        this.startSpawning();

        // Запускаем таймер
        if (this.levelTime && this.levelTime > 0) {
            TimerManager.start(
                this.levelTime,
                (timeLeft, total) => this.updateTimer(timeLeft, total),
                () => this.finish(false, true)
            );
        } else {
            const display = document.getElementById('timer-display');
            if (display) {
                display.innerText = '∞';  // Бесконечность
            }
        }
    },

    /**
     * Создание интерфейса (статистика)
     */
    createUI() {
        const card = document.querySelector('.level2-card') || document.querySelector('.card');
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
                    <!-- Время -->
                    <div class="stat-item stat-item--time">
                        <div class="stat-label">⏱ Время</div>
                        <div class="stat-value" id="timer-display">${timerLabel}</div>
                    </div>
                    <!-- Поймано -->
                    <div class="stat-item stat-item--good">
                        <div class="stat-label">🎯 Поймано</div>
                        <div class="stat-value">
                            <span id="score-count">0</span>/<span>${this.scoreGoalLabel}</span>
                        </div>
                    </div>
                    <!-- Пропущено -->
                    <div class="stat-item stat-item--bad">
                        <div class="stat-label">⚠ Пропущено</div>
                        <div class="stat-value">
                            <span id="missed-count">0</span>/<span>${this.maxMissed}</span>
                        </div>
                    </div>
                    <!-- Бонус за лишние слова -->
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

    /**
     * Отрисовка категорий
     */
    renderCategories() {
        const catArea = document.getElementById('categories-area');
        if (!catArea) return;
        catArea.innerHTML = '';

        this.categories.forEach(cat => {
            const zone = document.createElement('div');
            zone.className = 'category-zone';
            zone.dataset.category = cat.id;
            zone.innerHTML = `
                <div class="category-label">${cat.name}</div>
                <div class="category-counter">
                    <span class="cat-count">${cat.count}</span>
                </div>
            `;
            catArea.appendChild(zone);
        });
    },

    /**
     * Перемешивание категорий
     */
    shuffleCategories() {
        for (let i = this.categories.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.categories[i], this.categories[j]] = [this.categories[j], this.categories[i]];
        }
    },

    /**
     * Планирование перетасовки категорий
     */
    scheduleCategoryShuffle() {
        if (this.shuffleTimer) {
            clearTimeout(this.shuffleTimer);
        }
        this.shuffleTimer = setTimeout(() => {
            this.shuffleCategories();
            this.renderCategories();
            this.shuffleTimer = null;
        }, 400);
    },

    /**
     * Обновление отображения бонусов за пропуски
     */
    updateSkipDisplay() {
        const count = document.getElementById('skip-count');
        const points = document.getElementById('skip-points');
        if (count) count.innerText = this.skipHits;
        if (points) points.innerText = this.skipScore;
    },

    /**
     * Очистка игровых областей
     */
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

    // ==========================================================================
    // ========== 6. МЕХАНИКА ПРОПУСКА (ПКМ) ==========
    // ==========================================================================

    /**
     * Проверка, есть ли категория среди активных
     */
    hasActiveCategory(categoryId) {
        return this.categories.some(cat => cat.id === categoryId);
    },

    /**
     * Проверка, можно ли пропустить слово
     * Слово можно пропустить, если его категории нет среди активных
     */
    canSkipWord(el) {
        if (!el) return false;
        const category = el.dataset.category;
        return !this.hasActiveCategory(category);
    },

    /**
     * Обработка правильного пропуска (слово лишнее)
     */
    handleSkipWord(el) {
        if (!el || el.classList.contains('skip-resolved')) return;
        
        this.stopFall(el);
        el.classList.add('skip-resolved');
        delete el._dragContext;

        this.skipHits++;
        this.skipScore += this.skipReward;
        this.updateSkipDisplay();
        SoundManager.success();

        // Анимация исчезновения
        el.style.transition = 'all 0.25s ease-out';
        el.style.transform = 'scale(1.2)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 200);
    },

    /**
     * Обработка неправильного пропуска (слово нужно было положить в категорию)
     */
    handleInvalidSkip(el) {
        if (!el || el.classList.contains('skip-resolved')) return;
        
        this.stopFall(el);
        el.classList.add('skip-resolved');
        delete el._dragContext;

        // Штраф в двойном размере
        UserManager.removePenalty(this.skipReward * 2);
        SoundManager.error();

        this.missed++;
        const missedDisplay = document.getElementById('missed-count');
        if (missedDisplay) missedDisplay.innerText = this.missed;

        // Тряска экрана
        const area = document.getElementById('storm-area');
        if (area) {
            area.style.animation = 'shake 0.4s';
            setTimeout(() => area.style.animation = '', 400);
        }

        // Анимация исчезновения
        el.style.transition = 'all 0.25s ease-out';
        el.style.transform = 'scale(0.8)';
        el.style.opacity = '0';
        setTimeout(() => el.remove(), 200);

        // Проверка на поражение
        if (this.missed >= this.maxMissed) {
            setTimeout(() => this.finish(false), 500);
        }
    },

    // ==========================================================================
    // ========== 7. ТАЙМЕР ==========
    // ==========================================================================

    /**
     * Обновление отображения таймера
     */
    updateTimer(timeLeft, total) {
        const display = document.getElementById('timer-display');
        if (!display) return;

        display.innerText = TimerManager.formatTime(timeLeft);

        // Визуальные эффекты при окончании времени
        if (timeLeft <= 20) {
            display.style.color = '#d63031';  // Красный
            display.style.animation = 'pulse 0.5s infinite';
            
            if (timeLeft <= 5) {
                SoundManager.warning();  // Звук предупреждения
            }
        } else if (timeLeft <= 40) {
            display.style.color = '#fdcb6e';  // Желтый
        } else {
            display.style.color = '#00b894';  // Зеленый
            display.style.animation = 'none';
        }
    },

    // ==========================================================================
    // ========== 8. ПОЯВЛЕНИЕ СЛОВ ==========
    // ==========================================================================

    /**
     * Запуск цикла появления слов
     */
    startSpawning() {
        let wordIndex = 0;

        const spawnNext = () => {
            // Проверка на окончание в обычном режиме
            if (!this.isEndless && this.caught >= this.targetScore) {
                return;
            }
            if (!this.isEndless && wordIndex >= this.words.length) {
                return;
            }

            this.spawnWord(this.words[wordIndex]);
            wordIndex++;

            // В бесконечном режиме перезапускаем цикл
            if (this.isEndless && wordIndex >= this.words.length) {
                wordIndex = 0;
                this.words.sort(() => 0.5 - Math.random());  // Перемешиваем
            }
        };

        // Первое слово сразу
        spawnNext();

        // Запускаем интервал
        this.spawnTimer = setInterval(() => {
            spawnNext();

            // Ускорение по мере прогресса
            if (this.caught > 0 && this.caught % 3 === 0) {
                this.currentSpeed = Math.min(3, this.currentSpeed + 0.2);
                this.spawnInterval = Math.max(1200, this.spawnInterval - 200);

                // Перезапускаем с новым интервалом
                clearInterval(this.spawnTimer);
                this.startSpawning();
            }
        }, this.spawnInterval);
    },

    /**
     * Создание одного падающего слова
     */
    spawnWord(wordData) {
        const area = document.getElementById('storm-area');
        if (!area) return;

        const el = document.createElement('div');
        el.className = 'falling-word';
        el.innerText = wordData.text;
        el.dataset.category = wordData.category;
        el.style.top = '-20px';  // Начинает за верхней границей

        area.appendChild(el);

        // Случайная позиция по горизонтали
        const maxLeft = Math.max(0, area.clientWidth - el.offsetWidth);
        el.style.left = Math.random() * maxLeft + 'px';

        // Делаем перетаскиваемым
        this.makeDraggable(el, area);

        // Обработчик правого клика (пропуск)
        el.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (this.canSkipWord(el)) {
                this.handleSkipWord(el);
            } else {
                this.handleInvalidSkip(el);
            }
        });

        // Запускаем падение
        this.startFall(el, area);
    },

    // ==========================================================================
    // ========== 9. ФИЗИКА ПАДЕНИЯ ==========
    // ==========================================================================

    /**
     * Получение скорости падения в зависимости от текущей сложности
     */
    getVerticalSpeed(area) {
        const rectHeight = area?.getBoundingClientRect ? area.getBoundingClientRect().height : null;
        const areaHeight = Math.max(11, rectHeight || area?.clientHeight);
        const randomFactor = 0.9 + Math.random() * 0.3; // 0.9–1.2
        const effectiveTime = Math.max(
            0.4,
            (this.targetFallSeconds / Math.max(0.6, this.currentSpeed)) * randomFactor
        );
        const verticalSpeed = areaHeight / effectiveTime; // px/sec
        return { areaHeight, verticalSpeed };
    },

    /**
     * Случайный выбор типа траектории
     */
    getTrajectoryType() {
        const types = ['straight', 'sine', 'diagonal'];
        return types[Math.floor(Math.random() * types.length)];
    },

    /**
     * Создание траектории для слова
     * @param {HTMLElement} area - контейнер
     * @param {HTMLElement} el - слово
     * @param {string} forcedType - принудительный тип (для возобновления)
     * @param {Object} verticalMetrics - метрики падения
     */
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

        // Для синусоидальной траектории
        if (type === 'sine') {
            const amplitudeBase = 90 + Math.random() * 90;
            const amplitudeLimit = Math.max(10, widthLimit / 2);
            trajectory.amplitude = Math.min(amplitudeBase, amplitudeLimit);
            trajectory.frequency = 1 + Math.random() * 1.5;
            
            // Корректируем базовую позицию, чтобы не выходить за границы
            const minBase = trajectory.amplitude;
            const maxBase = Math.max(minBase, widthLimit - trajectory.amplitude);
            trajectory.baseX = clampX(Math.max(minBase, Math.min(startX, maxBase)));
            trajectory.currentX = trajectory.baseX;
        } 
        // Для диагональной траектории
        else if (type === 'diagonal') {
            trajectory.horizontalSpeed = 60 + Math.random() * 60;
            trajectory.direction = Math.random() > 0.5 ? 1 : -1;
        }

        return trajectory;
    },

    /**
     * Запуск анимации падения
     */
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
            // Если слово схвачено или поймано - останавливаем анимацию
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
            
            // Вертикальное движение
            trajectory.currentY += trajectory.verticalSpeed * delta;

            // Горизонтальное движение в зависимости от типа
            if (trajectory.type === 'sine') {
                // Синусоида: X = baseX + A * sin(t*frequency + phase)
                const nextX = trajectory.baseX +
                    Math.sin(trajectory.elapsed * trajectory.frequency + trajectory.phase) * trajectory.amplitude;
                trajectory.currentX = clampX(nextX);
            } else if (trajectory.type === 'diagonal') {
                // Диагональ: движение с отражением от стенок
                let nextX = trajectory.currentX + trajectory.horizontalSpeed * delta * trajectory.direction;
                if (nextX <= 0 || nextX >= areaWidth) {
                    trajectory.direction *= -1;
                    nextX = clampX(nextX);
                }
                trajectory.currentX = nextX;
            } else {
                // Прямое падение
                trajectory.currentX = clampX(trajectory.baseX);
            }

            el.style.left = trajectory.currentX + 'px';
            el.style.top = trajectory.currentY + 'px';

            // Проверка, не упало ли слово вниз
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

    /**
     * Возобновление падения после перетаскивания
     */
    resumeFall(el, area) {
        if (!area) return;
        const type = el._trajectory ? el._trajectory.type : null;
        this.startFall(el, area, type);
    },

    /**
     * Остановка анимации падения
     */
    stopFall(el) {
        if (!el || !el.dataset) return;
        const frameId = Number(el.dataset.fallFrame);
        if (frameId) {
            cancelAnimationFrame(frameId);
        }
        delete el.dataset.fallFrame;
    },

    // ==========================================================================
    // ========== 10. DRAG-AND-DROP ==========
    // ==========================================================================

    /**
     * Делает элемент перетаскиваемым
     */
    makeDraggable(el, container) {
        let isDown = false;

        /**
         * Перенос элемента в глобальный слой (поверх всего)
         */
        const promoteToGlobalLayer = (e) => {
            const rect = el.getBoundingClientRect();
            el._dragContext = {
                offsetX: e.clientX - rect.left,   // Смещение курсора от левого края
                offsetY: e.clientY - rect.top,     // Смещение курсора от верхнего края
                parent: el.parentElement,          // Исходный родитель
                nextSibling: el.nextSibling,       // Соседний элемент
                width: rect.width
            };

            document.body.appendChild(el);
            el.style.position = 'fixed';
            el.style.left = rect.left + 'px';
            el.style.top = rect.top + 'px';
            el.style.width = rect.width + 'px';
        };

        /**
         * Возврат элемента в область падения
         */
        const restoreToStormArea = () => {
            if (!el._dragContext) return;
            const host = el._dragContext.parent || container;
            if (!host) return;

            const hostRect = host.getBoundingClientRect();
            const currentLeft = parseFloat(el.style.left) || 0;
            const currentTop = parseFloat(el.style.top) || 0;
            const relativeLeft = currentLeft - hostRect.left;
            const relativeTop = currentTop - hostRect.top;

            // Возвращаем в исходный родитель
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

            // Ограничиваем позицию
            const maxX = Math.max(0, host.clientWidth - el.offsetWidth);
            const clampedLeft = Math.max(0, Math.min(relativeLeft, maxX));
            const clampedTop = Math.max(-20, relativeTop);  // Можно немного выше
            el.style.left = clampedLeft + 'px';
            el.style.top = clampedTop + 'px';

            delete el._dragContext;
        };

        const onMouseDown = (e) => {
            if (e.button !== 0) return;  // Только левая кнопка

            isDown = true;

            // Останавливаем падение
            this.stopFall(el);
            promoteToGlobalLayer(e);

            el.style.zIndex = 10000;
            el.classList.add('dragging');
            SoundManager.click();
        };

        const onMouseUp = (e) => {
            if (!isDown) return;
            isDown = false;
            el.style.zIndex = 100;
            el.classList.remove('dragging');

            // Проверяем, куда бросили слово
            const dropped = this.checkDrop(el, e);

            if (!dropped) {
                // Если не в категорию - возвращаем в область падения
                restoreToStormArea();
                this.resumeFall(el, container);
            } else {
                delete el._dragContext;
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

                // Подсвечиваем категории при перетаскивании
                this.highlightZones(e);
            }
        };

        el.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);
    },

    /**
     * Подсветка категорий при перетаскивании
     */
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

    // ==========================================================================
    // ========== 11. ПРОВЕРКА ПОПАДАНИЯ ==========
    // ==========================================================================

    /**
     * Проверка, куда было брошено слово
     */
    checkDrop(el, e) {
        const zones = document.querySelectorAll('.category-zone');
        let dropped = false;

        zones.forEach(zone => {
            const rect = zone.getBoundingClientRect();

            // Проверяем, находится ли курсор внутри зоны
            if (e.clientX >= rect.left && e.clientX <= rect.right &&
                e.clientY >= rect.top && e.clientY <= rect.bottom) {

                zone.classList.remove('highlight');

                const wordCategory = el.dataset.category;
                const zoneCategory = zone.dataset.category;

                if (wordCategory === zoneCategory) {
                    // ПРАВИЛЬНО!
                    this.catchWord(el, zone);
                    dropped = true;
                } else {
                    // НЕПРАВИЛЬНО!
                    this.wrongCategory(zone);
                }
            }
        });

        // Убираем подсветку со всех зон
        zones.forEach(z => z.classList.remove('highlight'));

        return dropped;
    },

    /**
     * Обработка правильного попадания
     */
    catchWord(el, zone) {
        el.classList.add('caught');
        this.stopFall(el);
        delete el._dragContext;

        // Анимация исчезновения
        el.style.transition = 'all 0.3s ease-out';
        el.style.transform = 'scale(1.5)';
        el.style.opacity = '0';

        setTimeout(() => el.remove(), 300);

        // Анимация зоны
        zone.classList.add('correct');
        setTimeout(() => zone.classList.remove('correct'), 500);

        // Обновляем счетчик категории
        const cat = this.categories.find(c => c.id === zone.dataset.category);
        if (cat) {
            cat.count++;
            const counter = zone.querySelector('.cat-count');
            if (counter) counter.innerText = cat.count;
        }

        this.caught++;
        document.getElementById('score-count').innerText = this.caught;

        SoundManager.success();

        // Планируем перетасовку категорий
        this.scheduleCategoryShuffle();

        // Проверка на победу
        if (!this.isEndless && this.caught >= this.targetScore) {
            setTimeout(() => this.finish(true), 500);
        }
    },

    /**
     * Обработка неправильного попадания
     */
    wrongCategory(zone) {
        zone.classList.add('wrong');
        setTimeout(() => zone.classList.remove('wrong'), 500);

        SoundManager.error();
        UserManager.removePenalty(5);  // Штраф 5 очков
    },

    // ==========================================================================
    // ========== 12. ПРОПУЩЕННЫЕ СЛОВА ==========
    // ==========================================================================

    /**
     * Обработка пропущенного слова (упало вниз)
     */
    wordMissed() {
        this.missed++;

        document.getElementById('missed-count').innerText = this.missed;

        SoundManager.error();
        UserManager.removePenalty(10);  // Штраф 10 очков

        // Тряска экрана
        const area = document.getElementById('storm-area');
        area.style.animation = 'shake 0.5s';
        setTimeout(() => {
            area.style.animation = '';
        }, 500);

        // Проверка на поражение
        if (this.missed >= this.maxMissed) {
            if (this.isEndless) {
                this.endlessReason = 'Слишком много пропусков';
            }
            setTimeout(() => this.finish(false), 600);
        }
    },

    // ==========================================================================
    // ========== 13. ЗАВЕРШЕНИЕ УРОВНЯ ==========
    // ==========================================================================

    /**
     * Завершение уровня
     */
    finish(success, timeout = false) {
        clearInterval(this.spawnTimer);
        TimerManager.stop();

        // Расчет времени
        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        const timeLeft = this.levelTime ? Math.max(0, this.levelTime - elapsedTime) : 0;
        
        // Расчет бонусов
        const skipWordPoints = this.skipScore;
        const basePoints = this.basePoints;
        const timeBonus = this.levelTime ? Math.max(0, timeLeft * 2) : 0;
        const accuracyBonus = this.isEndless
            ? Math.max(0, (this.caught * 12) - (this.missed * 25))
            : Math.max(0, (this.targetScore * 15) - (this.missed * 20));

        // Сообщение для блокировки экрана
        let overlayMessage;
        if (success) {
            overlayMessage = 'Подведение итогов...';
        } else if (timeout) {
            overlayMessage = 'Время вышло. Подождите...';
        } else {
            overlayMessage = 'Попытка завершена. Подождите...';
        }

        // В бесконечном режиме поражение превращается в успех
        if (!success && this.isEndless) {
            success = true;
        }

        ScreenBlocker.show(overlayMessage);
        this.clearAreas();

        if (success) {
            // Сохраняем результат
            const result = UserManager.addScore(2, basePoints, timeBonus + accuracyBonus + skipWordPoints);
            if (this.levelTime) {
                UserManager.updateBestTime(2, elapsedTime);
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

// ============================================================================
// ========== ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ==========
// ============================================================================
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }
`;
document.head.appendChild(style);

// Запуск уровня при загрузке страницы
window.addEventListener("load", () => Level2.init());
