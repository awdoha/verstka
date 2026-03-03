
const originalPhrases = [
  ["Consuetudo est altera natura", "Привычка — вторая натура"],
  ["Nota bene", "Заметьте хорошо!"],
  ["Nulla calamitas sola", "Беда не приходит одна"],
  ["Per aspera ad astra", "Через тернии к звёздам"]
];

let phrases = [...originalPhrases]; 
let clickCount = 0; 
const phraseList = document.getElementById('phraseList');


function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


phrases = shuffle(phrases);

document.getElementById('createBtn').addEventListener('click', () => {
  if (phrases.length === 0) {
    alert("Фразы закончились");
    return;
  }

  clickCount++;
  const [latin, russian] = phrases.pop(); 

  
  const className = clickCount % 2 === 0 ? 'class1' : 'class2';


  const outerItem = document.createElement('li');
  outerItem.textContent = `"${latin}"`;
  outerItem.className = className;

 
  const innerList = document.createElement('ol');
  innerList.setAttribute('type', 'a');

  const innerItem = document.createElement('li');
  innerItem.textContent = `"${russian}"`;

  innerList.appendChild(innerItem);
  outerItem.appendChild(innerList);

  phraseList.appendChild(outerItem);
});


document.getElementById('recolorBtn').addEventListener('click', () => {
  const items = phraseList.querySelectorAll('li'); 
  const outerItems = Array.from(items).filter(li => li.parentElement === phraseList);

  outerItems.forEach((item, index) => {
    
    if ((index + 1) % 2 === 0) {
      item.style.fontWeight = 'bold';
    }
  });
});