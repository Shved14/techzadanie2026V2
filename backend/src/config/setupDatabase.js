// Скрипт для инициализации базы данных
require('dotenv').config();
const sequelize = require('./database');
const User = require('../models/User');

async function setupDatabase() {
  try {
    console.log('🔄 Подключение к базе данных...');
    
    // Подключаемся к базе данных
    await sequelize.authenticate();
    console.log('✅ Подключение к базе данных установлено');
    
    // Создаем таблицы
    console.log('🔄 Создание таблиц...');
    await sequelize.sync({ force: false });
    console.log('✅ Таблицы успешно созданы');
    
    // Проверяем, есть ли пользователи в базе
    const userCount = await User.count();
    console.log(`📊 В базе данных ${userCount} пользователей`);
    
    console.log('🎉 База данных готова к работе!');
    
  } catch (error) {
    console.error('❌ Ошибка настройки базы данных:', error);
    process.exit(1);
  } finally {
    // Закрываем подключение
    await sequelize.close();
    console.log('🔌 Подключение к базе данных закрыто');
  }
}

// Запускаем настройку
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
