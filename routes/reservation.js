var express = require('express');
var router = express.Router();
var moment = require('moment');
var calculateTime = require('../utils/calculateTime');
var dbQuery = require("../database/promiseQuery.js");
var timeTable = require('../utils/timeTable');

/* GET home page. */
router.get('/', function(req, res, next) {

});

router.get('/list', async function(req, res, next) {
  var date = req.query.date;
  var building = req.query.building;
  var startTime = req.query.startTime;
  var lastTime = req.query.lastTime;
  let recodes;
  var tableList = new Array();
  let jsonResult = new Array();
  let queryResult;
  let lectureRoomArray = new Array();
  let reservedRoomArray = new Array();
  let resultList;
  var stateList = '';
  var queryList = new Array();
  var day;
  var buildingArray = new Array();

  if (typeof(building) == 'string') {
    buildingArray.push(building);
    building = buildingArray;
  }

  date = date.split('-');
  date = moment([date[0], date[1] - 1, date[2]]).format("YYYY-MM-DD");

  day = calculateTime(date);

  for (var i = 0; i < building.length; i++) {
    let sql = `select lectureRoomId from lectureroom where buildingName='${building[i]}'`
    queryResult = await dbQuery(sql);
    queryResult = queryResult.rows;

    for (let query of queryResult) {
      lectureRoomArray.push(query.lectureRoomId);
    }
  }

  for (var i = 0; i < building.length; i++) {
    let sql = `SELECT lectureroomdescription.TIME, lectureroomdescription.roomStatus, lectureRoom.lectureRoomId FROM lectureroom, lectureroomdescription WHERE lectureroom.buildingName='${building[i]}' AND (lectureroomdescription.date='${date}' or lectureroomdescription.day='${day}') AND lectureroom.id=lectureroomdescription.lectureRoomId`
    recodes = await dbQuery(sql);
    recodes = recodes.rows;
    console.log(recodes);

    var array = new Array();

    for (var j = 0; j < recodes.length; j++) {
      array.push(recodes[j]['lectureRoomId'])
      reservedRoomArray.push(recodes[j]['lectureRoomId'])
    }

    array = Array.from(new Set(array));

    for (var l = 0; l < array.length; l++) {
      var result = recodes.filter(function(recode) {
        return recode.lectureRoomId == array[l];
      });

      var sortingField = "TIME";

      result.sort(function(a, b) { // 오름차순
        return a[sortingField] - b[sortingField];
      });

      if (result.length != 0) {
        tableList = timeTable(result, startTime, lastTime);
        resultList = {
          lectureroom: result[0].lectureRoomId,
          stateList: tableList
        }

        jsonResult.push(resultList);
      }
    }
  }

  reservedRoomArray = Array.from(new Set(reservedRoomArray));
  for (var i = 0; i < lectureRoomArray.length; i++) {
    if (reservedRoomArray.indexOf(lectureRoomArray[i]) == -1) {
      for (var j = startTime; j <= lastTime; j++) {
        stateList = stateList + 'A' + ' ';
      }
      resultList = {
        lectureroom: lectureRoomArray[i],
        stateList: stateList
      }
      stateList = '';
      jsonResult.push(resultList);
    }
  }

  res.json(jsonResult);
});

router.post('/create', async function(req, res, next) {
  var date = req.body.date;
  var lectureRoom = req.body.lectureRoom;
  var startTime = req.body.startTime;
  var lastTime = req.body.lastTime;
  var leaderId = req.body.userId;
  var randomAfter = req.body.randomAfter;
  var day;

  let sql = 'select count(*) as num from reservation';
  var queryResult = await dbQuery(sql);
  queryResult = queryResult.rows;

  num = queryResult[0]['num'];
  num = num + 1;

  sql = `select id from lectureRoom where lectureRoomId='${lectureRoom}'`;
  var queryResult = await dbQuery(sql);
  var queryResult = queryResult.rows;
  lectureRoom = queryResult[0]["id"];

  sql = `insert into reservation (id, beforeUri, afterUri, beforeTime, afterTime, leaderId, perpose, score, scoreReason, gaurdId, reservationType, reservationNum, randomStatus, priority, lectureRoomId) values(${num}, null, null, '${startTime}',' ${lastTime}', ${leaderId}, null, null, null, null, 1, null, ${randomAfter}, null, ${lectureRoom})`
  queryResult = await dbQuery(sql);

  for (var i = startTime; i <= lastTime; i++) {
    sql = `insert into reservationdescription (reservationId, date, time) values(${num}, '${date}', ${i})`
    queryResult = await dbQuery(sql);
  }

  day = calculateTime(date);

  for (var i = startTime; i <= lastTime; i++) {
    sql = `insert into lectureroomdescription (lectureId, lectureRoomId, lectureTime, time, semester, roomStatus, date, day) values(0, ${lectureRoom}, 0, ${i}, '2020-1', 'R', '${date}', '${day}')`
    queryResult = await dbQuery(sql);
  }

  res.json({
    'id': num
  });
});

router.post('/updateInfo', async function(req, res, next) {
  var reservationId = req.body.reservationId;
  var reservationIntent = req.body.reservationIntent;
  var userClassofsNum = req.body.userClassofsNum;
  var userClassofs = req.body.userClassofs;
  var studentId = new Array();
  var userArray = new Array();

  if (typeof(userClassofs) == 'string') {
    userArray.push(userClassofs);
    userClassofs = userArray;
  }

  let sql = `update reservation set perpose = '${reservationIntent}', reservationNum = '${userClassofsNum}' where id=${reservationId}`;
  var queryResult = await dbQuery(sql);

  for (var i = 0; i < userClassofs.length; i++) {
    sql = `select id from user where studentNum='${userClassofs}'`
    queryResult = await dbQuery(sql);
    queryResult = queryResult.rows;
    studentId.push(queryResult[i]['id']);
  }

  for (var i = 0; i < userClassofs.length; i++) {
    sql = `insert into userreservationlist (reservationId, userId) values(${reservationId}, ${studentId[i]})`
    queryResult = await dbQuery(sql);
  }

  res.send('success');
});

module.exports = router;
