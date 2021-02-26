const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    sequelize.define('transactions', {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
        values:['ingreso', 'egreso', 'saldo']
      },
      categoryId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      concept: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      amount: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
    });
  };