var express = require('express');
var router = express.Router();
var dbQuery = require("../database/promiseQuery.js");

/* GET home page. */
router.get('/info', async function(req, res, next) {
  var userId = req.query.userId;

  let sql = `select contents, time from timetable where userId='${userId}'`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  res.json(recodes);
});

router.post('/update', async function(req, res, next) {
  var userId = req.body.userId;
  var info = req.body.info;
  var infoArray = new Array();

  if (typeof(info) == 'string') {
    infoArray.push(info);
    info = infoArray;
  }

  for (var i = 0; i < info.length; i++) {
    let sql = `insert into timetable(contents, time, userId) values('${info[i].contents}', '${info[i].time}', ${userId})`;
    let recodes = await dbQuery(sql);
  }

  res.json({
    response: 'success'
  });
});

module.exports = router;
