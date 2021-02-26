"use strict";

//----------------------------imports--------------------------------------------//
var server = require('express').Router();

var _require = require('../db'),
    Transaction = _require.Transaction,
    User = _require.User;

var bodyParser = require('body-parser');

var _require2 = require('sequelize'),
    Sequelize = _require2.Sequelize;

var _require3 = require('bcryptjs'),
    bcrypt = _require3.bcrypt,
    hash = _require3.hash; //-----------------------------routes--------------------------------------------//
//----------Save New User--------------------//


server.post('/', function _callee(req, res) {
  var _req$body, email, password, name, lastname;

  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _req$body = req.body, email = _req$body.email, password = _req$body.password, name = _req$body.name, lastname = _req$body.lastname;
          _context.next = 3;
          return regeneratorRuntime.awrap(hash(password, 10));

        case 3:
          password = _context.sent;
          User.create({
            email: email,
            password: password,
            name: name,
            lastname: lastname
          }).then(function (user) {
            return res.status(201).send(user);
          })["catch"](function (err) {
            res.status(400);
          }); // }

        case 5:
        case "end":
          return _context.stop();
      }
    }
  });
});
module.exports = server;