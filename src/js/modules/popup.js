//======================= Функция для проверки валидности полей и управления классом active кнопки
function checkFormValidity(form, submitButton, phoneError) {
  const nameInput = form.querySelector('input[placeholder="Ваше Имя"]');
  const phoneInput = form.querySelector('input[placeholder="Номер телефона"]');
  const phoneRegex = /^\+?\d{7,15}$/; //Определяется регулярное выражение phoneRegex, которое проверяет формат номера телефона:
  // ^ — начало строки.
  // \+? — необязательный знак "+" в начале (например, +7 или 8).
  //\d{7,15} — от 7 до 15 цифр.
  //$ — конец строки.

  //================= Функция validateFields, которая будет выполнять проверку полей и обновлять интерфейс.
  function validateFields() {
    const name = nameInput.value.trim(); //Получаем текущие значения полей ввода: value — текст, введенный пользователем.trim() — убирает пробелы в начале и конце строки (например, " Иван " станет "Иван")
    const phone = phoneInput.value.trim();
    const isPhoneValid = phoneRegex.test(phone); //Метод test возвращает true, если строка соответствует регулярному выражению, и false в противном случае
    const isValid = name && isPhoneValid; //Определяет, является ли форма полностью валидной (оба поля заполнены и телефон соответствует формату)

    // Управление классом active для кнопки
    if (isValid) {
      submitButton.classList.add("btn--active");
    } else {
      submitButton.classList.remove("btn--active");
    }

    // Показ/скрытие ошибки для телефона
    if (phone && !isPhoneValid) {
      phoneError.style.display = "block";
    } else {
      phoneError.style.display = "none";
    }
  }

  // Добавляем обработчики событий input для проверки в реальном времени. Это обеспечивает проверку формы в реальном времени, по мере ввода данных пользователем
  nameInput.addEventListener("input", validateFields);
  phoneInput.addEventListener("input", validateFields);

  // Проверяем начальное состояние формы
  validateFields(); //Вызываем validateFields сразу после настройки обработчиков, чтобы проверить текущее состояние формы (например, если поля были заполнены до загрузки скрипта). Гарантирует, что кнопка и ошибка имеют правильное состояние при первой загрузке страницы
}

//==================== Функция для обработки отправки формы. Эта функция обрабатывает отправку формы, включая валидацию, отправку данных на сервер и обработку ответа.
// formContainer: Контейнер формы (например, <div>), который будет заменен при успешной отправке.
// originalFormHTML: Исходная разметка формы, чтобы восстановить её после успешной отправке
// successCallback: Необязательная функция, которая вызывается после успешной отправки (например, для закрытия попапа).
function handleFormSubmission(form, formContainer, originalFormHTML, successCallback = null) {
  // Находим элементы формы
  const nameInput = form.querySelector('input[placeholder="Ваше Имя"]');
  const phoneInput = form.querySelector('input[placeholder="Номер телефона"]');
  const phoneError = form.querySelector(".phone-error");
  const submitButton = form.querySelector('button[type="submit"]');

  // Подключаем проверку валидности для управления классом active и ошибки телефона
  //Вызываем checkFormValidity для настройки реального времени проверки полей.
  checkFormValidity(form, submitButton, phoneError);

  form.addEventListener("submit", async (event) => {
    event.preventDefault(); // Отменяем стандартное поведение

    const name = nameInput.value.trim();
    const phone = phoneInput.value.trim();

    // Регулярка для проверки телефона
    const phoneRegex = /^\+?\d{7,15}$/;

    // Сброс ошибок
    phoneError.style.display = "none";
    phoneInput.style.borderColor = "";

    // Проверка полей
    if (!name || !phone) {
      alert("Пожалуйста, заполните все поля.");
      return;
    }

    if (!phoneRegex.test(phone)) {
      phoneError.style.display = "block";
      phoneError.textContent = "Номер некорректный";
      phoneInput.style.borderColor = "red";
      return;
    }

    // Блокировка кнопки и показ спиннера
    submitButton.disabled = true;
    submitButton.classList.remove("active"); // Удаляем класс active при отправке
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = `<span class="spinner" style="
      display:inline-block;
      width:18px;
      height:18px;
      border:2px solid #fff;
      border-top:2px solid #78c081;
      border-radius:50%;
      animation: spin 0.8s linear infinite;
    "></span>`;

    try {
      const formData = new FormData(); //Создаем объект formData для отправки данных.
      formData.append("name", name); //Добавляем поля name и phone.
      formData.append("phone", phone);

      const response = await fetch("https://formsubmit.co/ajax/aksi1234@yandex.ru", {
        //Отправляем данные на сервер с помощью fetch (асинхронный запрос):
        method: "POST", //method: "POST" — метод отправки.
        body: formData, //body: formData — данные формы.
        headers: {
          Accept: "application/json", //headers: { Accept: "application/json" } — ожидаем ответ в формате JSON
        },
      });

      const result = await response.json(); //response.json() преобразует ответ сервера в объект JavaScript

      if (response.ok && result.success === "true") {
        // Успешная отправка
        //Заменяем содержимое formContainer на сообщение "Успешно отправлено!".
        formContainer.innerHTML = `
          <div style="padding: 40px 20px; text-align: center;">
            <p style="font-size: 20px; font-weight: 600; color: #495e4c;">
              Успешно отправлено!
            </p>
          </div>
        `;

        // Восстанавливаем форму через 2 секунды
        setTimeout(() => {
          formContainer.innerHTML = originalFormHTML;
          if (successCallback) {
            successCallback(); // Вызываем callback для попапа (например, закрытие)
          }
          // Переподключаем обработчик для восстановленной формы
          const newForm = formContainer.querySelector(".form");
          if (newForm) {
            handleFormSubmission(newForm, formContainer, originalFormHTML, successCallback);
          }
        }, 2000);
      } else {
        throw new Error(result.message || "Ошибка при отправке.");
      }
    } catch (error) {
      alert("Ошибка: " + error.message);
      submitButton.disabled = false;
      submitButton.innerHTML = originalText;
      // Проверяем валидность после ошибки, чтобы восстановить класс active и состояние ошибки
      checkFormValidity(form, submitButton, phoneError);
    }
  });
}

// ====================Функция для управления попапом
//Эта функция управляет поведением попапа, включая открытие, закрытие и обработку формы внутри него.
function popup(dialogSelector, openBtnId, withForm = false) {
  const dialog = document.querySelector(dialogSelector);
  const openModal = document.getElementById(openBtnId);
  const closeModal = dialog.querySelector(".close-modal");

  let formContainer = null;
  let originalFormHTML = null;

  if (withForm) {
    formContainer = dialog.querySelector(".contacts__content-2");
    originalFormHTML = formContainer ? formContainer.innerHTML : null;
  }

  function openModalAndBlockScroll() {
    dialog.showModal();
    document.body.classList.add("scroll-block");
  }

  function returnScroll() {
    document.body.classList.remove("scroll-block");
  }

  function close() {
    dialog.close();
    returnScroll();

    if (withForm && formContainer && originalFormHTML !== null) {
      formContainer.innerHTML = originalFormHTML;
      attachFormHandler();
    }
  }

  openModal.addEventListener("click", openModalAndBlockScroll);
  closeModal.addEventListener("click", close);

  dialog.addEventListener("click", (event) => {
    if (!event.target.closest(".dialog__inner") && event.target === dialog) {
      close();
    }
  });

  dialog.addEventListener("cancel", returnScroll);

  function attachFormHandler() {
    const form = dialog.querySelector(".form");
    if (!form) return;

    // Передаем callback для закрытия попапа после успешной отправки
    handleFormSubmission(form, formContainer, originalFormHTML, close);
  }

  if (withForm) {
    attachFormHandler();
  }
}

// Инициализация формы в секции feedback
document.addEventListener("DOMContentLoaded", () => {
  const feedbackFormContainer = document.querySelector(".feedback__form.form");
  if (feedbackFormContainer) {
    const originalFormHTML = feedbackFormContainer.innerHTML;
    handleFormSubmission(feedbackFormContainer, feedbackFormContainer, originalFormHTML);
  }
});

export default popup;
