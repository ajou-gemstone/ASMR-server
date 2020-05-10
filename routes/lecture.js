var express = require('express');
var router = express.Router();
var dbQuery = require("../database/promiseQuery.js");

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/info', async function(req, res, next) {
  var lectureRoomId = req.query.lectureRoom;

  let sql = `select lectureRoomNum from lectureroom where lectureRoomId='${lectureRoomId}'`
  queryResult = await dbQuery(sql);
  queryResult = queryResult.rows;

  res.json(queryResult[0]);
});

module.exports = router;
