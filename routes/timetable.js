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

router.get('/time', async function(req, res, next) {
  var groupId = req.query.groupId;
  var userArray = new Array();
  var timeArray = new Array();
  var timeObject = new Object();
  var resultArray = new Array();

  var day = ['A', 'B', 'C', 'D', 'E', 'F'];

  for (var i = 0; i < day.length; i++) {
    for (var j = 0; j < 28; j++) {
      timeObject[`${day[i]}${j}`] = 0
    }
  }

  let sql = `select userId from userstudylist where studyId='${groupId}'`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  for (var i = 0; i < recodes.length; i++) {
    userArray.push(recodes[i].userId);
  }

  for (var i = 0; i < userArray.length; i++) {
    sql = `select time from timetable where userId='${userArray[i]}'`;
    recodes = await dbQuery(sql);
    recodes = recodes.rows;

    for (var j = 0; j < recodes.length; j++) {
      timeArray.push(recodes[j].time)
    }

    for (var j = 0; j < timeArray.length; j++) {
      if (timeArray[j] in timeObject) {
        timeObject[timeArray[j]] = timeObject[timeArray[j]] + 1;
      }
    }

    timeArray = [];
  }

  for(key in timeObject){
    if(timeObject[key]!=0){
        resultArray.push({contents: timeObject[key], time: key});
    }
  }

  res.json(resultArray);
});

router.post('/update', async function(req, res, next) {
  var userId = req.body.userId;
  var info = req.body.info;
  var infoArray = new Array();

  if (typeof(info) == 'string') {
    infoArray.push(info);
    info = infoArray;
  }

  let sql = `delete from timetable where userId=${userId} and type=2`;
  let recodes = await dbQuery(sql);

  for (var i = 0; i < info.length; i++) {
    sql = `insert into timetable(contents, time, userId, type) values('${info[i].contents}', '${info[i].time}', ${userId}, 2)`;
    recodes = await dbQuery(sql);
  }

  res.json({
    response: 'success'
  });
});

module.exports = router;
