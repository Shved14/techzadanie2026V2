// Сервер для фронтенда на порту 5001
const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 5001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5000',
  credentials: true
}));

// Статические файлы (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// Все маршруты направляем на index.html (для SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`🚀 Фронтенд сервер запущен на порту ${PORT}`);
  console.log(`📱 Приложение доступно по адресу: http://localhost:${PORT}`);
  console.log(`🔗 API доступно по адресу: http://localhost:5000/api`);
});
