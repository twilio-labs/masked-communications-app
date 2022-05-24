var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log("got to /")
  const numbers = JSON.parse(process.env.NUMBER_POOL).sort();
  res.render('index', { title: 'Hello world', numbers });
});

module.exports = router;
