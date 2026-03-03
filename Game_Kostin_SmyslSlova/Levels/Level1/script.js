const Level1 = {
    pairsLeft: 0,
    errors: 0,
    maxErrors: 5,
    startTime: null,
    levelTime: 90,
    attempts: 0,
    maxPairs: 4,
    totalCategories: 10,
    totalSolved: 0,
    endlessTimerDuration: 10,
    endlessExtraCategories: 0,
    endlessSuccessCounter: 0,
    currentRoundPairs: 0,
    mode: 'normal',
    isEndless: false,
    basePoints: 150,
    endlessReason: null,
    modeConfigs: {
        normal: {
            levelTime: 90,
            maxErrors: 5,
            maxPairs: 4,
            totalCategories: 10,
            basePoints: 150,
            isEndless: false
        },
        hard: {
            levelTime: 70,
            maxErrors: 3,
            maxPairs: 5,
            totalCategories: 12,
            basePoints: 220,
            isEndless: false
        },
        endless: {
            levelTime: null,
            maxErrors: 3,
            maxPairs: 5,
            totalCategories: 16,
            basePoints: 180,
            isEndless: true
        }
    },
    applyModeConfig() {
        const stored = typeof LevelModeManager !== 'undefined'
            ? LevelModeManager.get(1, 'normal')
            : 'normal';
        this.mode = this.modeConfigs[stored] ? stored : 'normal';
        const cfg = this.modeConfigs[this.mode];
        this.levelTime = cfg.isEndless ? this.endlessTimerDuration : (cfg.levelTime ?? 0);
        this.maxErrors = cfg.maxErrors;
        this.maxPairs = cfg.maxPairs;
        this.totalCategories = cfg.totalCategories;
        this.basePoints = cfg.basePoints;
        this.isEndless = !!cfg.isEndless;
    },

    getEndlessPairCount() {
        return 2 + Math.floor(Math.random() * 4);
    },

    startEndlessTimer() {
        if (!this.isEndless) return;
        TimerManager.start(
            this.endlessTimerDuration,
            (timeLeft, total) => this.updateTimer(timeLeft, total),
            () => this.handleEndlessTimeout()
        );
    },

    handleEndlessTimeout() {
        if (!this.isEndless) return;
        this.endlessReason = 'Время вышло';
        this.finish(false, true);
    },

    handleEndlessAction(success) {
        if (!this.isEndless) return;
        this.startEndlessTimer();
        if (success) {
            this.endlessSuccessCounter++;
            if (this.endlessSuccessCounter >= 3) {
                this.endlessSuccessCounter = 0;
                this.endlessExtraCategories++;
            }
        }
    },

    getEndlessAdditionalCategories(count, usedCategories) {
        if (count <= 0) return [];
        const extras = [];
        const used = new Set(usedCategories);
        const correctPool = GlobalDB.pairs
            .flatMap(pair => pair.categories)
            .filter(cat => !used.has(cat));
        const distractorPool = GlobalDB.distractorCategories
            .filter(cat => !used.has(cat));

        for (let i = 0; i < count; i++) {
            const useCorrect = Math.random() < 0.5;
            let selected = null;

            if (useCorrect && correctPool.length > 0) {
                const idx = Math.floor(Math.random() * correctPool.length);
                selected = correctPool.splice(idx, 1)[0];
            } else if (!useCorrect && distractorPool.length > 0) {
                const idx = Math.floor(Math.random() * distractorPool.length);
                selected = distractorPool.splice(idx, 1)[0];
            } else if (correctPool.length > 0) {
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

    init() {
        this.applyModeConfig();
        this.startTime = Date.now();
        this.errors = 0;
        this.attempts = 0;
        this.endlessReason = null;
        this.totalSolved = 0;
        this.endlessExtraCategories = 0;
        this.endlessSuccessCounter = 0;
        this.currentRoundPairs = 0;

        this.createUI();
        this.setupGame();

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

    clearBoard() {
        const zoneArea = document.getElementById('zone-area');
        const wordsArea = document.getElementById('words-area');
        if (zoneArea) {
            zoneArea.innerHTML = '';
        }
        if (wordsArea) {
            Array.from(wordsArea.querySelectorAll('.dragger')).forEach(drag => {
                if (typeof drag._detachDragHandlers === 'function') {
                    drag._detachDragHandlers();
                }
            });
            wordsArea.innerHTML = '';
        }
    },

    setupGame() {
        const area = document.getElementById('game-area');
        const zoneArea = document.getElementById('zone-area');
        const wordsArea = document.getElementById('words-area');

        // Адаптивные размеры зон и слов под доступное пространство и их количество
        const pairTarget = this.isEndless ? this.getEndlessPairCount() : this.maxPairs;
        const selectedPairs = this.getRandomPairs(pairTarget);
        this.pairsLeft = selectedPairs.length;
        this.currentRoundPairs = selectedPairs.length;

        const correctCategories = new Set();
        selectedPairs.forEach(pair => {
            pair.categories.forEach(cat => correctCategories.add(cat));
        });

        let allCategories = [...correctCategories];
        if (this.isEndless) {
            const extras = this.getEndlessAdditionalCategories(this.endlessExtraCategories, allCategories);
            allCategories = allCategories.concat(extras);
        } else {
            const neededDistractors = Math.max(0, this.totalCategories - allCategories.length);
            const distractors = this.getRandomDistractors(neededDistractors, correctCategories);
            allCategories = allCategories.concat(distractors);
        }

        this.shuffleArray(allCategories);

        const zoneSize = this.getAdaptiveZoneSize(zoneArea, allCategories.length);
        zoneSize.width *= 0.8;
        zoneSize.height *= 0.8;
        const dragSize = this.getAdaptiveDragSize(wordsArea, selectedPairs.length);

        this.clearBoard();

        let zonePositions = this.generateNonOverlappingPositions(
            allCategories.length,
            zoneSize,
            zoneArea.clientWidth,
            zoneArea.clientHeight,
            2
        );

        if (zonePositions.length < allCategories.length) {
            zonePositions = this.generateNonOverlappingPositions(
                allCategories.length,
                zoneSize,
                zoneArea.clientWidth,
                zoneArea.clientHeight,
                4
            );
        }

        console.log(zonePositions.length, allCategories.length);
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

        // Если всё ещё не хватает мест — обрезаем дистракторы, сохраняем только то, что поместилось
        if (zonePositions.length < allCategories.length) {
            const canPlace = zonePositions.length;
            allCategories = this.trimCategoriesForSpace(allCategories, correctCategories, canPlace);
            zonePositions = zonePositions.slice(0, allCategories.length);
        }


        allCategories.forEach((category, index) => {
            const zone = document.createElement('div');
            zone.className = 'drop-zone';
            zone.innerHTML = `<div class="zone-label">${category}</div>`;
            zone.style.setProperty('--zone-width', `${zoneSize.width}px`);
            zone.style.setProperty('--zone-height', `${zoneSize.height}px`);

            const matchingWords = selectedPairs
                .filter(pair => pair.categories.includes(category))
                .map(pair => pair.word);

            zone.dataset.matches = JSON.stringify(matchingWords);

            zone.style.top = zonePositions[index].y + 'px';
            zone.style.left = zonePositions[index].x + 'px';

            zoneArea.appendChild(zone);
        });


        let dragPositions = this.generateNonOverlappingPositions(
            selectedPairs.length,
            dragSize,
            wordsArea.clientWidth,
            wordsArea.clientHeight,
            12
        );

        if (dragPositions.length < selectedPairs.length+2) {
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

        if (dragPositions.length < selectedPairs.length) {
            dragPositions = this.getGridFallbackPositions(
                selectedPairs.length,
                { width: Math.max(12, dragSize.width), height: Math.max(12, dragSize.height) },
                wordsArea.clientWidth,
                wordsArea.clientHeight,
                10
            );
        }


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

        const pairsCount = document.getElementById('pairs-count');
        if (pairsCount) pairsCount.innerText = this.pairsLeft;
    },

    restartEndlessRound() {
        if (!this.isEndless) return;
        this.setupGame();
        this.startEndlessTimer();
    },

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

    getRandomPairs(count) {
        const shuffled = [...GlobalDB.pairs].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },

    getRandomDistractors(count, excludeCategories) {
        const available = GlobalDB.distractorCategories.filter(cat => !excludeCategories.has(cat));
        const shuffled = [...available].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    },

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    },

    clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    },

    getAdaptiveZoneSize(container, count = 4) {
        const rect = container?.getBoundingClientRect?.();
        const width = Math.max(rect?.width || 0, container?.clientWidth || 0, container?.offsetWidth || 0, 800);
        const height = Math.max(rect?.height || 0, container?.clientHeight || 0, container?.offsetHeight || 0, 400);
        const safeCount = Math.max(1, count);
        const padding = 20;
        const cell = Math.sqrt(((width - padding * 2) * (height - padding * 2)) / safeCount);
        const baseW = this.clamp(cell * 0.5, 80, Math.max(120, width / Math.max(2, Math.sqrt(safeCount))));
        const baseH = this.clamp(cell * 0.4, 64, Math.max(100, height / Math.max(2, Math.sqrt(safeCount))));
        return { width: baseW, height: baseH };
    },

    getAdaptiveDragSize(container, count = 4) {
        const base = this.getAdaptiveZoneSize(container, count);
        const width = container?.clientWidth || 600;
        const height = container?.clientHeight || 300;
        const maxDiameter = Math.max(42, Math.min(Math.min(width, height) * 0.45, 120));
        const minDiameter = Math.min(52, maxDiameter);
        const diameter = this.clamp(Math.min(base.width, base.height) * 0.6, minDiameter, maxDiameter);
        return { width: diameter, height: diameter };
    },

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

    generateNonOverlappingPositions: function (count, size, areaWidth, areaHeight, padding = 6, avoidZones = []) {
        const positions = [];
        const safeWidth = Math.max(areaWidth || 0, 0);
        const safeHeight = Math.max(areaHeight || 0, 0);
        const maxAttemptsPerItem = 1500;

        // Если контейнер меньше, чем элемент с отступами — сразу пустой результат
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

                let valid = true;
                for (const existing of positions) {
                    if (this.rectanglesOverlap(pos, existing, padding)) {
                        valid = false;
                        break;
                    }
                }
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
                break; // места не осталось — выходим
            }
        }

        return positions;
    },

    rectanglesOverlap(rect1, rect2, padding = 0) {
        return !(
            rect1.x + rect1.width + padding < rect2.x ||
            rect2.x + rect2.width + padding < rect1.x ||
            rect1.y + rect1.height + padding < rect2.y ||
            rect2.y + rect2.height + padding < rect1.y
        );
    },

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

    updateTimer(timeLeft, total) {
        const display = document.getElementById('timer-display');
        if (!display) return;

        display.innerText = TimerManager.formatTime(timeLeft);

        if (timeLeft <= 15) {
            display.style.color = '#d63031';
            display.style.animation = 'pulse 0.5s infinite';
            if (timeLeft <= 5) {
                SoundManager.warning();
            }
        } else if (timeLeft <= 30) {
            display.style.color = '#fdcb6e';
        } else {
            display.style.color = '#00b894';
            display.style.animation = 'none';
        }
    },

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

            const dropped = this.checkDrop(el, startPos);

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

                const parent = el.parentElement;
                const maxX = parent.clientWidth - el.offsetWidth;
                const maxY = parent.clientHeight - el.offsetHeight;


                el.style.left = newX + 'px';
                el.style.top = newY + 'px';

            }
        };

        el.addEventListener('mousedown', onMouseDown);
        document.addEventListener('mouseup', onMouseUp);
        document.addEventListener('mousemove', onMouseMove);

        el._detachDragHandlers = () => {
            el.removeEventListener('mousedown', onMouseDown);
            document.removeEventListener('mouseup', onMouseUp);
            document.removeEventListener('mousemove', onMouseMove);
        };
    },

    checkDrop(el, startPos) {
        const elRect = el.getBoundingClientRect();
        const zones = document.querySelectorAll('.drop-zone');
        let dropped = false;
        this.attempts++;

        zones.forEach(zone => {
            if (zone.classList.contains('filled')) return;

            const zRect = zone.getBoundingClientRect();

            const overlapX = Math.max(0, Math.min(elRect.right, zRect.right) - Math.max(elRect.left, zRect.left));
            const overlapY = Math.max(0, Math.min(elRect.bottom, zRect.bottom) - Math.max(elRect.top, zRect.top));
            const overlapArea = overlapX * overlapY;
            const elArea = (elRect.right - elRect.left) * (elRect.bottom - elRect.top);

            if (overlapArea > elArea * 0.3) {
                const matchingWords = JSON.parse(zone.dataset.matches || '[]');
                const wordToMatch = el.dataset.word;

                if (matchingWords.includes(wordToMatch)) {
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

                    if (this.pairsLeft === 0) {
                        if (this.isEndless) {
                            setTimeout(() => this.restartEndlessRound(), 500);
                        } else {
                            setTimeout(() => this.finish(true), 500);
                        }
                    } else {
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

        const zonePositions = this.generateNonOverlappingPositions(
            remainingZones.length,
            zoneSize,
            zoneArea.clientWidth || 800,
            zoneArea.clientHeight || 400,
            15
        );

        const dragPositions = this.generateNonOverlappingPositions(
            remainingDraggers.length,
            dragSize,
            wordsArea.clientWidth || 800,
            wordsArea.clientHeight || 400,
            15,
            zonePositions.map(p => ({ ...p, width: zoneSize.width, height: zoneSize.height }))
        );

        remainingZones.forEach((zone, index) => {
            //zone.style.transition = 'all 0.5s ease-in-out';
            zone.style.left = zonePositions[index].x + 'px';
            zone.style.top = zonePositions[index].y + 'px';
            setTimeout(() => {
                zone.style.transition = '';
            }, 500);
        });

        remainingDraggers.forEach((drag, index) => {
            //drag.style.transition = 'all 0.5s ease-in-out';
            drag.style.left = dragPositions[index].x + 'px';
            drag.style.top = dragPositions[index].y + 'px';
            setTimeout(() => {
                drag.style.transition = '';
            }, 500);
        });
    },

    showPenalty(x, y) {
        const penalty = document.createElement('div');
        penalty.className = 'floating-text';
        penalty.innerText = '-5';
        penalty.style.left = x + 'px';
        penalty.style.top = y + 'px';
        document.body.appendChild(penalty);

        setTimeout(() => penalty.remove(), 1000);
    },

    finish(success, timeout = false) {
        TimerManager.stop();

        const elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
        const timeLeft = this.levelTime ? this.levelTime - elapsedTime : 0;
        const timeBonus = this.isEndless ? 0 : Math.max(0, timeLeft * 3);
        const accuracyMultiplier = this.isEndless ? 25 : 20;
        const penaltyPerError = this.isEndless ? 15 : 10;
        const solvedBase = Math.max(this.totalSolved, this.maxPairs);
        const accuracyBonus = Math.max(0, (solvedBase * accuracyMultiplier) - (this.errors * penaltyPerError));
        const basePoints = this.basePoints;

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

window.addEventListener("load", () => Level1.init());