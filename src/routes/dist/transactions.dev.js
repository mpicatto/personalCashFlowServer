"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

//----------------------------imports--------------------------------------------//
var moment = require('moment');

var server = require('express').Router();

var _require = require('../db.js'),
    Transactions = _require.Transactions,
    User = _require.User,
    Categories = _require.Categories;

var bodyParser = require('body-parser');

var _require2 = require('sequelize'),
    Sequelize = _require2.Sequelize;

var Op = Sequelize.Op; //-----------------------------get routes--------------------------------------------//
//---------------get current balance + last 5 moves------------------ 

server.get('/balance/:email/:last', getuser, getCategories, currentBalance, past5balances, getLast5movs);

function getuser(req, res, next) {
  var data, userId;
  return regeneratorRuntime.async(function getuser$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          data = {
            currentBalance: {},
            movements: [],
            categories: []
          };
          _context.next = 3;
          return regeneratorRuntime.awrap(User.findAll({
            where: {
              email: req.params.email
            }
          }).then(function (user) {
            userId = user[0].dataValues.id;
          })["catch"](function (err) {
            res.send("No se encuentra el Usuario");
            return;
          }));

        case 3:
          req.userId = userId;
          req.data = data;
          next();

        case 6:
        case "end":
          return _context.stop();
      }
    }
  });
}

function getCategories(req, res, next) {
  var categoryList;
  return regeneratorRuntime.async(function getCategories$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          categoryList = [];
          _context2.next = 3;
          return regeneratorRuntime.awrap(Categories.findAll({}).then(function (category) {
            category.map(function (item) {
              categoryList.push(item.dataValues);
            });
          })["catch"](function (err) {
            res.send("No se encuentran las categorias");
            return;
          }));

        case 3:
          req.data.categories = categoryList;
          next();

        case 5:
        case "end":
          return _context2.stop();
      }
    }
  });
}

function currentBalance(req, res, next) {
  var pastBalance, pastBalanceDate, today, expenses;
  return regeneratorRuntime.async(function currentBalance$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          today = moment().format("YYYY-MM-DD");
          _context3.next = 3;
          return regeneratorRuntime.awrap(Transactions.findAll({
            limit: 1,
            order: [['date', 'DESC']],
            where: {
              userId: req.userId,
              type: ["saldo"]
            }
          }).then(function (transaction) {
            if (transaction) {
              pastBalance = parseFloat(transaction[0].dataValues.amount);
              pastBalanceDate = transaction[0].dataValues.date;
            } else {}
          })["catch"](function (err) {
            console.log("error");
            return;
          }));

        case 3:
          _context3.next = 5;
          return regeneratorRuntime.awrap(Transactions.findAll({
            order: [['date', 'DESC']],
            where: {
              date: _defineProperty({}, Op.between, [pastBalanceDate, today]),
              type: ["egreso"]
            }
          }).then(function (egresos) {
            expenses = 0;

            if (egresos) {
              egresos.map(function (item) {
                if (item.dataValues.date != pastBalanceDate) expenses = expenses + parseFloat(item.dataValues.amount);
              });
            }
          }));

        case 5:
          if (pastBalance === undefined) {
            res.send({
              currentBalance: {
                balance: 0
              },
              categories: req.data.categories
            });
          } else {
            req.data.currentBalance.balance = pastBalance - expenses;
            req.data.currentBalance.pastBalanceDate = pastBalanceDate;
            next();
          }

        case 6:
        case "end":
          return _context3.stop();
      }
    }
  });
}

function past5balances(req, res, next) {
  var last30Moves, dailyMoves, dailyBalance, currentBalance, i, j, balance;
  return regeneratorRuntime.async(function past5balances$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          last30Moves = [];
          dailyMoves = [];
          dailyBalance = [];
          currentBalance = req.data.currentBalance.balance;
          i = 0;
          j = 0;
          _context4.next = 8;
          return regeneratorRuntime.awrap(Transactions.findAll({
            limit: 30,
            order: [['date', 'DESC']],
            where: {
              userId: req.userId,
              type: ["egreso", "ingreso"]
            }
          }).then(function (transaction) {
            transaction.map(function (item) {
              last30Moves.push(item.dataValues);
            });
          })["catch"](function (err) {
            res.send("No se encuentran los movimientos");
            return;
          }));

        case 8:
          do {
            if (last30Moves[i]) {
              (function () {
                var moves = {};

                var setMove = function setMove() {
                  if (last30Moves[i].type === "egreso") {
                    moves.amount = parseFloat(last30Moves[i].amount);
                  } else {
                    moves.amount = parseFloat(last30Moves[i].amount);
                    moves.amount = moves.amount - moves.amount * 2;
                  }
                };

                moves.date = last30Moves[i].date;
                dailyMoves.push(moves);
                setMove();
                i = i + 1;

                if (last30Moves[i]) {
                  while (dailyMoves[j].date === last30Moves[i].date) {
                    if (last30Moves[i].type === "egreso") {
                      dailyMoves[j].amount = parseFloat(dailyMoves[j].amount) + parseFloat(last30Moves[i].amount);
                    } else {
                      dailyMoves[j].amount = parseFloat(dailyMoves[j].amount) - parseFloat(last30Moves[i].amount);
                    }

                    i = i + 1;
                  }
                } else {
                  dailyMoves.push(false);
                }

                dailyMoves[j].amount = dailyMoves[j].amount.toString();
                j = j + 1;
              })();
            } else {
              dailyMoves.push(false);
            }
          } while (dailyMoves.length < 5);

          i = 0;

          do {
            if (dailyMoves[i]) {
              balance = {};
              balance.balance = currentBalance;
              balance.date = dailyMoves[i].date;
              dailyBalance.push(balance);
              currentBalance = currentBalance + parseFloat(dailyMoves[i].amount);
              i = i + 1;
            } else {
              dailyBalance.push(false);
            }
          } while (dailyBalance.length < 5);

          req.data.dailyBalance = dailyBalance;
          console.log(dailyBalance);
          next();

        case 14:
        case "end":
          return _context4.stop();
      }
    }
  });
}

function getLast5movs(req, res) {
  var last, movementList;
  return regeneratorRuntime.async(function getLast5movs$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          last = parseInt(req.params.last);
          movementList = [];
          _context5.next = 4;
          return regeneratorRuntime.awrap(Transactions.findAll({
            limit: last,
            order: [['date', 'DESC']],
            where: {
              userId: req.userId,
              type: ["egreso", "ingreso"]
            }
          }).then(function (transaction) {
            var movement = {};
            transaction.map(function (transaction) {
              movement = {};
              movement.id = transaction.dataValues.id;
              movement.date = transaction.dataValues.date;
              movement.categoryId = transaction.dataValues.categoryId;
              movement.amount = transaction.dataValues.amount;
              movement.type = transaction.dataValues.type;
              movement.concept = transaction.dataValues.concept;
              movementList.push(movement);
            });
          })["catch"](function (err) {
            res.send("No se encuentran los movimientos");
            return;
          }));

        case 4:
          req.data.movements = movementList;
          res.send(req.data);

        case 6:
        case "end":
          return _context5.stop();
      }
    }
  });
} //-----------------------Save New Expenses Transactions---------------------------------------


server.post("/new_egreso/:email", getuser, saveData, ifLastExpenseChecker);

function saveData(req, res, next) {
  var _req$body, date, type, categoryId, concept, amount, userId;

  return regeneratorRuntime.async(function saveData$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _req$body = req.body, date = _req$body.date, type = _req$body.type, categoryId = _req$body.categoryId, concept = _req$body.concept, amount = _req$body.amount;
          userId = req.userId;
          _context6.next = 4;
          return regeneratorRuntime.awrap(Transactions.create({
            userId: userId,
            type: type,
            categoryId: categoryId,
            concept: concept,
            amount: amount,
            date: date
          }).then(function (transaction) {
            next();
          })["catch"](function (err) {
            res.sendStatus(400);
          }));

        case 4:
        case "end":
          return _context6.stop();
      }
    }
  });
}

function ifLastExpenseChecker(req, res, next) {
  var date, today, nextBalances;
  return regeneratorRuntime.async(function ifLastExpenseChecker$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          date = req.body.date;
          today = moment().format("YYYY-MM-DD");
          nextBalances = [];
          _context7.next = 5;
          return regeneratorRuntime.awrap(Transactions.findAll({
            order: [['date', 'ASC']],
            where: {
              userId: req.userId,
              date: _defineProperty({}, Op.between, [date, today]),
              type: ["saldo"]
            }
          }).then(function (transaction) {
            transaction.map(function (item) {
              nextBalances.push(item.dataValues);
            });
          })["catch"](function (err) {
            res.sendStatus(400);
          }));

        case 5:
          if (nextBalances.length === 0) {
            res.sendStatus(200);
          } else {
            nextBalances.map(function (saldo) {
              var newSaldo = "";
              saldo.amount = parseFloat(saldo.amount) - parseFloat(req.body.amount);
              newSaldo = saldo.amount.toString();
              Transactions.findByPk(saldo.id).then(function (saldo) {
                saldo.amount = newSaldo;
                saldo.save();
              })["catch"](function (err) {
                res.sendStatus(400);
              });
            });
            res.sendStatus(200);
          }

        case 6:
        case "end":
          return _context7.stop();
      }
    }
  });
} //-----------------------Save New Income Transactions---------------------------------------


server.post("/new_ingreso/:email", getuser, saveData, ifLastIncomeChecker, newBalance);

function ifLastIncomeChecker(req, res, next) {
  var userId, date, today, nextBalances;
  return regeneratorRuntime.async(function ifLastIncomeChecker$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          userId = req.userId;
          date = req.body.date;
          today = moment().format("YYYY-MM-DD");
          nextBalances = [];
          req.ifPost = false;
          _context8.next = 7;
          return regeneratorRuntime.awrap(Transactions.findAll({
            order: [['date', 'ASC']],
            where: {
              userId: req.userId,
              date: _defineProperty({}, Op.between, [date, today]),
              type: ["saldo"]
            }
          }).then(function (transaction) {
            transaction.map(function (item) {
              nextBalances.push(item.dataValues);
            });
          })["catch"](function (err) {
            res.sendStatus(400);
          }));

        case 7:
          if (nextBalances.length === 0) {
            next();
          } else {
            nextBalances.map(function (saldo) {
              saldo.amount = parseFloat(saldo.amount) + parseFloat(req.body.amount);
              newSaldo = saldo.amount.toString();
              Transactions.findByPk(saldo.id).then(function (saldo) {
                saldo.amount = newSaldo;
                saldo.save();
              })["catch"](function (err) {
                res.sendStatus(400);
              });
            });
            req.nextBalances = nextBalances;
            req.ifPost = true;
            next();
          }

        case 8:
        case "end":
          return _context8.stop();
      }
    }
  });
}

function newBalance(req, res) {
  var date, lastYearDate, userId, newBalance, pastBalance, pastBalanceDate, pastYear;
  return regeneratorRuntime.async(function newBalance$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          pastYear = function _ref(date) {
            var prevYear = parseInt(date.split('-')[0]) - 1;
            lastYearDate = date.split('-');
            lastYearDate[0] = prevYear.toString();
          };

          date = req.body.date;
          lastYearDate = "";
          userId = req.userId;
          newBalance = 0;
          pastBalance = 0;
          pastBalanceDate = '';

          if (!(req.ifPost === false)) {
            _context9.next = 11;
            break;
          }

          newBalance = parseFloat(req.body.amount) + req.body.balance;
          _context9.next = 17;
          break;

        case 11:
          pastYear(date);
          _context9.next = 14;
          return regeneratorRuntime.awrap(Transactions.findAll({
            limit: 1,
            order: [['date', 'DESC']],
            where: {
              userId: req.userId,
              date: _defineProperty({}, Op.between, [lastYearDate, date]),
              type: ["saldo"]
            }
          }).then(function (transaction) {
            if (transaction) console.log(transaction[0].dataValues);
            pastBalance = parseFloat(transaction[0].dataValues.amount);
            pastBalanceDate = transaction[0].dataValues.date;
          })["catch"](function (err) {
            res.send("No se encuentran movimientos");
            return;
          }));

        case 14:
          _context9.next = 16;
          return regeneratorRuntime.awrap(Transactions.findAll({
            order: [['date', 'DESC']],
            where: {
              date: _defineProperty({}, Op.between, [pastBalanceDate, date]),
              type: ["egreso"]
            }
          }).then(function (egresos) {
            expenses = 0;

            if (egresos) {
              egresos.map(function (item) {
                expenses = expenses + parseFloat(item.dataValues.amount);
              });
            }
          }));

        case 16:
          newBalance = pastBalance + parseFloat(req.body.amount) - expenses;

        case 17:
          _context9.next = 19;
          return regeneratorRuntime.awrap(Transactions.create({
            userId: userId,
            type: "saldo",
            categoryId: "15",
            concept: "saldo",
            amount: newBalance,
            date: date
          }).then(function (balance) {
            if (balance) {
              res.sendStatus(200);
            }
          })["catch"](function (err) {
            res.sendStatus(400);
          }));

        case 19:
        case "end":
          return _context9.stop();
      }
    }
  });
}

module.exports = server;