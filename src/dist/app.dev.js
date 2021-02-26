"use strict";

var express = require('express');

var cookieParser = require('cookie-parser');

var bodyParser = require('body-parser');

var morgan = require('morgan');

var routes = require('./routes/index.js');

var passport = require('passport');

var Strategy = require('passport-local').Strategy;

var bcrypt = require('bcryptjs');

var path = require('path');

var db = require('./db.js');

passport.use(new Strategy(function (username, password, done) {
  db.User.findOne({
    where: {
      email: username
    }
  }).then(function (user) {
    console.log(user);

    if (!user) {
      return done(null, false);
    }

    bcrypt.compare(password, user.password, function (err, res) {
      if (res) {
        return done(null, user);
      } else {
        return done(null, false);
      }
    });
  })["catch"](function (err) {
    console.log(err);
    return done(err);
  });
}));
passport.serializeUser(function (user, done) {
  done(null, user.email);
});
passport.deserializeUser(function (email, done) {
  db.User.findByPk(email).then(function (user) {
    done(null, user);
  })["catch"](function (err) {
    return done(err);
  });
});
var server = express();
server.use(express["static"](path.join(__dirname, 'public')));
server.use(require('express-session')({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));
server.name = 'API';
server.use(bodyParser.urlencoded({
  extended: true,
  limit: '50mb'
}));
server.use(bodyParser.json({
  limit: '50mb'
}));
server.use(cookieParser());
server.use(morgan('dev'));
server.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // update to match the domain you will make the request from

  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});
server.use(passport.initialize());
server.use(passport.session());
server.use(function (req, res, next) {
  // console.log(req.session);
  // console.log(req.user);
  next();
}); // ---------------rutas del server-----------

server.use('/', routes);
server.post('/login', passport.authenticate('local', {
  failureRedirect: '/login'
}), function (req, res) {
  res.send(req.user);
});
server.get('/logout', function (req, res) {
  req.logOut();

  if (req.session) {
    req.session.destroy(function (err) {
      if (err) {
        next(err);
      } else {
        res.clearCookie('connect.sid'); //res.redirect('/')
      }
    });
  }
});
server.use(function (err, req, res, next) {
  // eslint-disable-line no-unused-vars
  var status = err.status || 500;
  var message = err.message || err;
  console.error(err);
  res.status(status).send(message);
});
module.exports = server;