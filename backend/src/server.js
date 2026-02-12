// Основной файл сервера Express
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
const sequelize = require('./config/database');

// Импорт роутов
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 5000;

// Настройка сессий для двухэтапной регистрации (ДО CORS)
app.use(session({
  secret: process.env.SESSION_SECRET || 'session-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 60 * 1000 // 30 минут
  }
}));

// Middleware
app.use(cors({
  origin: ['http://localhost:5001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API роуты
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

// Проверка работы API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API сервер работает',
    port: process.env.PORT,
    timestamp: new Date().toISOString()
  });
});

// Обработка 404
app.use((req, res) => {
  res.status(404).json({ error: 'API эндпоинт не найден' });
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

// Функция запуска сервера
const startServer = async () => {
  try {
    // Подключаемся к базе данных
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');

    // Синхронизируем модели с базой данных
    await sequelize.sync({ force: false });
    console.log('✅ Модели синхронизированы с базой данных');

    // Запускаем сервер
    app.listen(PORT, () => {
      console.log(`🚀 Сервер запущен на порту ${PORT}`);
      console.log(`📱 Frontend доступен по адресу: http://localhost:5001`);
      console.log(`🔗 API доступно по адресу: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Ошибка запуска сервера:', error);
    process.exit(1);
  }
};

// Запускаем сервер
startServer();
