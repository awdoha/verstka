// ============================================================================
// ========== УРОВЕНЬ 1: ПАРЫ СЛОВ ==========
// ============================================================================
// Этот уровень — классическая игра на соответствие:
// - В верхней части экрана расположены категории (квадраты)
// - В нижней части — слова (круги)
// - Нужно перетаскивать слова в подходящие категории
// ============================================================================

const Level1 = {
    // ==========================================================================
    // ========== 1. СОСТОЯНИЕ УРОВНЯ ==========
    // ==========================================================================
    pairsLeft: 0,              // Сколько пар осталось собрать
    errors: 0,                  // Количество ошибок в текущей попытке
    maxErrors: 5,               // Максимальное количество ошибок
    startTime: null,            // Время начала уровня (для подсчета времени)
    levelTime: 90,              // Время на уровень в секундах
    attempts: 0,                 // Общее количество попыток (перетаскиваний)
    maxPairs: 4,                 // Сколько пар нужно собрать
    totalCategories: 10,         // Общее количество категорий (включая отвлекающие)
    totalSolved: 0,              // Сколько всего пар решено (для подсчета очков)
    endlessTimerDuration: 10,    // Длительность раунда в бесконечном режиме
    endlessExtraCategories: 0,    // Дополнительные категории в бесконечном режиме
    endlessSuccessCounter: 0,     // Счетчик успешных действий в бесконечном режиме
    currentRoundPairs: 0,         // Пар в текущем раунде
    mode: 'normal',               // Текущий режим (normal, hard, endless)
    isEndless: false,             // Бесконечный режим?
    basePoints: 150,              // Базовые очки за уровень
    endlessReason: null,          // Причина завершения бесконечного режима

    // ==========================================================================
    // ========== 2. КОНФИГУРАЦИИ РЕЖИМОВ ==========
    // ==========================================================================
    modeConfigs: {
        // Обычный режим
        normal: {
            levelTime: 90,
            maxErrors: 5,
            maxPairs: 4,
            totalCategories: 10,
            basePoints: 150,
            isEndless: false
        },
        // Сложный режим
        hard: {
            levelTime: 70,
            maxErrors: 3,
            maxPairs: 5,
            totalCategories: 12,
            basePoints: 220,
            isEndless: false
        },
        // Бесконечный режим
        endless: {
            levelTime: null,
            maxErrors: 3,
            maxPairs: 5,
            totalCategories: 16,
            basePoints: 180,
            isEndless: true
        }
    },

    // ==========================================================================
    // ========== 3. МЕТОДЫ КОНФИГУРАЦИИ ==========
    // ==========================================================================

    /**
     * Применение настроек выбранного режима
     * Загружает режим из LevelModeManager и устанавливает параметры
     */
    applyModeConfig() {
        // Получаем сохраненный режим из sessionStorage
        const stored = typeof LevelModeManager !== 'undefined'
            ? LevelModeManager.get(1, 'normal')
            : 'normal';
        
        // Устанавливаем режим
        this.mode = this.modeConfigs[stored] ? stored : 'normal';
        const cfg = this.modeConfigs[this.mode];
        
        // Применяем параметры
        this.levelTime = cfg.isEndless ? this.endlessTimerDuration : (cfg.levelTime ?? 0);
        this.maxErrors = cfg.maxErrors;
        this.maxPairs = cfg.maxPairs;
        this.totalCategories = cfg.totalCategories;
        this.basePoints = cfg.basePoints;
        this.isEndless = !!cfg.isEndless;
    },

    /**
     * Получение случайного количества пар для бесконечного режима
     * @returns {number} - от 2 до 5
     */
    getEndlessPairCount() {
        return 2 + Math.floor(Math.random() * 4);
    },

    /**
     * Запуск таймера для бесконечного режима
     */
    startEndlessTimer() {
        if (!this.isEndless) return;
        
        TimerManager.start(
            this.endlessTimerDuration,
            (timeLeft, total) => this.updateTimer(timeLeft, total),
            () => this.handleEndlessTimeout()
        );
    },

    /**
     * Обработка истечения времени в бесконечном режиме
     */
    handleEndlessTimeout() {
        if (!this.isEndless) return;
        this.endlessReason = 'Время вышло';
        this.finish(false, true);
    },

    /**
     * Обработка действия в бесконечном режиме (успех/ошибка)
     * @param {boolean} success - успешно ли действие
     */
    handleEndlessAction(success) {
        if (!this.isEndless) return;
        
        // Перезапускаем таймер
        this.startEndlessTimer();
        
        if (success) {
            this.endlessSuccessCounter++;
            
            // Каждые 3 успешных действия добавляем категорию
            if (this.endlessSuccessCounter >= 3) {
                this.endlessSuccessCounter = 0;
                this.endlessExtraCategories++;
            }
        }
    },

    /**
     * Получение дополнительных категорий для бесконечного режима
     * @param {number} count - сколько категорий нужно
     * @param {Array} usedCategories - уже использованные категории
     * @returns {Array} - массив новых категорий
     */
    getEndlessAdditionalCategories(count, usedCategories) {
        if (count <= 0) return [];
        
        const extras = [];
        const used = new Set(usedCategories);
        
        // Категории из правильных пар
        const correctPool = GlobalDB.pairs
            .flatMap(pair => pair.categories)
            .filter(cat => !used.has(cat));
        
        // Отвлекающие категории
        const distractorPool = GlobalDB.distractorCategories
            .filter(cat => !used.has(cat));

        for (let i = 0; i < count; i++) {
            const useCorrect = Math.random() < 0.5;
            let selected = null;

            // Пытаемся взять из правильных
            if (useCorrect && correctPool.length > 0) {
                const idx = Math.floor(Math.random() * correctPool.length);
                selected = correctPool.splice(idx, 1)[0];
            } 
            // Иначе из отвлекающих
            else if (!useCorrect && distractorPool.length > 0) {
                const idx = Math.floor(Math.random() * distractorPool.length);
                selected = distractorPool.splice(idx, 1)[0];
            } 
            // Если ничего не взяли, пробуем любой доступный
            else if (correctPool.length > 0) {
                const idx = Math.floor(Math.random() * correctPool.length);
                selected = correctPool.splice(idx, 1)[0];
            } else if (distractorPool.length > 0) {
                const idx = Math.floor(Math.random() * distractorPool.length);
                selected = distractorPool.splice(idx, 1)[0];
            }

            if (selected && !used.has(selected)) {
                used.add(selected);
                extras.push(selected);
            }
        }

        return extras;
    },

    // ==========================================================================
    // ========== 4. МЕТОДЫ ИНИЦИАЛИЗАЦИИ ==========
    // ==========================================================================

    /**
     * Инициализация уровня
     * Запускается при загрузке страницы
     */
    init() {
        // Применяем настройки режима
        this.applyModeConfig();
        
        // Сбрасываем все счетчики
        this.startTime = Date.now();
        this.errors = 0;
        this.attempts = 0;
        this.endlessReason = null;
        this.totalSolved = 0;
        this.endlessExtraCategories = 0;
        this.endlessSuccessCounter = 0;
        this.currentRoundPairs = 0;

        // Создаем интерфейс
        this.createUI();
        
        // Генерируем игровое поле
        this.setupGame();

        // Запускаем таймер (в зависимости от режима)
        if (this.isEndless) {
            this.startEndlessTimer();
        } else {
            TimerManager.start(
                this.levelTime,
                (timeLeft, total) => this.updateTimer(timeLeft, total),
                () => this.finish(false, true)
            );
        }
    },

    /**
     * Очистка игрового поля (без удаления обработчиков)
     */
    clearBoard() {
        const zoneArea = document.getElementById('zone-area');
        const wordsArea = document.getElementById('words-area');
        
        if (zoneArea) {
            zoneArea.innerHTML = '';
        }
        if (wordsArea) {
            // Удаляем обработчики у всех элементов
            Array.from(wordsArea.querySelectorAll('.dragger')).forEach(drag => {
                if (typeof drag._detachDragHandlers === 'function') {
                    drag._detachDragHandlers();
                }
            });
            wordsArea.innerHTML = '';
        }
    },

    /**
     * Генерация нового раунда
     * Создает категории и слова в случайных позициях
     */
    setupGame() {
        const area = document.getElementById('game-area');
        const zoneArea = document.getElementById('zone-area');
        const wordsArea = document.getElementById('words-area');

        // ===== ВЫБОР ПАР =====
        // Определяем, сколько пар нужно в этом раунде
        const pairTarget = this.isEndless ? this.getEndlessPairCount() : this.maxPairs;
        const selectedPairs = this.getRandomPairs(pairTarget);
        
        this.pairsLeft = selectedPairs.length;
        this.currentRoundPairs = selectedPairs.length;

        // ===== СБОР ВСЕХ ПРАВИЛЬНЫХ КАТЕГОРИЙ =====
        const correctCategories = new Set();
        selectedPairs.forEach(pair => {
            pair.categories.forEach(cat => correctCategories.add(cat));
        });

        // ===== ФОРМИРОВАНИЕ ИТОГОВОГО СПИСКА КАТЕГОРИЙ =====
        let allCategories = [...correctCategories];
        
        if (this.isEndless) {
            // В бесконечном режиме добавляем случайные категории
            const extras = this.getEndlessAdditionalCategories(this.endlessExtraCategories, allCategories);
            allCategories = allCategories.concat(extras);
        } else {
            // В обычном режиме добавляем отвлекающие категории
            const neededDistractors = Math.max(0, this.totalCategories - allCategories.length);
            const distractors = this.getRandomDistractors(neededDistractors, correctCategories);
            allCategories = allCategories.concat(distractors);
        }

        // Перемешиваем категории
        this.shuffleArray(allCategories);

        // ===== РАСЧЕТ РАЗМЕРОВ ЭЛЕМЕНТОВ =====
        const zoneSize = this.getAdaptiveZoneSize(zoneArea, allCategories.length);
        zoneSize.width *= 0.8;
        zoneSize.height *= 0.8;
        const dragSize = this.getAdaptiveDragSize(wordsArea, selectedPairs.length);

        // Очищаем поле
        this.clearBoard();

        // ===== РАЗМЕЩЕНИЕ КАТЕГОРИЙ =====
        let zonePositions = this.generateNonOverlappingPositions(
            allCategories.length,
            zoneSize,
            zoneArea.clientWidth,
            zoneArea.clientHeight,
            2
        );

        // Если не хватило места - пробуем с другими параметрами
        if (zonePositions.length < allCategories.length) {
            zonePositions = this.generateNonOverlappingPositions(
                allCategories.length,
                zoneSize,
                zoneArea.clientWidth,
                zoneArea.clientHeight,
                4
            );
        }

        // Если всё ещё не хватает - уменьшаем размеры
        if (zonePositions.length < allCategories.length) {
            const sizeScales = [0.8, 0.6, 0.4, 0.1];
            const paddings = [8, 6, 4];
            let placed = false;
            
            for (const s of sizeScales) {
                const scaled = { width: zoneSize.width * s, height: zoneSize.height * s };
                for (const pad of paddings) {
                    const attempt = this.generateNonOverlappingPositions(
                        allCategories.length,
                        scaled,
                        zoneArea.clientWidth,
                        zoneArea.clientHeight,
                        pad
                    );
                    if (attempt.length === allCategories.length) {
                        zonePositions = attempt;
                        zoneSize.width = scaled.width;
                        zoneSize.height = scaled.height;
                        placed = true;
                        break;
                    }
                }
                if (placed) break;
            }
        }

        // Если всё равно не хватает - обрезаем категории
        if (zonePositions.length < allCategories.length) {
            const canPlace = zonePositions.length;
            allCategories = this.trimCategoriesForSpace(allCategories, correctCategories, canPlace);
            zonePositions = zonePositions.slice(0, allCategories.length);
        }

        // ===== СОЗДАНИЕ КАТЕГОРИЙ =====
        allCategories.forEach((category, index) => {
            const zone = document.createElement('div');
            zone.className = 'drop-zone';
            zone.innerHTML = `<div class="zone-label">${category}</div>`;
            zone.style.setProperty('--zone-width', `${zoneSize.width}px`);
            zone.style.setProperty('--zone-height', `${zoneSize.height}px`);

            // Сохраняем список подходящих слов для этой категории
            const matchingWords = selectedPairs
                .filter(pair => pair.categories.includes(category))
                .map(pair => pair.word);

            zone.dataset.matches = JSON.stringify(matchingWords);

            zone.style.top = zonePositions[index].y + 'px';
            zone.style.left = zonePositions[index].x + 'px';

            zoneArea.appendChild(zone);
        });

        // ===== РАЗМЕЩЕНИЕ СЛОВ =====
        let dragPositions = this.generateNonOverlappingPositions(
            selectedPairs.length,
            dragSize,
            wordsArea.clientWidth,
            wordsArea.clientHeight,
            12
        );

        // Если не хватило места - пробуем с уменьшенными размерами
        if (dragPositions.length < selectedPairs.length + 2) {
            const tries = [0.8, 0.68, 0.58, 0.45, 0.35, 0.25];
            for (const scale of tries) {
                const smaller = {
                    width: Math.max(1, dragSize.width * scale),
                    height: Math.max(1, dragSize.height * scale)
                };
                const attempt = this.generateNonOverlappingPositions(
                    selectedPairs.length,
                    smaller,
                    wordsArea.clientWidth,
                    wordsArea.clientHeight,
                    12
                );
                if (attempt.length === selectedPairs.length) {
                    dragPositions = attempt;
                    dragSize.width = smaller.width;
                    dragSize.height = smaller.height;
                    break;
                }
            }
        }

        // Если всё равно не хватает - используем сетку
        if (dragPositions.length < selectedPairs.length) {
            dragPositions = this.getGridFallbackPositions(
                selectedPairs.length,
                { width: Math.max(12, dragSize.width), height: Math.max(12, dragSize.height) },
                wordsArea.clientWidth,
                wordsArea.clientHeight,
                10
            );
        }

        // ===== СОЗДАНИЕ СЛОВ =====
        selectedPairs.forEach((pair, index) => {
            const drag = document.createElement('div');
            drag.className = 'dragger';
            drag.innerHTML = `<div class="drag-content">${pair.word}</div>`;
            drag.dataset.word = pair.word;

            drag.style.setProperty('--drag-size', `${dragSize.width}px`);
            drag.style.width = `${dragSize.width}px`;
            drag.style.height = `${dragSize.height}px`;

            drag.style.top = dragPositions[index].y + 'px';
            drag.style.left = dragPositions[index].x + 'px';

            this.makeDraggable(drag, area);
            wordsArea.appendChild(drag);
        });

        // Обновляем счетчик пар
        const pairsCount = document.getElementById('pairs-count');
        if (pairsCount) pairsCount.innerText = this.pairsLeft;
    },

    /**
     * Перезапуск раунда в бесконечном режиме
     */
    restartEndlessRound() {
        if (!this.isEndless) return;
        this.setupGame();
        this.startEndlessTimer();
    },

    /**
     * Полная очистка игровых областей
     */
    clearAreas() {
        const zoneArea = document.getElementById('zone-area');
        if (zoneArea) zoneArea.innerHTML = '';

        const wordsArea = document.getElementById('words-area');
        if (wordsArea) {
            Array.from(wordsArea.querySelectorAll('.dragger')).forEach(drag => {
                if (typeof drag._detachDragHandlers === 'function') {
                    drag._detachDragHandlers();
                }
                drag.remove();
            });
            wordsArea.innerHTML = '';
        }
    },

    // ==========================================================================
    // ========== 5. МЕТОДЫ ГЕНЕРАЦИИ ДАННЫХ ==========
    // ==========================================================================

    /**
     * Выбор случайных пар из базы
     * @param {number} count - сколько пар нужно
     * @returns {Array} - массив выбранных пар
     */
    getRandomPairs(count) {
        const shuffled = [...GlobalDB.pairs].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },

    /**
     * Выбор случайных отвлекающих категорий
     * @param {number} count - сколько нужно
     * @param {Set} excludeCategories - категории, которые нельзя использовать
     * @returns {Array} - массив категорий
     */
    getRandomDistractors(count, excludeCategories) {
        const available = GlobalDB.distractorCategories.filter(cat => !excludeCategories.has(cat));
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },

    /**
     * Перемешивание массива (алгоритм Фишера-Йетса)
     * @param {Array} array - массив для перемешивания
     */
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    /**
     * Ограничение значения в диапазоне
     */
    clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    },

    /**
     * Адаптивный расчет размера зон категорий
     */
    getAdaptiveZoneSize(container, count = 4) {
        const rect = container?.getBoundingClientRect?.();
        const width = Math.max(rect?.width || 0, container?.clientWidth || 0, container?.offsetWidth || 0, 800);
        const height = Math.max(rect?.height || 0, container?.clientHeight || 0, container?.offsetHeight || 0, 400);
        const safeCount = Math.max(1, count);
        const padding = 20;
        
        // Площадь на одну зону
        const cell = Math.sqrt(((width - padding * 2) * (height - padding * 2)) / safeCount);
        
        // Пропорции зоны
        const baseW = this.clamp(cell * 0.5, 80, Math.max(120, width / Math.max(2, Math.sqrt(safeCount))));
        const baseH = this.clamp(cell * 0.4, 64, Math.max(100, height / Math.max(2, Math.sqrt(safeCount))));
        
        return { width: baseW, height: baseH };
    },

    /**
     * Адаптивный расчет размера слов
     */
    getAdaptiveDragSize(container, count = 4) {
        const base = this.getAdaptiveZoneSize(container, count);
        const width = container?.clientWidth || 600;
        const height = container?.clientHeight || 300;
        
        const maxDiameter = Math.max(42, Math.min(Math.min(width, height) * 0.45, 120));
        const minDiameter = Math.min(52, maxDiameter);
        
        const diameter = this.clamp(Math.min(base.width, base.height) * 0.6, minDiameter, maxDiameter);
        
        return { width: diameter, height: diameter };
    },

    /**
     * Размещение элементов по сетке (запасной вариант)
     */
    getGridFallbackPositions(count, size, areaWidth, areaHeight, padding = 8) {
        const safeW = Math.max(areaWidth || 0, size.width + padding * 2);
        const safeH = Math.max(areaHeight || 0, size.height + padding * 2);
        
        const cols = Math.max(1, Math.floor((safeW - padding * 2) / (size.width + padding)));
        const rows = Math.max(1, Math.ceil(count / cols));
        
        const positions = [];
        const hStep = (safeW - padding * 2) / cols;
        const vStep = (safeH - padding * 2) / rows;
        const effW = Math.min(size.width, hStep - padding);
        const effH = Math.min(size.height, vStep - padding);
        
        for (let i = 0; i < count; i++) {
            const r = Math.floor(i / cols);
            const c = i % cols;
            positions.push({
                x: padding + c * hStep + (hStep - effW) / 2,
                y: padding + r * vStep + (vStep - effH) / 2,
                width: effW,
                height: effH
            });
        }
        return positions;
    },

    /**
     * Генерация непересекающихся позиций
     */
    generateNonOverlappingPositions: function (count, size, areaWidth, areaHeight, padding = 6, avoidZones = []) {
        const positions = [];
        const safeWidth = Math.max(areaWidth || 0, 0);
        const safeHeight = Math.max(areaHeight || 0, 0);
        const maxAttemptsPerItem = 1500;

        // Если контейнер меньше элемента - сразу выходим
        if (safeWidth < size.width + padding * 2 || safeHeight < size.height + padding * 2) {
            return [];
        }

        for (let i = 0; i < count; i++) {
            let placed = false;
            
            for (let attempt = 0; attempt < maxAttemptsPerItem; attempt++) {
                const pos = {
                    x: Math.random() * (safeWidth - size.width - padding * 2) + padding,
                    y: Math.random() * (safeHeight - size.height - padding * 2) + padding,
                    width: size.width,
                    height: size.height
                };

                // Проверяем пересечение с уже размещенными
                let valid = true;
                for (const existing of positions) {
                    if (this.rectanglesOverlap(pos, existing, padding)) {
                        valid = false;
                        break;
                    }
                }
                
                // Проверяем пересечение с зонами, которых нужно избегать
                if (valid && avoidZones.length > 0) {
                    for (const zone of avoidZones) {
                        if (this.rectanglesOverlap(pos, zone, padding)) {
                            valid = false;
                            break;
                        }
                    }
                }

                if (valid) {
                    positions.push(pos);
                    placed = true;
                    break;
                }
            }

            if (!placed) {
                break; // Места не осталось
            }
        }

        return positions;
    },

    /**
     * Проверка пересечения двух прямоугольников
     */
    rectanglesOverlap(rect1, rect2, padding = 0) {
        return !(
            rect1.x + rect1.width + padding < rect2.x ||
            rect2.x + rect2.width + padding < rect1.x ||
            rect1.y + rect1.height + padding < rect2.y ||
            rect2.y + rect2.height + padding < rect1.y
        );
    },

    /**
     * Обрезка списка категорий до доступного места
     */
    trimCategoriesForSpace(allCategories, correctSet, availableCount) {
        // Сначала берем все правильные категории
        const correct = allCategories.filter(cat => correctSet.has(cat));
        // Потом отвлекающие
        const distractors = allCategories.filter(cat => !correctSet.has(cat));
        
        // Берем все правильные и сколько влезет отвлекающих
        return [...correct, ...distractors.slice(0, Math.max(0, availableCount - correct.length))];
    },

    // ==========================================================================
    // ========== 6. МЕТОДЫ ИНТЕРФЕЙСА ==========
    // ==========================================================================

    /**
     * Создание интерфейса (таймер, счетчики)
     */
    createUI() {
        const card = document.querySelector('.level1-card') || document.querySelector('.card');
        let header = card ? card.querySelector('h2') : null;
        
        if (!header && card) {
            header = document.createElement('h2');
            card.insertBefore(header, card.firstChild);
        }
        if (!header) return;
        
        const timerLabel = (!this.isEndless && !this.levelTime)
            ? '∞'
            : TimerManager.formatTime(this.levelTime);
            
        header.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                <div>
                    <small>Пар осталось: <span id="pairs-count">${this.maxPairs}</span></small>
                </div>
                <div style="text-align: right;">
                    <div id="timer-display" style="font-size: clamp(0.5em, 1.5vw, 2.5em); font-weight: bold; color: #00b894;">
                        ${timerLabel}
                    </div>
                    <div id="error-display" style="font-size: clamp(0.4em, 1.1vw, 1.5em); color: #d63031;">
                        Промахи: <span id="error-count">0</span>/${this.maxErrors}
                    </div>
                </div>
            </div>
        `;
    },

    /**
     * Обновление таймера
     */
    updateTimer(timeLeft, total) {
        const display = document.getElementById('timer-display');
        if (!display) return;

        display.innerText = TimerManager.formatTime(timeLeft);

        // Визуальные эффекты при окончании времени
        if (timeLeft <= 15) {
            display.style.color = '#d63031';  // Красный
            display.style.animation = 'pulse 0.5s infinite';
            
            if (timeLeft <= 5) {
                SoundManager.warning();  // Звук предупреждения
            }
        } else if (timeLeft <= 30) {
            display.style.color = '#fdcb6e';  // Желтый
        } else {
            display.style.color = '#00b894';  // Зеленый
            display.style.animation = 'none';
        }
    },

    /**
     * Показ штрафа в виде всплывающего текста
     */
    showPenalty(x, y) {
        const penalty = document.createElement('div');
        penalty.className = 'floating-text';
        penalty.innerText = '-5';
        penalty.style.left = x + 'px';
        penalty.style.top = y + 'px';
        document.body.appendChild(penalty);

        setTimeout(() => penalty.remove(), 1000);
    },

    // ==========================================================================
    // ========== 7. МЕТОДЫ ПЕРЕТАСКИВАНИЯ ==========
    // ==========================================================================

    /**
     * Делает элемент перетаскиваемым
     */
    makeDraggable(el, container) {
        let isDown = false;
        let offset = [0, 0];
        let startPos = { x: 0, y: 0 };

        const onMouseDown = (e) => {
            isDown = true;
            startPos = { x: el.offsetLeft, y: el.offsetTop };
            offset = [
                el.offsetLeft - e.clientX,
                el.offsetTop - e.clientY
            ];
            el.style.zIndex = 1000;
            el.classList.add('dragging');
            SoundManager.click();
        };

        const onMouseUp = () => {
            if (!isDown) return;
            isDown = false;
            el.style.zIndex = 100;
            el.classList.remove('dragging');

            // Проверяем, куда бросили элемент
            const dropped = this.checkDrop(el, startPos);

            // Если не в правильную зону - возвращаем на место
            if (!dropped) {
                el.style.transition = 'all 0.3s ease-out';
                el.style.left = startPos.x + 'px';
                el.style.top = startPos.y + 'px';
                setTimeout(() => {
                    el.style.transition = '';
                }, 300);
            }
        };

        const onMouseMove = (e) => {
            if (isDown) {
                e.preventDefault();
                const newX = e.clientX + offset[0];
                const newY = e.clientY + offset[1];

                el.style.left = newX + 'px';
                el.style.top = newY + 'px';
            }
        };

        el.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);

        // Метод для удаления обработчиков
        el._detachDragHandlers = () => {
            el.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mousemove', onMouseMove);
        };
    },

    /**
     * Проверка, куда было брошено слово
     */
    checkDrop(el, startPos) {
        const elRect = el.getBoundingClientRect();
        const zones = document.querySelectorAll('.drop-zone');
        let dropped = false;
        this.attempts++;

        zones.forEach(zone => {
            if (zone.classList.contains('filled')) return;

            const zRect = zone.getBoundingClientRect();

            // Вычисляем площадь пересечения
            const overlapX = Math.max(0, Math.min(elRect.right, zRect.right) - Math.max(elRect.left, zRect.left));
            const overlapY = Math.max(0, Math.min(elRect.bottom, zRect.bottom) - Math.max(elRect.top, zRect.top));
            const overlapArea = overlapX * overlapY;
            const elArea = (elRect.right - elRect.left) * (elRect.bottom - elRect.top);

            // Если пересечение > 30% - считаем, что слово попало в зону
            if (overlapArea > elArea * 0.3) {
                const matchingWords = JSON.parse(zone.dataset.matches || '[]');
                const wordToMatch = el.dataset.word;

                if (matchingWords.includes(wordToMatch)) {
                    // ===== ПРАВИЛЬНО! =====
                    zone.classList.add('filled');
                    zone.style.background = 'linear-gradient(135deg, #00b894 0%, #00cec9 100%)';
                    zone.style.transform = 'scale(1.1)';
                    setTimeout(() => {
                        zone.style.transform = 'scale(1)';
                        zone.remove();
                    }, 250);

                    el.remove();

                    SoundManager.success();

                    this.pairsLeft--;
                    this.totalSolved++;
                    const pairsCount = document.getElementById('pairs-count');
                    if (pairsCount) pairsCount.innerText = this.pairsLeft;

                    dropped = true;
                    this.handleEndlessAction(true);

                    // Если все пары собраны
                    if (this.pairsLeft === 0) {
                        if (this.isEndless) {
                            setTimeout(() => this.restartEndlessRound(), 500);
                        } else {
                            setTimeout(() => this.finish(true), 500);
                        }
                    } else {
                        // Перемешиваем оставшиеся
                        setTimeout(() => {
                            this.shuffleRemaining();
                            zone.remove();
                            if (typeof el._detachDragHandlers === 'function') {
                                el._detachDragHandlers();
                            }
                            el.remove();
                        }, 300);
                    }
                } else {
                    // ===== НЕПРАВИЛЬНО! =====
                    this.errors++;
                    SoundManager.error();

                    zone.style.animation = 'shake 0.5s';
                    setTimeout(() => {
                        zone.style.animation = '';
                    }, 500);

                    const errorCount = document.getElementById('error-count');
                    if (errorCount) {
                        errorCount.innerText = this.errors;
                    }

                    UserManager.removePenalty(5);
                    this.showPenalty(elRect.left + elRect.width / 2, elRect.top);
                    this.handleEndlessAction(false);

                    if (this.errors >= this.maxErrors) {
                        if (this.isEndless) {
                            this.endlessReason = 'Превышен лимит ошибок';
                        }
                        setTimeout(() => this.finish(false), 600);
                    }
                }
            }
        });

        return dropped;
    },

    /**
     * Перемешивание оставшихся элементов
     */
    shuffleRemaining() {
        const area = document.getElementById('game-area');
        const zoneArea = document.getElementById('zone-area');
        const wordsArea = document.getElementById('words-area');

        const remainingZones = Array.from(document.querySelectorAll('.drop-zone:not(.filled)'));
        const remainingDraggers = Array.from(document.querySelectorAll('.dragger:not(.locked)'));

        if (remainingZones.length === 0 || remainingDraggers.length === 0) return;

        const zoneSample = remainingZones[0];
        const dragSample = remainingDraggers[0];
        const zoneSize = zoneSample ? { width: zoneSample.offsetWidth, height: zoneSample.offsetHeight } : { width: 120, height: 80 };
        const dragSize = dragSample ? { width: dragSample.offsetWidth, height: dragSample.offsetHeight } : { width: 80, height: 80 };

        // Генерируем новые позиции для зон
        const zonePositions = this.generateNonOverlappingPositions(
            remainingZones.length,
            zoneSize,
            zoneArea.clientWidth || 800,
            zoneArea.clientHeight || 400,
            15
        );

        // Генерируем новые позиции для слов
        const dragPositions = this.generateNonOverlappingPositions(
            remainingDraggers.length,
            dragSize,
            wordsArea.clientWidth || 800,
            wordsArea.clientHeight || 400,
            15,
            zonePositions.map(p => ({ ...p, width: zoneSize.width, height: zoneSize.height }))
        );

        // Перемещаем зоны
        remainingZones.forEach((zone, index) => {
            zone.style.left = zonePositions[index].x + 'px';
            zone.style.top = zonePositions[index].y + 'px';
            setTimeout(() => {
                zone.style.transition = '';
            }, 500);
        });

        // Перемещаем слова
        remainingDraggers.forEach((drag, index) => {
            drag.style.left = dragPositions[index].x + 'px';
            drag.style.top = dragPositions[index].y + 'px';
            setTimeout(() => {
                drag.style.transition = '';
            }, 500);
        });
    },

    // ==========================================================================
    // ========== 8. ЗАВЕРШЕНИЕ УРОВНЯ ==========
    // ==========================================================================

    /**
     * Завершение уровня
     * @param {boolean} success - успешно ли пройден
     * @param {boolean} timeout - завершение по времени
     */
    finish(success, timeout = false) {
        TimerManager.stop();

        // Расчет времени
        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        const timeLeft = this.levelTime ? this.levelTime - elapsedTime : 0;
        
        // Расчет бонусов
        const timeBonus = this.isEndless ? 0 : Math.max(0, timeLeft * 3);
        const accuracyMultiplier = this.isEndless ? 25 : 20;
        const penaltyPerError = this.isEndless ? 15 : 10;
        const solvedBase = Math.max(this.totalSolved, this.maxPairs);
        const accuracyBonus = Math.max(0, (solvedBase * accuracyMultiplier) - (this.errors * penaltyPerError));
        const basePoints = this.basePoints;

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

        // Блокируем экран
        ScreenBlocker.show(overlayMessage);
        this.clearAreas();

        if (success) {
            // Сохраняем результат
            const result = UserManager.addScore(1, basePoints, timeBonus + accuracyBonus);
            UserManager.updateBestTime(1, elapsedTime);

            let message;
            if (this.isEndless && this.endlessReason) {
                message = `Бесконечный режим завершён!\n\nПричина: ${this.endlessReason}\n\nИтого за попытку: ${result.runScore} очков\nВ зачёт пошло: +${result.points} очков`;
            } else if (result.firstTime) {
                message = `ОТЛИЧНО!\n\n+${basePoints} базовых очков\n+${timeBonus} бонус за время\n+${accuracyBonus} бонус за точность\n\nИтого за попытку: ${result.runScore} очков\nВ зачёт пошло: +${result.points} очков`;
            } else if (result.improved) {
                message = `Лучший результат улучшен!\n\nБыло: ${result.previousBest} очков\nСтало: ${result.newBest} очков\nВ зачёт пошло дополнительно: +${result.points} очков`;
            } else {
                message = `Уровень пройден повторно!\n\nНовый результат: ${result.runScore} очков\nВаш рекорд: ${result.previousBest} очков\nВ зачёт пошло: +0 очков`;
            }

            NotificationManager.show(message, 'success', 6000);
            setTimeout(() => window.location.href = "../../index.html", 3500);
        } else {
            const reason = timeout ? "Время вышло!" : `Слишком много промахов (${this.errors}/${this.maxErrors})`;
            NotificationManager.show(`Уровень не пройден!\n\n${reason}\n\nПопробуйте снова!`, 'error', 5000);
            setTimeout(() => window.location.href = "../../index.html", 3500);
        }
    }
};

// ============================================================================
// ========== ДОПОЛНИТЕЛЬНЫЕ СТИЛИ ==========
// ============================================================================
const style = document.createElement('style');
style.textContent = `
    .dragger.dragging {
        transform: scale(1.15) rotate(5deg);
        box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        cursor: grabbing !important;
    }
    
    .dragger.locked {
        opacity: 0;
        cursor: not-allowed !important;
    }
    
    .drop-zone.filled {
        border-color: #00b894;
        box-shadow: 0 0 20px rgba(0, 184, 148, 0.5);
    }
    
    .zone-label {
        font-weight: bold;
    }
    
    .drag-content {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100%;
        font-size: clamp(4px, calc(var(--drag-size, 80px) * 75%), 28px);
        font-weight: bold;
        text-align: center;
        word-break: break-word;
        overflow-wrap: anywhere;
        white-space: normal;
        line-height: 1.15;
        padding: 0 6px;
        width: 100%;
    }
`;
document.head.appendChild(style);

// Запуск уровня при загрузке страницы
window.addEventListener("load", () => Level1.init());
