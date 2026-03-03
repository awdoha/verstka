// ========== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ==========
let active = null;           // Текущий перетаскиваемый элемент
let offset = { x: 0, y: 0 }; // Смещение курсора относительно элемента
let animationShown = false;  // Флаг, чтобы анимация не запускалась дважды

// ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========

/**
 * Получает текущий угол поворота элемента из CSS transform
 * @param {HTMLElement} el - элемент
 * @returns {number} угол в градусах (0-360)
 */
function getCurrentRotation(el) {
    const st = window.getComputedStyle(el, null);
    const tr = st.getPropertyValue("transform");
    
    // Если трансформации нет, возвращаем 0
    if (tr && tr !== 'none') {
        // transform: matrix(a, b, c, d, e, f)
        // Нас интересуют a и b, из них вычисляем угол
        const values = tr.split('(')[1].split(')')[0].split(',');
        const a = values[0];  // косинус угла
        const b = values[1];  // синус угла
        
        // atan2(b, a) дает угол в радианах
        let angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        
        // Нормализуем в диапазон 0-360
        if (angle < 0) angle += 360;
        return angle;
    }
    return 0;
}

/**
 * Проверяет, правильно ли повернут элемент
 * @param {HTMLElement} el - элемент
 * @returns {boolean} - true если угол правильный
 */
function isAngleCorrect(el) {
    const currentAngle = getCurrentRotation(el);
    
    // Для треугольников (зеленые и коричневый) — только 0°
    if (el.classList.contains('green1') || 
        el.classList.contains('green2') || 
        el.classList.contains('green3') || 
        el.classList.contains('brown-triangle')) {
        return currentAngle === 0;
    }
    // Для ствола — 0° или 180° (вертикально или горизонтально)
    else if (el.classList.contains('trunk')) {
        return currentAngle === 0 || currentAngle === 180;
    }
    // Для квадратов — кратно 90° (0, 90, 180, 270)
    else if (el.classList.contains('red-square') || 
             el.classList.contains('blue-square')) {
        return currentAngle === 0 || currentAngle === 90 || 
               currentAngle === 180 || currentAngle === 270;
    }
    
    return false;
}

/**
 * Проверяет, находится ли верхний элемент над нижним с перекрытием
 * @param {HTMLElement} topEl - верхний элемент
 * @param {HTMLElement} bottomEl - нижний элемент
 * @returns {boolean} - true если верхний над нижним
 */
function checkVerticalOverlap(topEl, bottomEl) {
    const rectTop = topEl.getBoundingClientRect();
    const rectBottom = bottomEl.getBoundingClientRect();
    
    // Проверяем, что нижний край верхнего элемента выше нижнего края нижнего
    const isAbove = rectTop.bottom <= rectBottom.bottom;
    // И есть перекрытие по вертикали
    const overlap = rectTop.bottom - rectBottom.top;
    
    return isAbove && overlap > 0;
}

/**
 * Проверяет, что ствол находится прямо под нижней частью дерева
 * @param {HTMLElement} trunkEl - ствол
 * @param {HTMLElement} green1El - нижняя часть дерева
 * @returns {boolean}
 */
function checkTrunkBelowGreen1(trunkEl, green1El) {
    const rectT = trunkEl.getBoundingClientRect();
    const rect1 = green1El.getBoundingClientRect();
    
    const trunkTop = rectT.top;           // верх ствола
    const green1Bottom = rect1.bottom;     // низ дерева
    
    // Ствол должен быть сразу под деревом (допуск 50px)
    return trunkTop >= green1Bottom - 50 && trunkTop <= green1Bottom;
}

// ========== ПРОВЕРКА СБОРКИ ДЕРЕВА ==========

/**
 * Проверяет, правильно ли собрано дерево
 * @returns {boolean}
 */
function isTreeComplete() {
    // Получаем все части дерева
    const g1 = document.querySelector('.green1');
    const g2 = document.querySelector('.green2');
    const g3 = document.querySelector('.green3');
    const trunk = document.querySelector('.trunk');
    
    // Если чего-то нет — сразу false
    if (!g1 || !g2 || !g3 || !trunk) return false;
    
    // Получаем координаты всех частей
    const rect1 = g1.getBoundingClientRect();
    const rect2 = g2.getBoundingClientRect();
    const rect3 = g3.getBoundingClientRect();
    const rectT = trunk.getBoundingClientRect();
    
    // ===== ПРОВЕРКА УГЛОВ =====
    const anglesOk = isAngleCorrect(g1) && isAngleCorrect(g2) && 
                     isAngleCorrect(g3) && isAngleCorrect(trunk);
    if (!anglesOk) return false;
    
    // ===== ПРОВЕРКА, ЧТО green2 НАД green1 =====
    const g2AboveG1 = checkVerticalOverlap(g2, g1);
    
    // ===== ПРОВЕРКА, ЧТО green2 ПО ЦЕНТРУ НАД green1 =====
    const g2Centered = Math.abs((rect1.left + rect1.width/2) - 
                                (rect2.left + rect2.width/2)) <= 10;
    
    // ===== ПРОВЕРКА, ЧТО green3 НАД green2 =====
    const g3AboveG2 = checkVerticalOverlap(g3, g2);
    
    // ===== ПРОВЕРКА, ЧТО green3 ПО ЦЕНТРУ НАД green1 =====
    const g3Centered = Math.abs((rect1.left + rect1.width/2) - 
                                (rect3.left + rect3.width/2)) <= 10;
    
    // ===== ПРОВЕРКА, ЧТО СТВОЛ ПОД green1 =====
    const trunkBelowG1 = checkTrunkBelowGreen1(trunk, g1);
    
    // ===== ПРОВЕРКА, ЧТО СТВОЛ ПО ЦЕНТРУ =====
    const trunkCentered = Math.abs((rect1.left + rect1.width/2) - 
                                   (rectT.left + rectT.width/2)) <= 10;
    
    // Все условия должны быть true
    return g2AboveG1 && g2Centered && g3AboveG2 && 
           g3Centered && trunkBelowG1 && trunkCentered;
}

// ========== ПРОВЕРКА СБОРКИ ДОМИКА ==========

/**
 * Проверяет, правильно ли собран домик
 * @returns {boolean}
 */
function isHouseComplete() {
    // Получаем все части домика
    const red = document.querySelector('.red-square');
    const blue = document.querySelector('.blue-square');
    const brown = document.querySelector('.brown-triangle');
    
    if (!red || !blue || !brown) return false;
    
    const rectR = red.getBoundingClientRect();
    const rectB = blue.getBoundingClientRect();
    const rectBr = brown.getBoundingClientRect();
    
    // ===== ПРОВЕРКА УГЛОВ =====
    const anglesOk = isAngleCorrect(red) && isAngleCorrect(blue) && isAngleCorrect(brown);
    if (!anglesOk) return false;
    
    // ===== ПРОВЕРКА, ЧТО ОКНО ВНУТРИ СТЕНЫ =====
    // Центры стены и окна
    const redCenterX = rectR.left + rectR.width / 2;
    const redCenterY = rectR.top + rectR.height / 2;
    const blueCenterX = rectB.left + rectB.width / 2;
    const blueCenterY = rectB.top + rectB.height / 2;
    
    // Центры должны совпадать с погрешностью 15px
    const blueCenteredX = Math.abs(blueCenterX - redCenterX) <= 15;
    const blueCenteredY = Math.abs(blueCenterY - redCenterY) <= 15;
    
    // Окно должно быть внутри стены с отступом от краев минимум 20px
    const blueInside = rectB.left > rectR.left + 20 && 
                       rectB.right < rectR.right - 20 && 
                       rectB.top > rectR.top + 20 && 
                       rectB.bottom < rectR.bottom - 20 && 
                       blueCenteredX && blueCenteredY;
    
    // ===== ПРОВЕРКА, ЧТО КРЫША НАД СТЕНОЙ =====
    const brownAboveRed = rectBr.bottom <= rectR.top + 10 && 
                          rectBr.bottom >= rectR.top - 5;
    
    // ===== ПРОВЕРКА, ЧТО КРЫША ПО ЦЕНТРУ =====
    const brownCenterX = rectBr.left + rectBr.width / 2;
    const roofCentered = Math.abs(brownCenterX - redCenterX) <= 15;
    
    return blueInside && brownAboveRed && roofCentered;
}

// ========== АНИМАЦИИ ==========

/**
 * Показывает анимацию успеха
 */
function showSuccessAnimation() {
    if (animationShown) return;  // Защита от повторного запуска
    animationShown = true;
    
    const popup = document.getElementById('success-popup');
    if (!popup) return;

    // Показываем окно
    popup.classList.remove('popup-hide');
    popup.classList.add('popup-show');
    
    // Через 2 секунды скрываем
    setTimeout(() => {
        popup.classList.remove('popup-show');
        popup.classList.add('popup-hide');

        setTimeout(() => {
            popup.classList.remove('popup-hide');
            animationShown = false;  // Сбрасываем флаг
        }, 300);
    }, 2000);
}

/**
 * Показывает анимацию ошибки
 */
function showErrorAnimation() {
    const popup = document.getElementById('error-popup');
    if (!popup) return;
    
    popup.classList.remove('popup-hide');
    popup.classList.add('popup-show');
    
    setTimeout(() => {
        popup.classList.remove('popup-show');
        popup.classList.add('popup-hide');
        
        setTimeout(() => {
            popup.classList.remove('popup-hide');
        }, 300);
    }, 2000);
}

/**
 * Ручная проверка сборки (вызывается кнопкой)
 */
function checkPuzzleManually() {
    const treeOk = isTreeComplete();
    const houseOk = isHouseComplete();
    
    if (treeOk && houseOk) {
        showSuccessAnimation();
        return true;
    } else {
        showErrorAnimation();
        return false;
    }
}

// ========== DRAG-AND-DROP (СВОЯ РЕАЛИЗАЦИЯ) ==========

/**
 * Инициализация перетаскивания для всех элементов с классом .draggable
 */
function initDragging() {
    // Для каждого перетаскиваемого элемента
    document.querySelectorAll('.draggable').forEach(el => {
        // Обработчик нажатия кнопки мыши
        el.onmousedown = function(e) {
            active = el;  // Запоминаем, какой элемент тащим
            
            // Получаем границы области для ограничения перемещения
            const area = document.querySelector('.puzzle-area');
            const rect = area.getBoundingClientRect();
            
            // Вычисляем смещение курсора относительно верхнего левого угла элемента
            offset.x = e.clientX - el.offsetLeft - rect.left;
            offset.y = e.clientY - el.offsetTop - rect.top;
            
            // Поднимаем элемент над другими
            el.style.zIndex = 100;
            el.style.border = '4px solid #000000';  // Визуальное выделение
        };
    });

    // Обработчик движения мыши (глобальный для всего документа)
    document.onmousemove = function(e) {
        if (active) {  // Если что-то тащим
            const area = document.querySelector('.puzzle-area');
            const rect = area.getBoundingClientRect();
            
            // Новая позиция с учетом смещения курсора
            let x = e.clientX - rect.left - offset.x;
            let y = e.clientY - rect.top - offset.y;
            
            // Ограничиваем, чтобы элемент не выходил за границы области
            x = Math.max(0, Math.min(rect.width - active.offsetWidth, x));
            y = Math.max(0, Math.min(rect.height - active.offsetHeight, y));
            
            // Применяем новую позицию
            active.style.left = x + 'px';
            active.style.top = y + 'px';
        }
    };

    // Обработчик отпускания мыши
    document.onmouseup = function() {
        if (active) {
            // Возвращаем обычный z-index
            active.style.zIndex = '';
            active = null;  // Ничего не тащим
        }
    };
}

// ========== ПОВОРОТ ЭЛЕМЕНТОВ ==========

/**
 * Инициализация поворота по двойному клику
 */
function initRotation() {
    document.querySelectorAll('.draggable').forEach(el => {
        el.ondblclick = function() {
            // Получаем текущий угол
            let angle = getCurrentRotation(el);
            // Добавляем 45 градусов
            angle = (angle + 45) % 360;
            // Применяем новый поворот
            el.style.transform = `rotate(${angle}deg)`;
        };
    });
}

// ========== КНОПКА ПРОВЕРКИ ==========

/**
 * Инициализация кнопки проверки
 */
function initCheckButton() {
    const checkButton = document.getElementById('puzzle-check-btn');
    if (checkButton) {
        checkButton.onclick = function() {
            checkPuzzleManually();
        };
    }
}

// ========== ЗАПУСК ПРИ ЗАГРУЗКЕ ==========
window.addEventListener('load', function() {
    initDragging();    // Включаем перетаскивание
    initRotation();    // Включаем поворот по двойному клику
    initCheckButton(); // Включаем кнопку проверки
});
