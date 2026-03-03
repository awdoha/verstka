// ============================================================================
// ========== ИГРА "СМЫСЛ СЛОВА" - ГЛОБАЛЬНЫЕ МОДУЛИ ==========
// ============================================================================
// Этот файл содержит все основные модули, используемые во всей игре:
// - AnimatedBackground - анимированный фон на частицах
// - GlobalDB - база данных слов для первого уровня
// - TimerManager - управление таймером
// - NotificationManager - всплывающие уведомления
// - ScreenBlocker - блокировка экрана при загрузке
// - LevelModeManager - сохранение режима сложности
// - LeaderboardManager - таблица лидеров
// - UserManager - управление пользователем
// - SoundManager - звуковые эффекты
// ============================================================================

// ============================================================================
// ========== МОДУЛЬ 1: AnimatedBackground - анимированный фон ==========
// ============================================================================
// Создает динамический фон из частиц, которые:
// - Двигаются случайным образом
// - Соединяются линиями при сближении
// - Отталкиваются от мыши
// - Имеют эффект свечения
// ============================================================================
const AnimatedBackground = {
    // ===== СВОЙСТВА =====
    canvas: null,              // Ссылка на элемент <canvas>
    ctx: null,                 // Контекст рисования (2d)
    width: 0,                  // Ширина canvas
    height: 0,                 // Высота canvas
    particles: [],             // Массив частиц
    mouse: { x: 0, y: 0 },     // Текущая позиция мыши
    animationId: null,         // ID анимации (для остановки)
    particleCount: 80,         // Количество частиц (адаптируется под экран)
    connectionDistance: 100,   // Расстояние, на котором частицы соединяются
    mouseRadius: 150,          // Радиус влияния мыши
    colors: {
        particle: 'rgba(156, 217, 249, ',  // Цвет частиц (с прозрачностью)
        line: 'rgba(156, 217, 249, ',      // Цвет линий между частицами
        glow: 'rgba(156, 217, 249, 0.1)'    // Цвет свечения вокруг мыши
    },

    // ===== МЕТОДЫ =====

    /**
     * Инициализация анимированного фона
     * Создает canvas, частицы и запускает анимацию
     * Вызывается при загрузке каждой страницы
     */
    init() {
        this.canvas = document.getElementById('demo-canvas');
        if (!this.canvas) return;  // Если canvas не найден - выходим

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');

        // Адаптивное количество частиц (зависит от размера экрана)
        // Чем больше экран, тем больше частиц (но не более 80)
        this.particleCount = Math.min(80, Math.floor((this.width * this.height) / 15000));
        this.createParticles();
        this.addListeners();
        this.animate();
    },

    /**
     * Создание массива частиц со случайными параметрами
     * Каждая частица имеет:
     * - x, y: координаты
     * - size: размер
     * - speedX, speedY: скорость движения
     * - opacity: прозрачность
     */
    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,           // Случайная X-координата
                y: Math.random() * this.height,          // Случайная Y-координата
                size: Math.random() * 2 + 1,             // Размер от 1 до 3 пикселей
                speedX: (Math.random() - 0.5) * 0.8,      // Скорость по X (-0.4 до 0.4)
                speedY: (Math.random() - 0.5) * 0.8,      // Скорость по Y
                opacity: Math.random() * 0.5 + 0.1,       // Прозрачность от 0.1 до 0.6
                originalSize: 0                           // Будет заполнено ниже
            });
        }
        
        // Запоминаем оригинальные размеры для плавного возврата после отталкивания
        this.particles.forEach(p => {
            p.originalSize = p.size;
        });
    },

    /**
     * Подписка на события окна
     * - resize: изменение размера окна
     * - mousemove: движение мыши
     * - mouseout: выход мыши за пределы окна
     */
    addListeners() {
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('mousemove', (e) => this.mouseMove(e));
        window.addEventListener('mouseout', () => {
            this.mouse.x = -100;  // Убираем мышь за пределы, чтобы не влияла
            this.mouse.y = -100;
        });
    },

    /**
     * Обработка изменения размера окна
     * Пересоздает canvas и частицы под новый размер
     */
    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        // Пересоздаем частицы под новый размер
        this.particleCount = Math.min(80, Math.floor((this.width * this.height) / 15000));
        this.createParticles();
    },

    /**
     * Сохранение позиции мыши
     */
    mouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    },

    /**
     * Обновление положения и свойств частиц
     * Вызывается каждый кадр анимации
     */
    updateParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // ===== ДВИЖЕНИЕ ЧАСТИЦЫ =====
            p.x += p.speedX;
            p.y += p.speedY;
            
            // ===== ВЗАИМОДЕЙСТВИЕ С МЫШЬЮ =====
            // Вычисляем расстояние до курсора
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Если мышь близко — частица отталкивается и увеличивается
            if (distance < this.mouseRadius) {
                // Сила отталкивания: максимальна у центра мыши, уменьшается к краям
                const force = (this.mouseRadius - distance) / this.mouseRadius;
                const angle = Math.atan2(dy, dx);
                const repelForce = force * 0.8;
                
                // Отталкивание от мыши (движение в противоположную сторону)
                p.x -= Math.cos(angle) * repelForce;
                p.y -= Math.sin(angle) * repelForce;
                
                // Увеличение размера и яркости при приближении к мыши
                p.size = p.originalSize * (1 + force * 0.5);
                p.opacity = Math.min(0.8, p.opacity + force * 0.3);
            } else {
                // Если мышь далеко - плавное возвращение к исходным параметрам
                p.size += (p.originalSize - p.size) * 0.1;
                p.opacity += (p.originalSize / 3 - p.opacity) * 0.1;
            }
            
            // ===== ОТСКОК ОТ ГРАНИЦ =====
            if (p.x < 0) {
                p.x = 0;
                p.speedX *= -0.8;  // Потеря энергии при ударе (0.8 = 80% скорости)
            }
            if (p.x > this.width) {
                p.x = this.width;
                p.speedX *= -0.8;
            }
            if (p.y < 0) {
                p.y = 0;
                p.speedY *= -0.8;
            }
            if (p.y > this.height) {
                p.y = this.height;
                p.speedY *= -0.8;
            }
            
            // ===== СЛУЧАЙНЫЕ ИЗМЕНЕНИЯ СКОРОСТИ =====
            // Для создания более естественного движения
            if (Math.random() > 0.98) {  // ~2% вероятность каждый кадр
                p.speedX += (Math.random() - 0.5) * 0.1;
                p.speedY += (Math.random() - 0.5) * 0.1;
                
                // Ограничение максимальной скорости
                const speed = Math.sqrt(p.speedX * p.speedX + p.speedY * p.speedY);
                if (speed > 1.5) {
                    p.speedX = (p.speedX / speed) * 1.5;
                    p.speedY = (p.speedY / speed) * 1.5;
                }
            }
        }
    },

    /**
     * Отрисовка частиц с эффектом свечения
     * Каждая частица имеет два слоя:
     * - внешнее свечение (большое полупрозрачное пятно)
     * - ядро (яркая точка)
     */
    drawParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            // ===== ВНЕШНЕЕ СВЕЧЕНИЕ =====
            const gradient = this.ctx.createRadialGradient(
                p.x, p.y, 0,
                p.x, p.y, p.size * 3
            );
            gradient.addColorStop(0, this.colors.particle + p.opacity + ')');
            gradient.addColorStop(1, this.colors.particle + '0)');
            
            this.ctx.beginPath();
            this.ctx.fillStyle = gradient;
            this.ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // ===== ЯДРО ЧАСТИЦЫ =====
            this.ctx.beginPath();
            this.ctx.fillStyle = this.colors.particle + Math.min(1, p.opacity + 0.3) + ')';
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    /**
     * Отрисовка соединительных линий между близкими частицами
     * Чем ближе частицы, тем ярче и толще линия
     */
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Если частицы достаточно близко — рисуем линию
                if (distance < this.connectionDistance) {
                    // Прозрачность зависит от расстояния (чем ближе, тем ярче)
                    const opacity = 1 - (distance / this.connectionDistance);
                    const lineWidth = 0.5 + opacity * 1.5;  // Толщина линии
                    
                    // Градиент от одной частицы к другой
                    const gradient = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    gradient.addColorStop(0, this.colors.line + (p1.opacity * opacity * 0.4) + ')');
                    gradient.addColorStop(1, this.colors.line + (p2.opacity * opacity * 0.4) + ')');
                    
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = lineWidth;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                    
                    // Точка в середине линии (для красоты)
                    this.ctx.beginPath();
                    this.ctx.fillStyle = this.colors.line + (opacity * 0.6) + ')';
                    this.ctx.arc((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 1, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    },

    /**
     * Отрисовка эффекта вокруг мыши
     * Создает свечение, которое перемещается за курсором
     */
    drawMouseEffect() {
        if (this.mouse.x > 0 && this.mouse.y > 0) {
            // Свечение вокруг мыши (радиальный градиент)
            const gradient = this.ctx.createRadialGradient(
                this.mouse.x, this.mouse.y, 0,
                this.mouse.x, this.mouse.y, this.mouseRadius
            );
            gradient.addColorStop(0, 'rgba(156, 217, 249, 0.15)');
            gradient.addColorStop(0.5, 'rgba(156, 217, 249, 0.05)');
            gradient.addColorStop(1, 'rgba(156, 217, 249, 0)');
            
            this.ctx.beginPath();
            this.ctx.fillStyle = gradient;
            this.ctx.arc(this.mouse.x, this.mouse.y, this.mouseRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Центральная точка (сам курсор)
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.arc(this.mouse.x, this.mouse.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    /**
     * Основной цикл анимации
     * Вызывается через requestAnimationFrame для плавной анимации (60 кадров/сек)
     */
    animate() {
        // Очищаем с прозрачностью для эффекта шлейфа
        // Каждый кадр рисуем полупрозрачный прямоугольник поверх предыдущего кадра
        // Это создает эффект "затухания" следов частиц
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.05)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.updateParticles();
        this.drawConnections();
        this.drawParticles();
        this.drawMouseEffect();
        
        // Запланировать следующий кадр
        this.animationId = requestAnimationFrame(() => this.animate());
    },

    /**
     * Остановка анимации (освобождение ресурсов)
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
};


// ============================================================================
// ========== МОДУЛЬ 2: GlobalDB - база данных для первого уровня ==========
// ============================================================================
// Содержит все слова и категории для первого уровня
// ============================================================================
const GlobalDB = {
    // ===== ОСНОВНЫЕ ПАРЫ =====
    // Каждый объект: слово + массив подходящих категорий
    // Эти пары используются для создания правильных соответствий
    pairs: [
        { word: "Король", categories: ["Королева", "Власть", "Карта"] },
        { word: "Стол", categories: ["Стул", "Мебель"] },
        { word: "День", categories: ["Ночь", "Время", "Солнце", "Природа"] },
        { word: "Игла", categories: ["Нитка", "Шитьё"] },
        { word: "Ключ", categories: ["Замок", "Мебель"] },
        { word: "Лук", categories: ["Стрелы", "Растение", "Оружие", "Спорт"] },
        { word: "Чашка", categories: ["Блюдце", "Посуда", "Еда"] },
        { word: "Перо", categories: ["Чернила", "Письмо"] },
        { word: "Молоток", categories: ["Гвоздь", "Мебель"] },
        { word: "Книга", categories: ["Знание", "Чтение", "Письмо", "Искусство"] },
        { word: "Солнце", categories: ["Луна", "Шар", "Звезда"] },
        { word: "Хлеб", categories: ["Масло", "Еда", "Здоровье", "Питание"] }
    ],
    
    // ===== ОТВЛЕКАЮЩИЕ КАТЕГОРИИ =====
    // Используются для создания лишних зон, которые не подходят ни к одному слову
    // Это усложняет игру и требует от игрока внимательности
    distractorCategories: [
        "Спорт", "Музыка", "Транспорт", "Цвет",
        "Эмоции", "Наука", "Здоровье",
        "Технология", "Природа", "Одежда", "Животные",
        "Овощи", "Ягоды", "Семена", "Корни", "Листья", "Цветы"
    ]
};


// ============================================================================
// ========== МОДУЛЬ 3: TimerManager - управление таймером ==========
// ============================================================================
// Универсальный таймер, используемый во всех уровнях
// Запускает обратный отсчет и вызывает колбэки
// ============================================================================
const TimerManager = {
    // ===== СВОЙСТВА =====
    timeLeft: 0,        // Осталось секунд
    totalTime: 0,       // Всего секунд (для отображения прогресса)
    interval: null,     // ID интервала (для возможности остановки)
    callback: null,     // Функция, вызываемая при окончании времени

    /**
     * Запуск таймера
     * @param {number} seconds - количество секунд
     * @param {function} onTick - функция, вызываемая каждую секунду
     * @param {function} onEnd - функция при окончании
     */
    start(seconds, onTick, onEnd) {
        this.stop();  // Останавливаем предыдущий таймер, если был
        
        this.timeLeft = seconds;
        this.totalTime = seconds;
        this.callback = onEnd;

        // Сразу вызываем onTick для отображения начального времени
        if (onTick) onTick(this.timeLeft, this.totalTime);

        // Запускаем интервал (каждую секунду)
        this.interval = setInterval(() => {
            this.timeLeft--;
            if (onTick) onTick(this.timeLeft, this.totalTime);

            // Если время вышло - останавливаем и вызываем колбэк
            if (this.timeLeft <= 0) {
                this.stop();
                if (this.callback) this.callback();
            }
        }, 1000);
    },

    /**
     * Остановка таймера
     */
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    },

    /**
     * Форматирование времени в формат М:SS
     * @param {number} seconds - секунды
     * @returns {string} - отформатированное время (например, "1:05")
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};


// ============================================================================
// ========== МОДУЛЬ 4: NotificationManager - всплывающие уведомления ==========
// ============================================================================
// Создает красивые уведомления, которые появляются в правом верхнем углу
// Поддерживает разные типы (info, success, error, warning)
// ============================================================================
const NotificationManager = {
    container: null,  // Контейнер для всех уведомлений

    /**
     * Создание контейнера для уведомлений
     * Вызывается автоматически при первом показе уведомления
     */
    init() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.className = 'notification-container';
        document.body.appendChild(this.container);
    },

    /**
     * Показать уведомление
     * @param {string} message - текст сообщения (поддерживает \n для переноса строк)
     * @param {string} type - тип (info, success, error, warning)
     * @param {number} duration - длительность показа в мс (Infinity - не скрывать)
     * @returns {HTMLElement} - элемент уведомления (для ручного закрытия)
     */
    show(message, type = 'info', duration = 4000) {
        this.init();
        if (!this.container) return;

        // Создаем элемент уведомления
        const note = document.createElement('div');
        note.className = `notification notification--${type}`;

        // ===== МНОГОСТРОЧНЫЙ ТЕКСТ =====
        // Разбиваем сообщение по \n и создаем отдельные текстовые узлы
        const content = document.createElement('div');
        content.className = 'notification__content';
        const lines = String(message || '').split('\n');
        lines.forEach((line, idx) => {
            if (idx > 0) content.appendChild(document.createElement('br'));
            content.appendChild(document.createTextNode(line));
        });
        note.appendChild(content);

        // ===== КНОПКА ЗАКРЫТИЯ =====
        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification__close';
        closeBtn.innerHTML = '&times;';  // Символ ×
        closeBtn.addEventListener('click', () => this.hide(note));
        note.appendChild(closeBtn);

        // Добавляем в контейнер
        this.container.appendChild(note);
        
        // Анимация появления (на следующем кадре, чтобы CSS transition сработал)
        requestAnimationFrame(() => {
            note.classList.add('notification--visible');
        });

        // Автоматическое скрытие через duration
        if (duration !== Infinity) {
            note._dismissTimer = setTimeout(() => this.hide(note), duration);
        }

        return note;
    },

    /**
     * Скрыть уведомление
     * @param {HTMLElement} note - элемент уведомления
     */
    hide(note) {
        if (!note || !note.parentNode) return;
        
        // Очищаем таймер автозакрытия
        if (note._dismissTimer) clearTimeout(note._dismissTimer);
        
        // Запускаем анимацию исчезновения
        note.classList.remove('notification--visible');
        
        // Удаляем после завершения анимации
        setTimeout(() => {
            if (note.parentNode) note.parentNode.removeChild(note);
        }, 300);
    }
};


// ============================================================================
// ========== МОДУЛЬ 5: ScreenBlocker - блокировка экрана ==========
// ============================================================================
// Затемняет экран и показывает спиннер загрузки
// Используется при переходе между уровнями и при подведении итогов
// ============================================================================
const ScreenBlocker = {
    container: null,  // Блокирующий оверлей
    textEl: null,     // Текстовый элемент для сообщения

    /**
     * Создание блокирующего экрана
     * Создает полупрозрачный оверлей с текстом и спиннером
     */
    init() {
        if (this.container) return;
        
        this.container = document.createElement('div');
        this.container.className = 'screen-blocker';

        this.textEl = document.createElement('div');
        this.textEl.className = 'screen-blocker__text';

        const spinner = document.createElement('div');
        spinner.className = 'screen-blocker__spinner';

        this.container.appendChild(spinner);
        this.container.appendChild(this.textEl);

        document.body.appendChild(this.container);
    },

    /**
     * Показать блокировку
     * @param {string} message - сообщение для пользователя
     */
    show(message = 'Подождите...') {
        this.init();
        this.textEl.textContent = message;
        this.container.classList.add('visible');
    },

    /**
     * Скрыть блокировку
     */
    hide() {
        if (!this.container) return;
        this.container.classList.remove('visible');
    }
};


// ============================================================================
// ========== МОДУЛЬ 6: LevelModeManager - сохранение режима сложности ==========
// ============================================================================
// Сохраняет выбранный режим (normal/hard/endless) для каждого уровня
// Использует sessionStorage - данные живут только до закрытия вкладки
// ============================================================================
const LevelModeManager = {
    STORAGE_PREFIX: 'level-mode-',  // Префикс для ключей в sessionStorage

    /**
     * Создание ключа для уровня
     * @param {number} levelId - ID уровня (1, 2, 3)
     * @returns {string} - ключ для storage (например, "level-mode-1")
     */
    buildKey(levelId) {
        return `${this.STORAGE_PREFIX}${levelId}`;
    },

    /**
     * Сохранение выбранного режима
     * @param {number} levelId - ID уровня
     * @param {string} mode - режим (normal, hard, endless)
     */
    save(levelId, mode) {
        if (!Number.isFinite(levelId) || !mode) return;
        sessionStorage.setItem(this.buildKey(levelId), mode);
    },

    /**
     * Получение сохраненного режима
     * @param {number} levelId - ID уровня
     * @param {string} fallback - значение по умолчанию
     * @returns {string} - режим
     */
    get(levelId, fallback = 'normal') {
        if (!Number.isFinite(levelId)) return fallback;
        return sessionStorage.getItem(this.buildKey(levelId)) || fallback;
    },

    /**
     * Очистка режима для уровня
     * @param {number} levelId - ID уровня
     */
    clear(levelId) {
        if (!Number.isFinite(levelId)) return;
        sessionStorage.removeItem(this.buildKey(levelId));
    }
};


// ============================================================================
// ========== МОДУЛЬ 7: LeaderboardManager - таблица лидеров ==========
// ============================================================================
// Управляет таблицей лидеров в localStorage
// Содержит методы для получения, обновления, импорта/экспорта данных
// ============================================================================
const LeaderboardManager = {
    STORAGE_KEY: 'gameLeaderboard',  // Ключ в localStorage

    /**
     * Получение всех игроков
     * @returns {Array} - отсортированный по очкам (убывание) массив игроков
     */
    getAllPlayers() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return [];

            const players = JSON.parse(data);
            return players.sort((a, b) => b.score - a.score);  // Сортировка по убыванию очков
        } catch (e) {
            console.error('Error loading leaderboard:', e);
            return [];
        }
    },

    /**
     * Получение топ-N игроков
     * @param {number} count - количество
     * @returns {Array} - первые count игроков
     */
    getTopPlayers(count = 10) {
        return this.getAllPlayers().slice(0, count);
    },

    /**
     * Обновление или добавление игрока
     * @param {Object} playerData - данные игрока
     * @returns {boolean} - успешно ли выполнено
     */
    updatePlayer(playerData) {
        try {
            let players = this.getAllPlayers();

            // Ищем существующего игрока с таким же именем
            const existingIndex = players.findIndex(p => p.name === playerData.name);

            if (existingIndex >= 0) {
                // Если нашли - заменяем
                players[existingIndex] = playerData;
            } else {
                // Если нет - добавляем
                players.push(playerData);
            }

            // Сортируем и сохраняем
            players.sort((a, b) => b.score - a.score);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(players));

            return true;
        } catch (e) {
            console.error('Error updating leaderboard:', e);
            return false;
        }
    },

    /**
     * Получение места игрока
     * @param {string} playerName - имя игрока
     * @returns {number|null} - место (1-based) или null, если игрок не найден
     */
    getPlayerRank(playerName) {
        const players = this.getAllPlayers();
        const index = players.findIndex(p => p.name === playerName);
        return index >= 0 ? index + 1 : null;
    },

    /**
     * Очистка всей таблицы
     */
    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    /**
     * Экспорт таблицы в JSON-строку
     * @returns {string} - JSON с отступами для читаемости
     */
    exportToJSON() {
        const players = this.getAllPlayers();
        return JSON.stringify(players, null, 2);
    },

    /**
     * Импорт таблицы из JSON-строки
     * @param {string} jsonString - JSON-строка
     * @returns {boolean} - успешно ли выполнен импорт
     */
    importFromJSON(jsonString) {
        try {
            const importedPlayers = JSON.parse(jsonString);

            if (!Array.isArray(importedPlayers)) {
                throw new Error('Неверный формат данных');
            }

            // Получаем текущих игроков
            const currentPlayers = this.getAllPlayers();
            const mergedPlayers = {};

            // Добавляем текущих игроков
            currentPlayers.forEach(player => {
                const sanitized = this.sanitizePlayer(player);
                if (sanitized) {
                    mergedPlayers[sanitized.name] = sanitized;
                }
            });

            // Добавляем импортированных игроков с объединением статистики
            importedPlayers.forEach(player => {
                const sanitized = this.sanitizePlayer(player);
                if (!sanitized) return;

                const existing = mergedPlayers[sanitized.name];
                mergedPlayers[sanitized.name] = existing
                    ? this.mergePlayerStats(existing, sanitized)  // Объединяем
                    : sanitized;
            });

            const finalPlayers = Object.values(mergedPlayers);
            finalPlayers.sort((a, b) => b.score - a.score);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(finalPlayers));

            this.syncCurrentUserStats(finalPlayers);

            return true;
        } catch (e) {
            console.error('Error importing leaderboard:', e);
            return false;
        }
    },

    /**
     * Очистка и нормализация данных игрока
     * @param {Object} player - сырые данные
     * @returns {Object|null} - очищенные данные или null
     */
    sanitizePlayer(player) {
        if (!player || typeof player !== 'object') return null;
        if (typeof player.name !== 'string' || player.name.trim().length === 0) return null;

        const sanitized = {
            ...player,
            name: player.name.trim(),
            score: this.toFiniteNumber(player.score, 0),
            unlocked: this.toFiniteNumber(player.unlocked, 1),
            completedLevels: Array.isArray(player.completedLevels) ? [...player.completedLevels] : [],
            attempts: this.isPlainObject(player.attempts) ? { ...player.attempts } : {},
            bestTimes: this.isPlainObject(player.bestTimes) ? { ...player.bestTimes } : {},
            levelScores: this.isPlainObject(player.levelScores) ? { ...player.levelScores } : {}
        };

        sanitized.completedLevels = this.mergeCompletedLevels(sanitized.completedLevels, []);
        return sanitized;
    },

    /**
     * Объединение статистики двух записей одного игрока
     * @param {Object} existingPlayer - существующие данные
     * @param {Object} newPlayer - новые данные
     * @returns {Object} - объединенные данные (лучшие значения)
     */
    mergePlayerStats(existingPlayer, newPlayer) {
        const merged = {
            ...existingPlayer,
            ...newPlayer
        };

        // Выбираем лучшие значения
        merged.score = this.pickBestNumber(existingPlayer.score, newPlayer.score, false, 0);
        merged.unlocked = this.pickBestNumber(existingPlayer.unlocked, newPlayer.unlocked, false, 1);
        merged.completedLevels = this.mergeCompletedLevels(existingPlayer.completedLevels, newPlayer.completedLevels);
        merged.attempts = this.mergeStatMap(existingPlayer.attempts, newPlayer.attempts, false);
        merged.bestTimes = this.mergeStatMap(existingPlayer.bestTimes, newPlayer.bestTimes, true);  // true = лучше меньшее время
        merged.levelScores = this.mergeStatMap(existingPlayer.levelScores, newPlayer.levelScores, false);

        return merged;
    },

    /**
     * Объединение списков пройденных уровней
     * @param {Array} existingLevels - существующий список
     * @param {Array} newLevels - новый список
     * @returns {Array} - объединенный без дубликатов
     */
    mergeCompletedLevels(existingLevels, newLevels) {
        const safeExisting = Array.isArray(existingLevels) ? existingLevels : [];
        const safeNew = Array.isArray(newLevels) ? newLevels : [];
        const combined = [...safeExisting, ...safeNew];
        return Array.from(new Set(combined));  // Удаляем дубликаты
    },

    /**
     * Объединение карт статистики (attempts, bestTimes, levelScores)
     * @param {Object} existingMap - существующая карта
     * @param {Object} incomingMap - новая карта
     * @param {boolean} preferLower - true если лучше меньшее значение (для времени)
     * @returns {Object} - объединенная карта
     */
    mergeStatMap(existingMap, incomingMap, preferLower = false) {
        const result = this.isPlainObject(existingMap) ? { ...existingMap } : {};
        if (!this.isPlainObject(incomingMap)) return result;

        Object.entries(incomingMap).forEach(([key, value]) => {
            const parsedValue = this.toFiniteNumber(value, null);
            if (parsedValue === null) return;

            const existingValue = this.toFiniteNumber(result[key], null);
            if (existingValue === null) {
                result[key] = parsedValue;
            } else if (preferLower && parsedValue < existingValue) {
                result[key] = parsedValue;  // Берем меньшее (лучшее время)
            } else if (!preferLower && parsedValue > existingValue) {
                result[key] = parsedValue;  // Берем большее (лучший счет)
            }
        });

        return result;
    },

    /**
     * Выбор лучшего числового значения
     */
    pickBestNumber(first, second, preferLower = false, fallback = 0) {
        const a = this.toFiniteNumber(first, null);
        const b = this.toFiniteNumber(second, null);

        if (a === null && b === null) return fallback;
        if (a === null) return b;
        if (b === null) return a;

        return preferLower ? Math.min(a, b) : Math.max(a, b);
    },

    /**
     * Приведение к конечному числу
     */
    toFiniteNumber(value, fallback = null) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    },

    /**
     * Проверка, является ли значение простым объектом
     */
    isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    },

    /**
     * Синхронизация текущего пользователя с обновленной таблицей
     * @param {Array} players - массив всех игроков
     */
    syncCurrentUserStats(players) {
        if (!UserManager || !UserManager.user || !UserManager.user.name) return;
        const updated = players.find(p => p.name === UserManager.user.name);
        if (!updated) return;

        UserManager.user = {
            ...UserManager.user,
            ...updated,
            completedLevels: Array.isArray(updated.completedLevels) ? updated.completedLevels : [],
            attempts: this.isPlainObject(updated.attempts) ? { ...updated.attempts } : {},
            bestTimes: this.isPlainObject(updated.bestTimes) ? { ...updated.bestTimes } : {},
            levelScores: this.isPlainObject(updated.levelScores) ? { ...updated.levelScores } : {}
        };
        UserManager.save();
    }
};


// ============================================================================
// ========== МОДУЛЬ 8: UserManager - управление пользователем ==========
// ============================================================================
// Хранит данные текущего игрока в localStorage
// Отвечает за вход, выход, добавление очков, штрафы
// ============================================================================
const UserManager = {
    user: null,  // Текущий пользователь (объект или null)

    /**
     * Инициализация при загрузке страницы
     * Загружает данные из localStorage, если они есть
     */
    init() {
        const saved = localStorage.getItem('gameUser');
        if (saved) {
            this.user = JSON.parse(saved);
            // Инициализация отсутствующих полей (для обратной совместимости)
            if (!this.user.completedLevels) this.user.completedLevels = [];
            if (!this.user.attempts) this.user.attempts = {};
            if (!this.user.bestTimes) this.user.bestTimes = {};
            if (!this.user.levelScores) this.user.levelScores = {};
        }
    },

    /**
     * Вход пользователя
     * @param {string} name - имя игрока
     */
    login(name) {
        if (!name || name.trim().length === 0) {
            NotificationManager.show("Введите имя!", 'error');
            return;
        }
        
        // Создаем нового пользователя с начальными значениями
        this.user = {
            name: name.trim(),
            score: 0,                    // Общий счет
            unlocked: 1,                  // Разблокировано уровней (начинаем с 1)
            completedLevels: [],           // Пройденные уровни
            attempts: {},                  // Количество попыток по уровням
            bestTimes: {},                 // Лучшее время по уровням
            levelScores: {}                // Лучший счет по уровням
        };
        
        this.save();
        window.location.reload();  // Перезагружаем для входа в меню
    },

    /**
     * Выход пользователя
     */
    logout() {
        localStorage.removeItem('gameUser');
        window.location.reload();
    },

    /**
     * Добавление очков за прохождение уровня
     * @param {number} levelId - номер уровня
     * @param {number} points - базовые очки
     * @param {number} timeBonus - бонус за время
     * @returns {Object} - информация о результате
     */
    addScore(levelId, points, timeBonus = 0) {
        if (!this.user) return false;

        // Инициализация, если нужно
        if (!this.user.levelScores) this.user.levelScores = {};
        if (!this.user.attempts[levelId]) this.user.attempts[levelId] = 0;
        
        // Увеличиваем счетчик попыток
        this.user.attempts[levelId]++;

        const totalPoints = Math.max(0, (points || 0) + (timeBonus || 0));
        const previousBest = Number(this.user.levelScores[levelId]) || 0;
        
        // ===== ВАЖНО: очки начисляются ТОЛЬКО за улучшение рекорда =====
        // Это предотвращает накрутку очков повторным прохождением
        if (totalPoints > previousBest) {
            const difference = totalPoints - previousBest;
            this.user.score += difference;
            this.user.levelScores[levelId] = totalPoints;
        }

        // Проверяем, первый ли раз пройден уровень
        const firstCompletion = !this.user.completedLevels.includes(levelId);
        if (firstCompletion) {
            this.user.completedLevels.push(levelId);

            // Разблокировка следующего уровня
            if (levelId === this.user.unlocked) {
                this.user.unlocked = Math.min(3, this.user.unlocked + 1);
            }
        }

        this.save();
        LeaderboardManager.updatePlayer(this.user);  // Обновляем таблицу лидеров

        return {
            firstTime: firstCompletion,
            improved: totalPoints > previousBest,
            points: totalPoints,
            delta: totalPoints > previousBest ? totalPoints - previousBest : 0,
            runScore: totalPoints,
            previousBest,
            newBest: Math.max(previousBest, totalPoints)
        };
    },

    /**
     * Штраф за ошибку
     * @param {number} penalty - количество штрафных очков
     */
    removePenalty(penalty) {
        if (!this.user) return;
        this.user.score = Math.max(0, this.user.score - penalty);  // Не уходим в минус
        this.save();
        LeaderboardManager.updatePlayer(this.user);
    },

    /**
     * Обновление лучшего времени для уровня
     * @param {number} levelId - номер уровня
     * @param {number} timeInSeconds - время в секундах
     */
    updateBestTime(levelId, timeInSeconds) {
        if (!this.user) return;
        if (!this.user.bestTimes[levelId] || timeInSeconds < this.user.bestTimes[levelId]) {
            this.user.bestTimes[levelId] = timeInSeconds;  // Сохраняем лучшее (меньшее) время
            this.save();
            LeaderboardManager.updatePlayer(this.user);
        }
    },

    /**
     * Сохранение данных пользователя в localStorage
     */
    save() {
        localStorage.setItem('gameUser', JSON.stringify(this.user));
    }
};


// ============================================================================
// ========== МОДУЛЬ 9: SoundManager - звуковые эффекты ==========
// ============================================================================
// Генерирует звуки прямо в браузере через Web Audio API
// Не требует внешних файлов
// ============================================================================
const SoundManager = {
    audioContext: null,
    enabled: true,

    /**
     * Инициализация аудиоконтекста
     */
    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;  // Если не поддерживается - отключаем звук
        }
    },

    /**
     * Воспроизведение тона
     * @param {number} frequency - частота в Гц
     * @param {number} duration - длительность в секундах
     * @param {string} type - форма волны (sine, square, sawtooth, triangle)
     */
    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        // Плавное затухание в конце (чтобы не было щелчка)
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    },

    /**
     * Звук успеха (две ноты)
     */
    success() {
        this.playTone(523.25, 0.1);  // До
        setTimeout(() => this.playTone(659.25, 0.15), 100);  // Ми
    },

    /**
     * Звук ошибки (низкий, резкий)
     */
    error() {
        this.playTone(200, 0.2, 'sawtooth');
    },

    /**
     * Звук клика (короткий высокий)
     */
    click() {
        this.playTone(800, 0.05, 'square');
    },

    /**
     * Звук предупреждения (средняя частота)
     */
    warning() {
        this.playTone(440, 0.1);  // Ля
    }
};


// ============================================================================
// ========== ИНИЦИАЛИЗАЦИЯ ВСЕХ МОДУЛЕЙ ==========
// ============================================================================
NotificationManager.init();
ScreenBlocker.init();
UserManager.init();
SoundManager.init();
LeaderboardManager.init();
// ============================================================================
