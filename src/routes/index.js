const { Router } = require('express');
//------------------ import all routers-------------------//
const transactions = require('./transactions.js');
const users = require ('./users.js')
const history = require('./history.js')

const router = Router();

//-------------------- load each router on a route----------//
router.use('/transactions', transactions)
router.use('/users', users)
router.use('/history',history)


//router.use('/login',loginRouter)

module.exports = router;