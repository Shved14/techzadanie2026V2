// Общие JavaScript функции для приложения

// API базовый URL
const API_BASE = 'http://localhost:5000/api';

// Токен авторизации
let authToken = localStorage.getItem('authToken');

// Установка токена
function setAuthToken(token) {
  authToken = token;
  localStorage.setItem('authToken', token);
  // Сбрасываем кэш валидации
  tokenValidationCache = null;
  tokenValidationTime = 0;
}

// Удаление токена
function removeAuthToken() {
  authToken = null;
  localStorage.removeItem('authToken');
  // Сбрасываем кэш валидации
  tokenValidationCache = null;
  tokenValidationTime = 0;
}

// Проверка авторизации
function isAuthenticated() {
  return !!authToken;
}

// Проверка валидности токена через API
let tokenValidationCache = null;
let tokenValidationTime = 0;
const TOKEN_CACHE_DURATION = 30000; // 30 секунд

async function validateToken() {
  try {
    if (!authToken) {
      return false;
    }

    // Проверяем кэш
    const now = Date.now();
    if (tokenValidationCache && (now - tokenValidationTime) < TOKEN_CACHE_DURATION) {
      return tokenValidationCache;
    }

    const response = await apiRequest('/auth/validate');
    tokenValidationCache = response.valid;
    tokenValidationTime = now;
    return response.valid;
  } catch (error) {
    // Если токен невалидный, удаляем его
    removeAuthToken();
    tokenValidationCache = false;
    tokenValidationTime = Date.now();
    return false;
  }
}

// Выполнение API запросов
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Добавляем токен авторизации если он есть
  if (authToken) {
    defaultOptions.headers.Authorization = `Bearer ${authToken}`;
  }

  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Произошла ошибка');
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
}

// Показать сообщение
function showMessage(message, type = 'error') {
  // Удаляем существующие сообщения
  const existingMessage = document.querySelector('.message');
  if (existingMessage) {
    existingMessage.remove();
  }

  // Создаем новое сообщение
  const messageDiv = document.createElement('div');
  messageDiv.className = `message message-${type}`;
  messageDiv.textContent = message;

  // Вставляем в начало контейнера или формы
  const container = document.querySelector('.container') || document.body;
  const firstChild = container.firstElementChild;

  if (firstChild) {
    container.insertBefore(messageDiv, firstChild);
  } else {
    container.appendChild(messageDiv);
  }

  // Автоматически скрываем через 5 секунд
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 5000);
}

// Перенаправление
function redirect(url) {
  window.location.href = url;
}

// Проверка дня рождения и показ модального окна
async function checkBirthday() {
  try {
    if (!isAuthenticated()) {
      return;
    }

    const response = await apiRequest('/user/birthday-check');

    if (response.isBirthday) {
      showBirthdayModal(response.userName);
    }
  } catch (error) {
    console.error('Ошибка проверки дня рождения:', error);
  }
}

// Показать модальное окно поздравления
function showBirthdayModal(userName) {
  // Убираем проверку на показ только один раз в день
  // Теперь поздравление появляется каждый раз при загрузке страницы в день рождения

  // Создаем модальное окно
  const modalHTML = `
    <div class="modal-overlay" id="birthdayModal">
      <div class="birthday-modal">
        <div class="birthday-icon">🎉</div>
        <h2 class="birthday-title">Поздравляем с Днем Рождения!</h2>
        <p class="birthday-message">
          Уважаемый(ая) ${userName}!<br><br>
          От всей души поздравляем Вас с Днем Рождения! 
          Желаем Вам крепкого здоровья, неиссякаемой энергии, 
          личного счастья и профессиональных успехов.<br><br>
          Пусть каждый день приносит радость и новые достижения!
        </p>
        <button class="birthday-close" onclick="closeBirthdayModal()">
          Спасибо!
        </button>
      </div>
    </div>
  `;

  // Удаляем существующее модальное окно, если есть
  const existingModal = document.getElementById('birthdayModal');
  if (existingModal) {
    existingModal.remove();
  }

  // Добавляем новое модальное окно
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Показываем модальное окно с анимацией
  setTimeout(() => {
    const modal = document.getElementById('birthdayModal');
    if (modal) {
      modal.classList.add('active');
    }
  }, 100);
}

// Закрыть модальное окно
function closeBirthdayModal() {
  const modal = document.getElementById('birthdayModal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// Форматирование даты
function formatDate(dateString) {
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('ru-RU', options);
}

// Валидация email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Валидация пароля
function isValidPassword(password) {
  return password && password.length >= 6;
}

// Показать/скрыть пароль
function togglePassword(inputId, buttonId) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);

  if (input.type === 'password') {
    input.type = 'text';
    button.textContent = '👁️';
  } else {
    input.type = 'password';
    button.textContent = '👁️';
  }
}

// Алиас для совместимости
function togglePasswordVisibility(inputId, buttonId) {
  togglePassword(inputId, buttonId);
}

// Загрузка состояния кнопки
function setButtonLoading(buttonId, loading = true) {
  const button = document.getElementById(buttonId);
  if (!button) return;

  if (loading) {
    button.disabled = true;
    button.innerHTML = '<span class="loading"></span> Загрузка...';
  } else {
    button.disabled = false;
    button.innerHTML = button.getAttribute('data-original-text') || 'Отправить';
  }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function () {
  // НЕ проверяем день рождения здесь - это будет делаться на конкретных страницах

  // Добавляем обработчики для форм
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', function (e) {
      const submitButton = form.querySelector('button[type="submit"]');
      if (submitButton) {
        submitButton.setAttribute('data-original-text', submitButton.innerHTML);
      }
    });
  });
});

// Экспорт функций для использования в других файлах
window.apiRequest = apiRequest;
window.setAuthToken = setAuthToken;
window.removeAuthToken = removeAuthToken;
window.isAuthenticated = isAuthenticated;
window.validateToken = validateToken;
window.showMessage = showMessage;
window.redirect = redirect;
window.checkBirthday = checkBirthday;
window.showBirthdayModal = showBirthdayModal;
window.closeBirthdayModal = closeBirthdayModal;
window.formatDate = formatDate;
window.isValidEmail = isValidEmail;
window.isValidPassword = isValidPassword;
window.togglePassword = togglePassword;
window.togglePasswordVisibility = togglePasswordVisibility;
window.setButtonLoading = setButtonLoading;
