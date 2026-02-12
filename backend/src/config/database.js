// Конфигурация подключения к базе данных PostgreSQL
const { Sequelize } = require('sequelize');

// Используем переменные окружения или значения по умолчанию
const sequelize = new Sequelize(
  process.env.DB_NAME || 'birthday_app',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
  }
);

module.exports = sequelize;
