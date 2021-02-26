const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const routes = require('./routes/index.js');
const passport = require('passport');
var Strategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
var path = require('path');
const db = require('./db.js');

passport.use(new Strategy(
  function(username, password, done){

    db.User.findOne({
      where:{
        email: username,
      }
    })
    .then((user) => {
      console.log(user);
      if(!user){
        return done(null,false);
      }
      bcrypt.compare(password, user.password, function(err, res) {
        if (res){
          return done(null, user);
        } else {
          return done(null, false)
        }
      });
    })
    .catch(err => {
      console.log(err)
      return done(err);
    })
  }));

  passport.serializeUser(function(user, done){
    done(null, user.email);
  });

  passport.deserializeUser(function(email, done){
    db.User.findByPk(email)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      return done(err);
    })
  });

const server = express();
server.use(express.static(path.join(__dirname, 'public')));
server.use(require('express-session')({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));

server.name = 'API';

server.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
server.use(bodyParser.json({ limit: '50mb' }));
server.use(cookieParser());
server.use(morgan('dev'));
server.use((req, res, next) => {
  	res.header('Access-Control-Allow-Origin', 'https://personal-cashflow.netlify.app/'); // update to match the domain you will make the request from
  	res.header('Access-Control-Allow-Credentials', 'true');
  	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  next();
});

server.use(passport.initialize());
server.use(passport.session());

server.use((req, res, next) => {
  // console.log(req.session);
  // console.log(req.user);
  next();
});

// ---------------rutas del server-----------
 server.use('/', routes);

server.post('/login',
  passport.authenticate('local', {failureRedirect: '/login'}),
  function(req, res) {

    res.send(req.user);
  });

  server.get('/logout', (req, res) => {
    req.logout();
    req.session.destroy();
    res.clearCookie('connect.sid').sendStatus(200);
  });

  server.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
    const status = err.status || 500;
    const message = err.message || err;
    console.error(err);
    res.status(status).send(message);
  });

module.exports = server;