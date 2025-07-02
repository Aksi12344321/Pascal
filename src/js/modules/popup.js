/* function popup(dialogSelector, openBtnSelector) {
  const dialog = document.querySelector(dialogSelector);
  const openModal = document.getElementById(openBtnSelector);
  const closeModal = dialog.querySelector(".close-modal");

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
  }

  openModal.addEventListener("click", openModalAndBlockScroll);
  closeModal.addEventListener("click", close);

  function closeOnOverlayClick(event) {
    const isClickOutside = !event.target.closest(".dialog__inner");
    if (isClickOutside && event.target === dialog) {
      close();
    }
  }

  dialog.addEventListener("click", closeOnOverlayClick);
  dialog.addEventListener("cancel", returnScroll);
}

export default popup; */

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
      attachFormHandler(); // пересоздаем обработчик формы после сброса
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
    const form = dialog.querySelector(".contacts__form");
    if (!form) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const nameInput = form.querySelector('input[placeholder="Ваше Имя"]');
      const phoneInput = form.querySelector('input[placeholder="Номер телефона"]');
      const phoneError = form.querySelector(".phone-error");
      const submitButton = form.querySelector('button[type="submit"]');

      const name = nameInput.value.trim();
      const phone = phoneInput.value.trim();

      // Регулярка для проверки телефона: + (необязательно) и 7-15 цифр
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
        phoneInput.style.borderColor = "red";
        return;
      }

      // Блокировка кнопки и показ спиннера
      submitButton.disabled = true;
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
        const formData = new FormData();
        formData.append("name", name);
        formData.append("phone", phone);

        const response = await fetch("https://formsubmit.co/ajax/aksi1234@yandex.ru", {
          method: "POST",
          body: formData,
          headers: {
            Accept: "application/json",
          },
        });

        const result = await response.json();

        if (response.ok && result.success === "true") {
          formContainer.innerHTML = `
            <div style="padding: 40px 20px; text-align: center;">
              <p style="font-size: 20px; font-weight: 600; color: #495e4c;">
                Успешно отправлено!
              </p>
            </div>
          `;

          setTimeout(() => {
            close();
          }, 2000);
        } else {
          throw new Error(result.message || "Ошибка при отправке.");
        }
      } catch (error) {
        alert("Ошибка: " + error.message);
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
      }
    });
  }

  if (withForm) {
    attachFormHandler();
  }
}

export default popup;
