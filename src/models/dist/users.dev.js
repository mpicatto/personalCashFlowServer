"use strict";

var _require = require('sequelize'),
    DataTypes = _require.DataTypes;

module.exports = function (sequelize) {
  sequelize.define('user', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING,
      primaryKey: true,
      unique: true
    },
    password: {
      type: DataTypes.STRING
    },
    name: {
      type: DataTypes.STRING
    },
    lastName: {
      type: DataTypes.STRING
    }
  });
};