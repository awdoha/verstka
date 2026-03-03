const AnimatedBackground = {
    canvas: null,
    ctx: null,
    width: 0,
    height: 0,
    particles: [],
    mouse: { x: 0, y: 0 },
    animationId: null,
    particleCount: 80,
    connectionDistance: 100,
    mouseRadius: 150,
    colors: {
        particle: 'rgba(156, 217, 249, ',
        line: 'rgba(156, 217, 249, ',
        glow: 'rgba(156, 217, 249, 0.1)'
    },

    init() {
        this.canvas = document.getElementById('demo-canvas');
        if (!this.canvas) return;

        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d');

        this.particleCount = Math.min(80, Math.floor((this.width * this.height) / 15000));
        this.createParticles();
        this.addListeners();
        this.animate();
    },

    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 0.8,
                speedY: (Math.random() - 0.5) * 0.8,
                opacity: Math.random() * 0.5 + 0.1,
                originalSize: 0
            });
        }
        
    
        this.particles.forEach(p => {
            p.originalSize = p.size;
        });
    },

    addListeners() {
        window.addEventListener('resize', () => this.handleResize());
        window.addEventListener('mousemove', (e) => this.mouseMove(e));
        window.addEventListener('mouseout', () => {
            this.mouse.x = -100;
            this.mouse.y = -100;
        });
    },

    handleResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        
        this.particleCount = Math.min(80, Math.floor((this.width * this.height) / 15000));
        this.createParticles();
    },

    mouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    },

    updateParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            
            p.x += p.speedX;
            p.y += p.speedY;
            
            
            const dx = this.mouse.x - p.x;
            const dy = this.mouse.y - p.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.mouseRadius) {
                const force = (this.mouseRadius - distance) / this.mouseRadius;
                const angle = Math.atan2(dy, dx);
                const repelForce = force * 0.8;
                
                p.x -= Math.cos(angle) * repelForce;
                p.y -= Math.sin(angle) * repelForce;
                
                
                p.size = p.originalSize * (1 + force * 0.5);
                p.opacity = Math.min(0.8, p.opacity + force * 0.3);
            } else {
                
                p.size += (p.originalSize - p.size) * 0.1;
                p.opacity += (p.originalSize / 3 - p.opacity) * 0.1;
            }
            
            
            if (p.x < 0) {
                p.x = 0;
                p.speedX *= -0.8;
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
            
            
            if (Math.random() > 0.98) {
                p.speedX += (Math.random() - 0.5) * 0.1;
                p.speedY += (Math.random() - 0.5) * 0.1;
                
                
                const speed = Math.sqrt(p.speedX * p.speedX + p.speedY * p.speedY);
                if (speed > 1.5) {
                    p.speedX = (p.speedX / speed) * 1.5;
                    p.speedY = (p.speedY / speed) * 1.5;
                }
            }
        }
    },

    drawParticles() {
        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];
            
            
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
            
            // Рисуем ядро частицы
            this.ctx.beginPath();
            this.ctx.fillStyle = this.colors.particle + Math.min(1, p.opacity + 0.3) + ')';
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            const p1 = this.particles[i];
            
            for (let j = i + 1; j < this.particles.length; j++) {
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.connectionDistance) {
                    
                    const opacity = 1 - (distance / this.connectionDistance);
                    const lineWidth = 0.5 + opacity * 1.5;
                    
                    
                    const gradient = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
                    gradient.addColorStop(0, this.colors.line + (p1.opacity * opacity * 0.4) + ')');
                    gradient.addColorStop(1, this.colors.line + (p2.opacity * opacity * 0.4) + ')');
                    
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = gradient;
                    this.ctx.lineWidth = lineWidth;
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                    
                    
                    this.ctx.beginPath();
                    this.ctx.fillStyle = this.colors.line + (opacity * 0.6) + ')';
                    this.ctx.arc((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, 1, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
    },

    drawMouseEffect() {
        if (this.mouse.x > 0 && this.mouse.y > 0) {
            
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
            
            
            this.ctx.beginPath();
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.arc(this.mouse.x, this.mouse.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    },

    animate() {
        
        this.ctx.fillStyle = 'rgba(26, 26, 46, 0.05)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.updateParticles();
        this.drawConnections();
        this.drawParticles();
        this.drawMouseEffect();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    },

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
};

const GlobalDB = {
    pairs: [
        { word: "Король", categories: ["Королева", "Власть", "Карта"] },
        { word: "Стол", categories: ["Стул", "Мебель"] },
        { word: "День", categories: ["Ночь", "Время", "Солнце", "Природа"] },
        { word: "Игла", categories: ["Нитка", "Шитьё"] },
        { word: "Ключ", categories: ["Замок", "Мебель"] },
        { word: "Лук", categories: ["Стрелы", "Растение", "Оружие", "Спорт"] },
        { word: "Чашка", categories: ["Блюдце", "Посуда", "Еда"] },
        { word: "Перо", categories: ["Чернила", "Письмо"] },
        { word: "Молоток", categories: ["Гвоздь",  "Мебель"] },
        { word: "Книга", categories: ["Знание", "Чтение", "Письмо", "Искусство"] },
        { word: "Солнце", categories: ["Луна", "Шар", "Звезда"] },
        { word: "Хлеб", categories: ["Масло", "Еда", "Здоровье", "Питание"] }
    ],
    
    distractorCategories: [
        "Спорт", "Музыка", "Транспорт", "Цвет",
        "Эмоции", "Наука", "Здоровье",
        "Технология", "Природа", "Одежда", "Животные",
         "Овощи","Ягоды", "Семена", "Корни", "Листья", "Цветы"
    ]
};

const TimerManager = {
    timeLeft: 0,
    totalTime: 0,
    interval: null,
    callback: null,

    start(seconds, onTick, onEnd) {
        this.stop();
        this.timeLeft = seconds;
        this.totalTime = seconds;
        this.callback = onEnd;

        if (onTick) onTick(this.timeLeft, this.totalTime);

        this.interval = setInterval(() => {
            this.timeLeft--;
            if (onTick) onTick(this.timeLeft, this.totalTime);

            if (this.timeLeft <= 0) {
                this.stop();
                if (this.callback) this.callback();
            }
        }, 1000);
    },

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
};

const NotificationManager = {
    container: null,

    init() {
        if (this.container) return;
        const mount = () => {
            if (this.container || !document.body) return;
            this.container = document.createElement('div');
            this.container.className = 'notification-container';
            document.body.appendChild(this.container);
        };
        if (document.body) {
            mount();
        } else {
            document.addEventListener('DOMContentLoaded', mount, { once: true });
        }
    },

    show(message, type = 'info', duration = 4000) {
        this.init();
        if (!this.container) return;

        const note = document.createElement('div');
        note.className = `notification notification--${type}`;

        const content = document.createElement('div');
        content.className = 'notification__content';
        const lines = String(message || '').split('\n');
        lines.forEach((line, idx) => {
            if (idx > 0) content.appendChild(document.createElement('br'));
            content.appendChild(document.createTextNode(line));
        });
        note.appendChild(content);

        const closeBtn = document.createElement('button');
        closeBtn.className = 'notification__close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => this.hide(note));
        note.appendChild(closeBtn);

        this.container.appendChild(note);
        requestAnimationFrame(() => {
            note.classList.add('notification--visible');
        });

        if (duration !== Infinity) {
            note._dismissTimer = setTimeout(() => this.hide(note), duration);
        }

        return note;
    },

    hide(note) {
        if (!note || !note.parentNode) return;
        if (note._dismissTimer) clearTimeout(note._dismissTimer);
        note.classList.remove('notification--visible');
        setTimeout(() => {
            if (note.parentNode) note.parentNode.removeChild(note);
        }, 300);
    }
};

const ScreenBlocker = {
    container: null,
    textEl: null,

    init() {
        if (this.container) return;
        const mount = () => {
            if (this.container || !document.body) return;
            this.container = document.createElement('div');
            this.container.className = 'screen-blocker';

            this.textEl = document.createElement('div');
            this.textEl.className = 'screen-blocker__text';

            const spinner = document.createElement('div');
            spinner.className = 'screen-blocker__spinner';

            this.container.appendChild(spinner);
            this.container.appendChild(this.textEl);

            document.body.appendChild(this.container);
        };

        if (document.body) {
            mount();
        } else {
            document.addEventListener('DOMContentLoaded', mount, { once: true });
        }
    },

    show(message = 'Подождите...') {
        this.init();
        if (!this.container) return;
        this.textEl.textContent = message;
        this.container.classList.add('visible');
    },

    hide() {
        if (!this.container) return;
        this.container.classList.remove('visible');
    }
};

const LevelModeManager = {
    STORAGE_PREFIX: 'level-mode-',

    buildKey(levelId) {
        return `${this.STORAGE_PREFIX}${levelId}`;
    },

    save(levelId, mode) {
        if (!Number.isFinite(levelId) || !mode) return;
        try {
            sessionStorage.setItem(this.buildKey(levelId), mode);
        } catch (e) {
            console.warn('LevelModeManager: unable to save mode', e);
        }
    },

    get(levelId, fallback = 'normal') {
        if (!Number.isFinite(levelId)) return fallback;
        try {
            return sessionStorage.getItem(this.buildKey(levelId)) || fallback;
        } catch (e) {
            console.warn('LevelModeManager: unable to read mode', e);
            return fallback;
        }
    },

    clear(levelId) {
        if (!Number.isFinite(levelId)) return;
        try {
            sessionStorage.removeItem(this.buildKey(levelId));
        } catch (e) {
            console.warn('LevelModeManager: unable to clear mode', e);
        }
    }
};

const LeaderboardManager = {
    STORAGE_KEY: 'gameLeaderboard',

    init() {
    },

    getAllPlayers() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) return [];

            const players = JSON.parse(data);
            
            return players.sort((a, b) => b.score - a.score);
        } catch (e) {
            console.error('Error loading leaderboard:', e);
            return [];
        }
    },

    getTopPlayers(count = 10) {
        return this.getAllPlayers().slice(0, count);
    },

    updatePlayer(playerData) {
        try {
            let players = this.getAllPlayers();

            const existingIndex = players.findIndex(p => p.name === playerData.name);

            if (existingIndex >= 0) {
                players[existingIndex] = playerData;
            } else {
                players.push(playerData);
            }

            players.sort((a, b) => b.score - a.score);
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(players));

            return true;
        } catch (e) {
            console.error('Error updating leaderboard:', e);
            return false;
        }
    },

    getPlayerRank(playerName) {
        const players = this.getAllPlayers();
        const index = players.findIndex(p => p.name === playerName);
        return index >= 0 ? index + 1 : null;
    },

    clearAll() {
        localStorage.removeItem(this.STORAGE_KEY);
    },

    exportToJSON() {
        const players = this.getAllPlayers();
        return JSON.stringify(players, null, 2);
    },

    importFromJSON(jsonString) {
        try {
            const importedPlayers = JSON.parse(jsonString);

            if (!Array.isArray(importedPlayers)) {
                throw new Error('Неверный формат данных');
            }

            const currentPlayers = this.getAllPlayers();
            const mergedPlayers = {};

            currentPlayers.forEach(player => {
                const sanitized = this.sanitizePlayer(player);
                if (sanitized) {
                    mergedPlayers[sanitized.name] = sanitized;
                }
            });

            importedPlayers.forEach(player => {
                const sanitized = this.sanitizePlayer(player);
                if (!sanitized) return;

                const existing = mergedPlayers[sanitized.name];
                mergedPlayers[sanitized.name] = existing
                    ? this.mergePlayerStats(existing, sanitized)
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

    mergePlayerStats(existingPlayer, newPlayer) {
        const merged = {
            ...existingPlayer,
            ...newPlayer
        };

        merged.score = this.pickBestNumber(existingPlayer.score, newPlayer.score, false, 0);
        merged.unlocked = this.pickBestNumber(existingPlayer.unlocked, newPlayer.unlocked, false, 1);
        merged.completedLevels = this.mergeCompletedLevels(existingPlayer.completedLevels, newPlayer.completedLevels);
        merged.attempts = this.mergeStatMap(existingPlayer.attempts, newPlayer.attempts, false);
        merged.bestTimes = this.mergeStatMap(existingPlayer.bestTimes, newPlayer.bestTimes, true);
        merged.levelScores = this.mergeStatMap(existingPlayer.levelScores, newPlayer.levelScores, false);

        return merged;
    },

    mergeCompletedLevels(existingLevels, newLevels) {
        const safeExisting = Array.isArray(existingLevels) ? existingLevels : [];
        const safeNew = Array.isArray(newLevels) ? newLevels : [];
        const combined = [...safeExisting, ...safeNew];
        return Array.from(new Set(combined));
    },

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
                result[key] = parsedValue;
            } else if (!preferLower && parsedValue > existingValue) {
                result[key] = parsedValue;
            }
        });

        return result;
    },

    pickBestNumber(first, second, preferLower = false, fallback = 0) {
        const a = this.toFiniteNumber(first, null);
        const b = this.toFiniteNumber(second, null);

        if (a === null && b === null) return fallback;
        if (a === null) return b;
        if (b === null) return a;

        return preferLower ? Math.min(a, b) : Math.max(a, b);
    },

    toFiniteNumber(value, fallback = null) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    },

    isPlainObject(value) {
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    },

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

const UserManager = {
    user: null,

    init() {
        const saved = localStorage.getItem('gameUser');
        if (saved) {
            this.user = JSON.parse(saved);
            if (!this.user.completedLevels) this.user.completedLevels = [];
            if (!this.user.attempts) this.user.attempts = {};
            if (!this.user.bestTimes) this.user.bestTimes = {};
            if (!this.user.levelScores) this.user.levelScores = {};
        }
    },

    login(name) {
        if (!name || name.trim().length === 0) {
            NotificationManager.show("Введите имя!", 'error');
            return;
        }
        this.user = {
            name: name.trim(),
            score: 0,
            unlocked: 1,
            completedLevels: [],
            attempts: {},
            bestTimes: {},
            levelScores: {}
        };
        this.save();
        window.location.reload();
    },

    logout() {
        localStorage.removeItem('gameUser');
        window.location.reload();
    },


        addScore(levelId, points, timeBonus = 0) {
        if (!this.user) return false;

        if (!this.user.levelScores) this.user.levelScores = {};
        if (!this.user.attempts[levelId]) this.user.attempts[levelId] = 0;
        this.user.attempts[levelId]++;

        const totalPoints = Math.max(0, (points || 0) + (timeBonus || 0));
        const previousBest = Number(this.user.levelScores[levelId]) || 0;
        
        
        if (totalPoints > previousBest) {
            
            const difference = totalPoints - previousBest;
            this.user.score += difference;
            this.user.levelScores[levelId] = totalPoints;
            
            console.log(`Улучшение! +${difference} очков (было ${previousBest}, стало ${totalPoints})`);
        } else {
            console.log(`Результат ${totalPoints} не лучше рекорда ${previousBest}, очки не начислены`);
        }

        const firstCompletion = !this.user.completedLevels.includes(levelId);
        if (firstCompletion) {
            this.user.completedLevels.push(levelId);

            if (levelId === this.user.unlocked) {
                this.user.unlocked = Math.min(3, this.user.unlocked + 1);
            }
        }

        this.save();
        LeaderboardManager.updatePlayer(this.user);

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

    removePenalty(penalty) {
        if (!this.user) return;
        this.user.score = Math.max(0, this.user.score - penalty);
        this.save();
        LeaderboardManager.updatePlayer(this.user);
    },

    updateBestTime(levelId, timeInSeconds) {
        if (!this.user) return;
        if (!this.user.bestTimes[levelId] || timeInSeconds < this.user.bestTimes[levelId]) {
            this.user.bestTimes[levelId] = timeInSeconds;
            this.save();
            LeaderboardManager.updatePlayer(this.user);
        }
    },

    save() {
        localStorage.setItem('gameUser', JSON.stringify(this.user));
    }
};

const SoundManager = {
    audioContext: null,
    enabled: true,

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
    },

    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    },

    success() {
        this.playTone(523.25, 0.1);
        setTimeout(() => this.playTone(659.25, 0.15), 100);
    },

    error() {
        this.playTone(200, 0.2, 'sawtooth');
    },

    click() {
        this.playTone(800, 0.05, 'square');
    },

    warning() {
        this.playTone(440, 0.1);
    }
};


NotificationManager.init();
ScreenBlocker.init();
UserManager.init();
SoundManager.init();
LeaderboardManager.init();