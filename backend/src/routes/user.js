// Роуты для работы с личным кабинетом пользователя
const express = require('express');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Получение данных пользователя для личного кабинета
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        birthDate: user.birthDate
      }
    });
  } catch (error) {
    console.error('Ошибка получения профиля:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

// Проверка, является ли сегодня днем рождения пользователя
router.get('/birthday-check', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    
    // Получаем текущую дату
    const today = new Date();
    const todayDay = today.getDate();
    const todayMonth = today.getMonth() + 1; // Месяцы в JS начинаются с 0
    
    // Получаем дату рождения пользователя
    const birthDate = new Date(user.birthDate);
    const birthDay = birthDate.getDate();
    const birthMonth = birthDate.getMonth() + 1;
    
    // Проверяем, совпадают ли день и месяц
    const isBirthday = todayDay === birthDay && todayMonth === birthMonth;
    
    res.json({
      success: true,
      isBirthday,
      userName: user.fullName
    });
  } catch (error) {
    console.error('Ошибка проверки дня рождения:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
});

module.exports = router;
