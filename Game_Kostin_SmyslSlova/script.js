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
