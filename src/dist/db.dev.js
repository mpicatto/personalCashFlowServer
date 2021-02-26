"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

//-----------------Imports-------------------------------------//
require('dotenv').config();

var _require = require('sequelize'),
    Sequelize = _require.Sequelize;

var fs = require('fs');

var path = require('path');

var _process$env = process.env,
    DB_USER = _process$env.DB_USER,
    DB_PASSWORD = _process$env.DB_PASSWORD,
    DB_HOST = _process$env.DB_HOST,
    DB_DATABASE = _process$env.DB_DATABASE; //-----------------DB Credentials-------------------------------------//

var sequelize = new Sequelize("postgres://postgres:root@localhost:5432/alkemyChallenge", {
  logging: false,
  // set to console.log to see the raw SQL queries
  "native": false // lets Sequelize know we can use pg-native for ~30% more speed

});
var basename = path.basename(__filename);
var modelDefiners = []; //-----------------Sequelize SetUp---------------------------------------------//

fs.readdirSync(path.join(__dirname, '/models')).filter(function (file) {
  return file.indexOf('.') !== 0 && file !== basename && file.slice(-3) === '.js';
}).forEach(function (file) {
  modelDefiners.push(require(path.join(__dirname, '/models', file)));
});
modelDefiners.forEach(function (model) {
  return model(sequelize);
});
var entries = Object.entries(sequelize.models);
var capsEntries = entries.map(function (entry) {
  return [entry[0][0].toUpperCase() + entry[0].slice(1), entry[1]];
});
sequelize.models = Object.fromEntries(capsEntries);
var _sequelize$models = sequelize.models,
    Transactions = _sequelize$models.Transactions,
    User = _sequelize$models.User,
    Categories = _sequelize$models.Categories; //---------------------Sequelize Relations----------------------------------------//

module.exports = _objectSpread({}, sequelize.models, {
  conn: sequelize
});