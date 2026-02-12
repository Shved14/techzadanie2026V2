// Middleware для проверки JWT токена
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Проверка аутентификации пользователя
const authenticateToken = async (req, res, next) => {
  try {
    // Получаем токен из заголовка Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'Требуется токен авторизации' });
    }
    
    // Верифицируем токен
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // Находим пользователя в базе данных
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    
    // Добавляем пользователя в запрос
    req.user = user;
    next();
  } catch (error) {
    console.error('Ошибка аутентификации:', error);
    return res.status(403).json({ error: 'Недействительный токен' });
  }
};

module.exports = { authenticateToken };
