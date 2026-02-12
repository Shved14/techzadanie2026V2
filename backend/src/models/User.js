// Модель пользователя для работы с базой данных
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  // Email пользователя (уникальный)
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  
  // Хешированный пароль
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // Полное имя пользователя
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  // Дата рождения
  birthDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  }
}, {
  // Хуки для хеширования пароля перед созданием/обновлением
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 12);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, 12);
      }
    }
  },
  tableName: 'users'
});

// Метод для проверки пароля
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = User;
