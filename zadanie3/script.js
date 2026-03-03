// ========== ИСХОДНЫЕ ДАННЫЕ ==========
// Массив фраз: каждая фраза — это массив из двух элементов:
// [0] — латинская фраза, [1] — перевод на русский
const originalPhrases = [
  ["Consuetudo est altera natura", "Привычка — вторая натура"],
  ["Nota bene", "Заметьте хорошо!"],
  ["Nulla calamitas sola", "Беда не приходит одна"],
  ["Per aspera ad astra", "Через тернии к звёздам"]
];

// ========== РАБОЧИЙ МАССИВ ==========
// Создаем копию исходного массива с помощью spread-оператора (...)
// Это нужно, чтобы при удалении элементов не изменять исходный массив
let phrases = [...originalPhrases];

// ========== СЧЕТЧИК НАЖАТИЙ ==========
// Будем использовать для чередования классов (class1/class2)
let clickCount = 0;

// ========== ССЫЛКА НА ЭЛЕМЕНТ СПИСКА ==========
// Находим элемент <ol id="phraseList"> на странице
const phraseList = document.getElementById('phraseList');

// ========== ФУНКЦИЯ ПЕРЕМЕШИВАНИЯ МАССИВА (алгоритм Фишера-Йетса) ==========
/**
 * Перемешивает массив случайным образом
 * @param {Array} array - исходный массив
 * @returns {Array} - перемешанный массив
 */
function shuffle(array) {
  // Проходим по массиву с конца к началу
  for (let i = array.length - 1; i > 0; i--) {
    // Выбираем случайный индекс от 0 до i
    const j = Math.floor(Math.random() * (i + 1));
    
    // Меняем местами элементы array[i] и array[j]
    // Используем деструктуризацию для обмена
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// ========== ПЕРЕМЕШИВАЕМ ФРАЗЫ ПРИ ЗАГРУЗКЕ ==========
// Чтобы фразы появлялись в случайном порядке
phrases = shuffle(phrases);

// ========== ОБРАБОТЧИК КНОПКИ "СОЗДАТЬ" ==========
document.getElementById('createBtn').addEventListener('click', () => {
  
  // ===== ПРОВЕРКА, ОСТАЛИСЬ ЛИ ФРАЗЫ =====
  if (phrases.length === 0) {
    alert("Фразы закончились");  // Если фразы кончились — предупреждение
    return;                       // И выходим из функции
  }

  // ===== УВЕЛИЧИВАЕМ СЧЕТЧИК НАЖАТИЙ =====
  clickCount++;

  // ===== ИЗВЛЕКАЕМ ПОСЛЕДНЮЮ ФРАЗУ ИЗ МАССИВА =====
  // pop() удаляет последний элемент и возвращает его
  // Используем деструктуризацию массива: [latin, russian] = ...
  const [latin, russian] = phrases.pop();
  
  // Теперь у нас есть:
  // latin = латинская фраза (например, "Consuetudo est altera natura")
  // russian = перевод (например, "Привычка — вторая натура")

  // ===== ОПРЕДЕЛЯЕМ КЛАСС ДЛЯ ЭЛЕМЕНТА =====
  // Четные клики (2, 4, 6...) — class1 (розовый)
  // Нечетные клики (1, 3, 5...) — class2 (зеленый)
  const className = clickCount % 2 === 0 ? 'class1' : 'class2';

  // ===== СОЗДАЕМ ВНЕШНИЙ ЭЛЕМЕНТ СПИСКА =====
  // Это будет <li> с латинской фразой
  const outerItem = document.createElement('li');
  outerItem.textContent = `"${latin}"`;     // Вставляем текст в кавычках
  outerItem.className = className;           // Присваиваем класс (для фона)

  // ===== СОЗДАЕМ ВНУТРЕННИЙ СПИСОК =====
  // Это будет <ol type="a"> с русским переводом
  const innerList = document.createElement('ol');
  innerList.setAttribute('type', 'a');       // Устанавливаем тип нумерации — буквы (a, b, c...)

  // ===== СОЗДАЕМ ЭЛЕМЕНТ ВНУТРЕННЕГО СПИСКА =====
  const innerItem = document.createElement('li');
  innerItem.textContent = `"${russian}"`;    // Вставляем перевод в кавычках

  // ===== СОБИРАЕМ СТРУКТУРУ =====
  // Сначала добавляем innerItem в innerList
  innerList.appendChild(innerItem);
  
  // Затем добавляем innerList в outerItem
  outerItem.appendChild(innerList);

  // ===== ДОБАВЛЯЕМ ГОТОВЫЙ ЭЛЕМЕНТ НА СТРАНИЦУ =====
  phraseList.appendChild(outerItem);
  
  // Готовая структура в DOM:
  // <li class="class1">"Consuetudo est altera natura"
  //   <ol type="a">
  //     <li>"Привычка — вторая натура"</li>
  //   </ol>
  // </li>
});

// ========== ОБРАБОТЧИК КНОПКИ "ПЕРЕКРАСИТЬ" ==========
document.getElementById('recolorBtn').addEventListener('click', () => {
  
  // ===== НАХОДИМ ВСЕ ЭЛЕМЕНТЫ <li> ВНУТРИ СПИСКА =====
  // querySelectorAll('li') находит ВСЕ li, включая вложенные
  const items = phraseList.querySelectorAll('li');
  
  // ===== ФИЛЬТРУЕМ ТОЛЬКО ВНЕШНИЕ ЭЛЕМЕНТЫ =====
  // Преобразуем NodeList в массив с помощью Array.from()
  // Оставляем только те li, у которых родитель — сам phraseList (основной список)
  const outerItems = Array.from(items).filter(li => li.parentElement === phraseList);

  // ===== ПРИМЕНЯЕМ СТИЛИ К ЧЕТНЫМ ЭЛЕМЕНТАМ =====
  // forEach передает два параметра: элемент и его индекс в массиве
  outerItems.forEach((item, index) => {
    // Индексы в массиве: 0, 1, 2, 3...
    // Нам нужны четные ПО ПОРЯДКУ НА ЭКРАНЕ (1-й, 3-й, 5-й...)
    // Поэтому проверяем (index + 1) % 2 === 0
    if ((index + 1) % 2 === 0) {
      // Устанавливаем жирный шрифт через инлайн-стили
      item.style.fontWeight = 'bold';
    }
  });
  
  // Почему не используем классы?
  // Потому что классы уже заняты для фона (class1/class2)
  // Инлайн-стили имеют наивысший приоритет и не конфликтуют с классами
});
