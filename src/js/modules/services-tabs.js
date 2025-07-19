/* function toggleServicesTabs() {
  const tabs = document.querySelectorAll(".services__tab"); //это NodeList всех кнопок табов
  const contents = document.querySelectorAll(".services__content"); // это NodeList всех блоков с контентом, которые переключаются

  tabs.forEach((tab) => {
    //Перебираем каждый таб. На каждый вешаем обработчик события click — при клике будет выполняться всё, что дальше в теле функции
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab; //Получаем, на какой таб кликнули. tab.dataset.tab — это значение data-tab="...", прописанное в HTML

      // Удаляем активный класс со всех табов
      tabs.forEach((t) => t.classList.remove("services__tab--active"));
      // Назначаем активный класс выбранному табу
      tab.classList.add("services__tab--active"); //tab — это ссылка на кликнутый DOM-элемент

      // Скрываем все контенты
      contents.forEach((content) => {
        content.classList.remove("services__content--active");
        if (content.dataset.tab === targetTab) {
          content.classList.add("services__content--active");
        }
      });
    });
  });
}
 */

function toggleServicesTabs() {
  const allTabs = document.querySelectorAll(".services__tab");
  const contents = document.querySelectorAll(".services__content");

  allTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const targetTab = tab.dataset.tab;

      // Деактивируем все табы
      allTabs.forEach((t) => t.classList.remove("services__tab--active"));

      // Активируем все табы с тем же data-tab, что и у кликнутого
      document.querySelectorAll(`.services__tab[data-tab="${targetTab}"]`).forEach((match) => {
        match.classList.add("services__tab--active");
      });

      // Обновляем контент
      contents.forEach((content) => {
        content.classList.remove("services__content--active");
        if (content.dataset.tab === targetTab) {
          content.classList.add("services__content--active");
        }
      });
    });
  });
}

export default toggleServicesTabs;
