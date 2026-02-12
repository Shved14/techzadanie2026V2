// Роуты для аутентификации пользователей
const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Временное хранилище для первого этапа регистрации (в памяти)
const tempRegistrations = new Map();

// Первый этап регистрации - email и пароль
router.post('/register-step1', [
  body('email').isEmail().normalizeEmail().withMessage('Введите корректный email'),
  body('password').isLength({ min: 6 }).withMessage('Пароль должен содержать минимум 6 символов')
], async (req, res) => {
  try {
    console.log('Register step 1 - Request body:', req.body);

    // Проверяем ошибки валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    console.log('Checking if user exists:', email);
    // Проверяем, существует ли пользователь
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
    }

    // Создаем временный токен для первого этапа
    const tempToken = jwt.sign(
      { email, password, step: 1 },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' } // Токен действителен 15 минут
    );

    // Сохраняем данные во временном хранилище
    tempRegistrations.set(tempToken, { email, password });

    console.log('Temp token created and data saved');
    res.json({
      success: true,
      message: 'Первый этап регистрации пройден',
      tempToken
    });
  } catch (error) {
    console.error('Ошибка первого этапа регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Второй этап регистрации - ФИО и дата рождения
router.post('/register-step2', [
  body('fullName').notEmpty().withMessage('Введите полное имя'),
  body('birthDate').isISO8601().withMessage('Введите корректную дату рождения'),
  body('tempToken').notEmpty().withMessage('Отсутствует временный токен')
], async (req, res) => {
  try {
    console.log('Register step 2 - Request body:', req.body);

    // Проверяем ошибки валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, birthDate, tempToken } = req.body;

    // Проверяем временный токен
    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      console.log('Invalid temp token:', error.message);
      return res.status(400).json({ error: 'Срок действия токена истек или неверный токен' });
    }

    // Проверяем, что это токен первого этапа
    if (decoded.step !== 1) {
      return res.status(400).json({ error: 'Неверный токен' });
    }

    // Получаем данные из временного хранилища
    const tempData = tempRegistrations.get(tempToken);
    if (!tempData) {
      return res.status(400).json({ error: 'Сначала пройдите первый этап регистрации' });
    }

    console.log('Creating user with data:', {
      email: tempData.email,
      fullName,
      birthDate
    });

    // Создаем пользователя
    const user = await User.create({
      email: tempData.email,
      password: tempData.password, // Пароль будет хеширован в хуке модели
      fullName,
      birthDate
    });

    console.log('User created successfully:', user.id);

    // Удаляем временные данные
    tempRegistrations.delete(tempToken);

    // Создаем JWT токен для авторизации
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Регистрация успешно завершена',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        birthDate: user.birthDate
      }
    });
  } catch (error) {
    console.error('Ошибка второго этапа регистрации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Авторизация
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Введите корректный email'),
  body('password').notEmpty().withMessage('Введите пароль')
], async (req, res) => {
  try {
    // Проверяем ошибки валидации
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Находим пользователя
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Проверяем пароль
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Авторизация успешна',
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        birthDate: user.birthDate
      }
    });
  } catch (error) {
    console.error('Ошибка авторизации:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Валидация токена
router.get('/validate', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.json({ valid: false });
    }

    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    // Находим пользователя в базе данных
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.json({ valid: false });
    }

    res.json({ valid: true });
  } catch (error) {
    res.json({ valid: false });
  }
});

module.exports = router;
