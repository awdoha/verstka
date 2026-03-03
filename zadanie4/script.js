let active = null;
let offset = { x: 0, y: 0 };
let animationShown = false;

function getCurrentRotation(el) {
    const st = window.getComputedStyle(el, null);
    const tr = st.getPropertyValue("transform");
    if (tr && tr !== 'none') {
        const values = tr.split('(')[1].split(')')[0].split(',');
        const a = values[0];
        const b = values[1];
        let angle = Math.round(Math.atan2(b, a) * (180 / Math.PI));
        if (angle < 0) 
            angle += 360;
        return angle;
    }
    return 0;
}

function isAngleCorrect(el) {
    const currentAngle = getCurrentRotation(el);
    
    if (el.classList.contains('green1') || el.classList.contains('green2') || 
        el.classList.contains('green3') || el.classList.contains('brown-triangle')) {
        return currentAngle === 0;
    }
    else if (el.classList.contains('trunk')) {
        return currentAngle === 0 || currentAngle === 180;
    }
    else if (el.classList.contains('red-square') || el.classList.contains('blue-square')) {
        return currentAngle === 0 || currentAngle === 90 || currentAngle === 180 || currentAngle === 270;
    }
    
    return false;
}

function checkVerticalOverlap(topEl, bottomEl) {
    const rectTop = topEl.getBoundingClientRect();
    const rectBottom = bottomEl.getBoundingClientRect();
    
    const overlap = rectTop.bottom - rectBottom.top;
    const isAbove = rectTop.bottom <= rectBottom.bottom;
    
    return isAbove && overlap > 0;
}

function checkTrunkBelowGreen1(trunkEl, green1El) {
    const rectT = trunkEl.getBoundingClientRect();
    const rect1 = green1El.getBoundingClientRect();
    
    const trunkTop = rectT.top;
    const green1Bottom = rect1.bottom;
    
    return trunkTop >= green1Bottom - 50 && trunkTop <= green1Bottom;
}

function isTreeComplete() {
    const g1 = document.querySelector('.green1');
    const g2 = document.querySelector('.green2');
    const g3 = document.querySelector('.green3');
    const trunk = document.querySelector('.trunk');
    
    if (!g1 || !g2 || !g3 || !trunk) 
        return false;
    
    const rect1 = g1.getBoundingClientRect();
    const rect2 = g2.getBoundingClientRect();
    const rect3 = g3.getBoundingClientRect();
    const rectT = trunk.getBoundingClientRect();
    
    const anglesOk = isAngleCorrect(g1) && isAngleCorrect(g2) && isAngleCorrect(g3) && isAngleCorrect(trunk);
    
    if (!anglesOk) 
        return false;
    
    const g2AboveG1 = checkVerticalOverlap(g2, g1);
    const g2Centered = Math.abs((rect1.left + rect1.width/2) - (rect2.left + rect2.width/2)) <= 10;
    const g3AboveG2 = checkVerticalOverlap(g3, g2);
    const g3Centered = Math.abs((rect1.left + rect1.width/2) - (rect3.left + rect3.width/2)) <= 10;
    
    const trunkBelowG1 = checkTrunkBelowGreen1(trunk, g1);
    const trunkCentered = Math.abs((rect1.left + rect1.width/2) - (rectT.left + rectT.width/2)) <= 10;
    
    return g2AboveG1 && g2Centered && g3AboveG2 && g3Centered && trunkBelowG1 && trunkCentered;
}

function isHouseComplete() {
    const red = document.querySelector('.red-square');
    const blue = document.querySelector('.blue-square');
    const brown = document.querySelector('.brown-triangle');
    
    if (!red || !blue || !brown) 
        return false;
    
    const rectR = red.getBoundingClientRect();
    const rectB = blue.getBoundingClientRect();
    const rectBr = brown.getBoundingClientRect();
    
    const anglesOk = isAngleCorrect(red) && isAngleCorrect(blue) && isAngleCorrect(brown);
    if (!anglesOk) 
        return false;
    
    const redCenterX = rectR.left + rectR.width / 2;
    const redCenterY = rectR.top + rectR.height / 2;
    const blueCenterX = rectB.left + rectB.width / 2;
    const blueCenterY = rectB.top + rectB.height / 2;
    
    const blueCenteredX = Math.abs(blueCenterX - redCenterX) <= 15;
    const blueCenteredY = Math.abs(blueCenterY - redCenterY) <= 15;
    
    const blueInside = rectB.left > rectR.left + 20 && rectB.right < rectR.right - 20 && 
                       rectB.top > rectR.top + 20 && rectB.bottom < rectR.bottom - 20 && 
                       blueCenteredX && blueCenteredY;
    
    const brownAboveRed = rectBr.bottom <= rectR.top + 10 && rectBr.bottom >= rectR.top - 5;
    
    const brownCenterX = rectBr.left + rectBr.width / 2;
    const roofCentered = Math.abs(brownCenterX - redCenterX) <= 15;
    
    return blueInside && brownAboveRed && roofCentered;
}

function showSuccessAnimation() {
    if (animationShown) 
        return;
    
    animationShown = true;
    
    const popup = document.getElementById('success-popup');
    if (!popup) 
        return;

    popup.classList.remove('popup-hide');
    popup.classList.add('popup-show');
    
    setTimeout(() => {
        popup.classList.remove('popup-show');
        popup.classList.add('popup-hide');

        setTimeout(() => {
            popup.classList.remove('popup-hide');
            animationShown = false;
        }, 300);
    }, 2000);
}

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

function checkPuzzleManually() {
    const treeOk = isTreeComplete();
    const houseOk = isHouseComplete();
    
    if (treeOk && houseOk) {
        showSuccessAnimation();
        return true;
    } 
    else {
        showErrorAnimation();
        return false;
    }
}

function initDragging() {
    document.querySelectorAll('.draggable').forEach(el => {
        el.onmousedown = function(e) {
            active = el;
            const area = document.querySelector('.puzzle-area');
            const rect = area.getBoundingClientRect();
            offset.x = e.clientX - el.offsetLeft - rect.left;
            offset.y = e.clientY - el.offsetTop - rect.top;
            el.style.zIndex = 100;
            el.style.border = '4px solid #000000';
        };
    });

    document.onmousemove = function(e) {
        if (active) {
            const area = document.querySelector('.puzzle-area');
            const rect = area.getBoundingClientRect();
            let x = e.clientX - rect.left - offset.x;
            let y = e.clientY - rect.top - offset.y;
            x = Math.max(0, Math.min(rect.width - active.offsetWidth, x));
            y = Math.max(0, Math.min(rect.height - active.offsetHeight, y));
            active.style.left = x + 'px';
            active.style.top = y + 'px';
        }
    };

    document.onmouseup = function() {
        if (active) {
            active.style.zIndex = '';
            active = null;
        }
    };
}

function initRotation() {
    document.querySelectorAll('.draggable').forEach(el => {
        el.ondblclick = function() {
            let angle = getCurrentRotation(el);
            angle = (angle + 45) % 360;
            el.style.transform = `rotate(${angle}deg)`;
        };
    });
}

function initCheckButton() {
    const checkButton = document.getElementById('puzzle-check-btn');
    if (checkButton) {
        checkButton.onclick = function() {
            checkPuzzleManually();
        };
    }
}

window.addEventListener('load', function() {
    initDragging();
    initRotation();
    initCheckButton();
});