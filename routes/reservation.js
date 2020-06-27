var express = require('express');
var router = express.Router();
var moment = require('moment');
var calculateTime = require('../utils/calculateTime');
var dbQuery = require("../database/promiseQuery.js");
var timeTable = require('../utils/timeTable');
var evaluateDate = require('../utils/date');
var nullCheck = require('../utils/nullCheck');
var timeParser = require('../utils/timeParser');
var evaluateReservation = require('../utils/evaluateReservation');
var admin = require("firebase-admin");
var serviceAccount = require("../asmr-799cf-firebase-adminsdk-57wam-7a9f28cc26.json");

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
  var resultArray = new Array();

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
    let sql = `SELECT lectureroomdescription.TIME, lectureroomdescription.roomStatus, lectureRoom.lectureRoomId FROM lectureroom, lectureroomdescription WHERE lectureroom.buildingName='${building[i]}' AND (lectureroomdescription.day='${day}' and lectureroomdescription.roomStatus='L') AND lectureroom.id=lectureroomdescription.lectureRoomId`
    recodes = await dbQuery(sql);
    recodes = recodes.rows;

    for (var j = 0; j < recodes.length; j++) {
      resultArray.push(recodes[j]);
    }

    sql = `SELECT lectureroomdescription.TIME, lectureroomdescription.roomStatus, lectureRoom.lectureRoomId FROM lectureroom, lectureroomdescription WHERE lectureroom.buildingName='${building[i]}' AND lectureroomdescription.date='${date}' AND lectureroom.id=lectureroomdescription.lectureRoomId`
    recodes = await dbQuery(sql);
    recodes = recodes.rows;

    for (var j = 0; j < recodes.length; j++) {
      resultArray.push(recodes[j]);
    }

    var array = new Array();

    for (var j = 0; j < resultArray.length; j++) {
      array.push(resultArray[j]['lectureRoomId'])
      reservedRoomArray.push(resultArray[j]['lectureRoomId'])
    }

    array = Array.from(new Set(array));

    for (var l = 0; l < array.length; l++) {
      var result = resultArray.filter(function(recode) {
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
    resultArray = [];
  }

  reservedRoomArray = Array.from(new Set(reservedRoomArray));

  for (var i = 0; i < lectureRoomArray.length; i++) {
    if (reservedRoomArray.indexOf(lectureRoomArray[i]) == -1) {
      stateList = '';
      for (var j = 0; j <= lastTime - startTime; j++) {
        stateList = stateList + 'A' + ' ';
      }
      resultList = {
        lectureroom: lectureRoomArray[i],
        stateList: stateList
      }

      jsonResult.push(resultList);
    }
  }

  res.json(jsonResult);
});

router.get('/info', async function(req, res, next) {
  var reservationId = req.query.reservationId;
  var timeList = new Array();
  var userList = new Array();
  var nameList = new Array();

  let sql = `select lectureRoomId as lectureRoom, beforeUri, afterUri, perpose as reservationIntent, beforeTime as beforeUploadTime, afterTime as afterUploadTime from reservation where id=${reservationId}`;
  var recodes = await dbQuery(sql);
  recodes = recodes.rows;

  sql = `select lectureRoomId from lectureRoom where id=${recodes[0].lectureRoom}`;
  var recode = await dbQuery(sql);
  recode = recode.rows;

  recodes[0].lectureRoom = recode[0].lectureRoomId;

  sql = `select date, time from reservationdescription where reservationid=${reservationId}`;
  var queryResult = await dbQuery(sql);
  queryResult = queryResult.rows;

  for (var i = 0; i < queryResult.length; i++) {
    timeList.push(queryResult[i].time)
  }

  timeList.sort(function(a, b) {
    return a - b;
  });

  recodes[0].date = queryResult[0].date;
  recodes[0].day = calculateTime(queryResult[0].date);

  recodes[0].startTime = timeList[0];
  recodes[0].lastTime = timeList[timeList.length - 1];

  sql = `select user.name, userreservationlist.userId from user, userreservationlist where user.id=userreservationlist.userId and userreservationlist.reservationid=${reservationId}`;
  var query = await dbQuery(sql);
  query = query.rows;

  for (var i = 0; i < query.length; i++) {
    userList.push(query[i].userId)
    nameList.push(query[i].name)
  }

  recodes[0].userId = userList
  recodes[0].userName = nameList

  if (recodes[0].beforeUri == null) {
    recodes[0].beforeUri = "";
  }

  if (recodes[0].afterUri == null) {
    recodes[0].afterUri = "";
  }

  res.json(recodes[0]);
});

router.get('/myInfo', async function(req, res, next) {
  var tense = req.query.tense;
  var userId = req.query.userId;
  var buildingName = req.query.buildingName;
  var reservationList = new Array();
  var timeList = new Array();
  var resultArray = new Array();
  var resultList = new Array();

  let sql = `select userreservationlist.reservationId from reservation, userreservationlist where reservation.id=userreservationlist.reservationId and userreservationlist.userId=${userId} and reservation.leaderId=${userId}`;
  var recodes = await dbQuery(sql);
  recodes = recodes.rows;

  for (var i = 0; i < recodes.length; i++) {
    reservationList.push(recodes[i].reservationId)
  }

  reservationList = Array.from(new Set(reservationList));

  for (var i = 0; i < reservationList.length; i++) {
    sql = `SELECT reservation.id as reservationId, (SELECT lectureroom.lectureRoomId FROM lectureroom where lectureroom.id=reservation.lectureRoomId) AS lectureRoom, score from reservation where reservation.id=${reservationList[i]}`;
    var recode = await dbQuery(sql);
    recode = recode.rows;

    sql = `select date, time from reservationdescription where reservationid=${reservationList[i]}`;
    var queryResult = await dbQuery(sql);
    queryResult = queryResult.rows;

    for (var j = 0; j < queryResult.length; j++) {
      timeList.push(queryResult[j].time)
    }

    timeList.sort(function(a, b) {
      return a - b;
    });

    recode[0].date = queryResult[0].date;
    recode[0].day = calculateTime(queryResult[0].date);

    recode[0].startTime = timeList[0];
    recode[0].lastTime = timeList[timeList.length - 1];

    resultArray.push(recode[0]);
    timeList = [];
  }

  if (tense == 'future') {
    for (var i = 0; i < resultArray.length; i++) {
      if (evaluateDate(resultArray[i].date) > evaluateDate(new Date())) {
        resultList.push(resultArray[i])
      }
    }
  } else if (tense == 'today') {
    for (var i = 0; i < resultArray.length; i++) {
      if (evaluateDate(resultArray[i].date) == evaluateDate(new Date())) {
        resultList.push(resultArray[i])
      }
    }
  } else {
    for (var i = 0; i < resultArray.length; i++) {
      if (evaluateDate(resultArray[i].date) < evaluateDate(new Date())) {
        resultList.push(resultArray[i])
      }
    }
  }

  res.json(resultList);
});

router.get('/guardBuildingInfo', async function(req, res, next) {
  var tense = req.query.tense;
  var buildingName = req.query.buildingName;
  var buildingList = new Array();
  var timeList = new Array();
  var resultArray = new Array();
  var resultList = new Array();

  let sql = `select id from lectureRoom where buildingName='${buildingName}'`;
  var recodes = await dbQuery(sql);
  recodes = recodes.rows;

  for (var i = 0; i < recodes.length; i++) {
    buildingList.push(recodes[i].id)
  }

  for (var i = 0; i < buildingList.length; i++) {
    sql = `SELECT reservation.id as reservationId, lectureroom.lectureRoomId as lectureRoom, reservation.score from reservation, lectureroom where lectureroom.id=${buildingList[i]} and reservation.lectureRoomId=lectureroom.id`;
    var recode = await dbQuery(sql);
    recode = recode.rows;

    for (var j = 0; j < recode.length; j++) {
      sql = `select date, time from reservationdescription where reservationid=${recode[j].reservationId}`;
      var queryResult = await dbQuery(sql);
      queryResult = queryResult.rows;

      for (var l = 0; l < queryResult.length; l++) {
        timeList.push(queryResult[l].time);
      }

      timeList.sort(function(a, b) {
        return a - b;
      });

      recode[j].date = queryResult[0].date;
      recode[j].day = calculateTime(queryResult[0].date);

      recode[j].startTime = timeList[0];
      recode[j].lastTime = timeList[timeList.length - 1];

      resultArray.push(recode[j]);
      timeList = [];
    }
  }

  if (tense == 'future') {
    for (var i = 0; i < resultArray.length; i++) {
      if (evaluateDate(resultArray[i].date) > evaluateDate(new Date())) {
        resultList.push(resultArray[i])
      }
    }
  } else if (tense == 'today') {
    for (var i = 0; i < resultArray.length; i++) {
      if (evaluateDate(resultArray[i].date) == evaluateDate(new Date())) {
        resultList.push(resultArray[i])
      }
    }
  } else {
    for (var i = 0; i < resultArray.length; i++) {
      if (evaluateDate(resultArray[i].date) < evaluateDate(new Date())) {
        resultList.push(resultArray[i])
      }
    }
  }

  res.json(resultList);
});

router.get('/buildingInfo', async function(req, res, next) {
  var buildingName = req.query.buildingName;
  var floor = req.query.floor;
  var id;
  var lectureRoomId;
  var reservationList = new Array();
  var resultArray = new Array();
  var timeList = new Array();
  var userList = new Array();
  var count = 0;
  var resultarray = new Array();
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();

  if ((month + "").length < 2) {
    month = "0" + month;
  }

  if ((day + "").length < 2) {
    day = "0" + day;
  }

  year = year.toString();
  month = month.toString();
  day = day.toString();

  date = year + "-" + month + "-" + day;

  var time = timeParser();

  let sql = `select id, lectureRoomId from lectureRoom where buildingName='${buildingName}' and floor='${floor}'`;
  var recodes = await dbQuery(sql);
  recodes = recodes.rows;

  for (var l = 0; l < recodes.length; l++) {
    id = recodes[l].id;
    lectureRoomId = recodes[l].lectureRoomId;

    sql = `select id from reservation where lectureRoomId=${id}`;
    var recode = await dbQuery(sql);
    recode = recode.rows;

    for (var i = 0; i < recode.length; i++) {
      reservationList.push(recode[i].id);
    }

    for (var i = 0; i < reservationList.length; i++) {
      sql = `select reservationType from reservation where id=${reservationList[i]}`;
      queryList = await dbQuery(sql);
      queryList = queryList.rows;

      sql = `select time, date from reservationdescription where reservationId=${reservationList[i]}`;
      var queryResult = await dbQuery(sql);
      queryResult = queryResult.rows;

      for (var j = 0; j < queryResult.length; j++) {
        timeList.push(queryResult[j].time)
      }

      timeList.sort(function(a, b) {
        return a - b;
      });

      sql = `select userId from userreservationlist where reservationId=${reservationList[i]}`;
      var query = await dbQuery(sql);
      query = query.rows;

      for (var j = 0; j < query.length; j++) {
        userList.push(query[j].userId);
      }

      queryList[0].lectureRoomId = id;
      queryList[0].lectureRoom = lectureRoomId;
      queryList[0].reservationId = reservationList[i];
      queryList[0].startTime = timeList[0];
      queryList[0].lastTime = timeList[timeList.length - 1];
      queryList[0].userId = userList;
      queryList[0].date = queryResult[0].date

      resultArray.push(queryList[0]);

      timeList = [];
      userList = [];
    }
    reservationList = [];
  }

  for (var i = 0; i < resultArray.length; i++) {
    for (var j = resultArray[i].startTime; j <= resultArray[i].lastTime; j++) {
      var tmpDate = resultArray[i].date;

      year = tmpDate.getFullYear();
      month = tmpDate.getMonth() + 1;
      day = tmpDate.getDate();

      if ((month + "").length < 2) {
        month = "0" + month;
      }

      if ((day + "").length < 2) {
        day = "0" + day;
      }

      year = year.toString();
      month = month.toString();
      day = day.toString();

      tmpDate = year + "-" + month + "-" + day;

      if (j == time && tmpDate == date) {
        count++;
        break;
      }
    }

    if (count != 0) {
      delete resultArray[i].date;
      resultarray.push(resultArray[i]);
    }
    count = 0;
  }

  res.json(resultarray);
})

router.get('/guardInfo', async function(req, res, next) {
  var reservationId = req.query.reservationId;

  let sql = `select leaderId, score, scoreReason, guardId from reservation where id=${reservationId}`;
  var recodes = await dbQuery(sql);
  recodes = recodes.rows;

  recodes[0].score = nullCheck(recodes[0].score);
  recodes[0].scoreReason = nullCheck(recodes[0].scoreReason);
  recodes[0].guardId = nullCheck(recodes[0].guardId);

  res.json(recodes[0]);
})

router.post('/create', async function(req, res, next) {
  var date = req.body.date;
  var lectureRoom = req.body.lectureRoom;
  var startTime = req.body.startTime;
  var lastTime = req.body.lastTime;
  var leaderId = req.body.userId;
  var randomAfter = req.body.randomAfter;
  var day;

  startTime = parseInt(startTime);
  lastTime = parseInt(lastTime);

  leaderId = parseInt(leaderId);

  if (randomAfter == 'true') {
    randomAfter = 1;
  } else {
    randomAfter = 0;
  }

  let sql = 'select max(id) as num from reservation';
  var queryResult = await dbQuery(sql);
  queryResult = queryResult.rows;

  num = queryResult[0]['num'];
  num = num + 1;

  sql = `select id from lectureRoom where lectureRoomId='${lectureRoom}'`;
  var queryResult = await dbQuery(sql);
  queryResult = queryResult.rows;
  lectureRoom = queryResult[0]["id"];

  var today = new Date();
  var t1 = moment(date, 'YYYY-MM-DD');
  var t2 = moment(today, 'YYYY-MM-DD');

  if (moment.duration(t1.diff(t2)).asDays() <= 2) {
    sql = `insert into reservation (id, beforeUri, afterUri, beforeTime, afterTime, leaderId, perpose, score, scoreReason, guardId, reservationType, reservationNum, randomStatus, priority, lectureRoomId) values(${num}, null, null, '${startTime}',' ${lastTime}', ${leaderId}, null, null, null, null, 'R', null, ${randomAfter}, null, ${lectureRoom})`
    queryResult = await dbQuery(sql);
  } else {
    sql = `insert into reservation (id, beforeUri, afterUri, beforeTime, afterTime, leaderId, perpose, score, scoreReason, guardId, reservationType, reservationNum, randomStatus, priority, lectureRoomId) values(${num}, null, null, '${startTime}',' ${lastTime}', ${leaderId}, null, null, null, null, '1', null, ${randomAfter}, null, ${lectureRoom})`
    queryResult = await dbQuery(sql);
  }

  for (var i = startTime; i <= lastTime; i++) {
    sql = `insert into reservationdescription (reservationId, date, time) values(${num}, '${date}', '${i}')`
    queryResult = await dbQuery(sql);
  }

  day = calculateTime(date);

  for (var i = startTime; i <= lastTime; i++) {
    sql = `select roomStatus from lectureroomdescription where time='${i}' and date='${date}' and lectureRoomId = ${lectureRoom}`;
    let query = await dbQuery(sql);
    query = query.rows;

    if (query.length != 0) {
      if (query[0].roomStatus != 'R') {
        var tmpStatus = parseInt(query[0].roomStatus);
        tmpStatus = tmpStatus + 1;
        sql = `update lectureroomdescription set roomStatus=${tmpStatus} where time='${i}' and date='${date}' and lectureRoomId = ${lectureRoom}`
        queryResult = await dbQuery(sql);
      }
    } else {
      if (moment.duration(t1.diff(t2)).asDays() <= 2) {
        sql = `insert into lectureroomdescription (lectureId, lectureRoomId, lectureTime, time, semester, roomStatus, date, day, reservationId) values(0, ${lectureRoom}, 0, '${i}', '2020-1', 'R', '${date}', '${day}', ${num})`
        queryResult = await dbQuery(sql);
      } else {
        sql = `insert into lectureroomdescription (lectureId, lectureRoomId, lectureTime, time, semester, roomStatus, date, day, reservationId) values(0, ${lectureRoom}, 0, '${i}', '2020-1', '1', '${date}', '${day}', ${num})`
        queryResult = await dbQuery(sql);
      }
    }
  }

  sql = `insert into userreservationlist (reservationId, userId) values(${num}, ${leaderId})`
  queryResult = await dbQuery(sql);

  res.json({
    'reservationId': num
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
    sql = `select id from user where studentNum='${userClassofs[i]}'`
    queryResult = await dbQuery(sql);
    queryResult = queryResult.rows;
    studentId.push(queryResult[0]['id']);
  }

  for (var i = 0; i < userClassofs.length; i++) {
    sql = `insert into userreservationlist (reservationId, userId) values(${reservationId}, ${studentId[i]})`
    queryResult = await dbQuery(sql);
  }

  res.json({
    response: 'success'
  });
});

router.post('/beforeImage', async function(req, res, next) {
  var reservationId = req.body.reservationId;
  var beforeUri = req.body.beforeUri;
  var beforeTime = req.body.beforeUriUploadTime;

  let sql = `update reservation set beforeUri = '${beforeUri}', beforeTime = '${beforeTime}' where id=${reservationId}`;
  var queryResult = await dbQuery(sql);

  res.json({
    response: 'success'
  });
});

router.post('/afterImage', async function(req, res, next) {
  var reservationId = req.body.reservationId;
  var afterUri = req.body.afterUri;
  var afterTime = req.body.afterUriUploadTime;

  let sql = `update reservation set afterUri = '${afterUri}', afterTime = '${afterTime}' where id=${reservationId}`;
  var queryResult = await dbQuery(sql);

  res.json({
    response: 'success'
  });
});

router.post('/delete', async function(req, res, next) {
  var reservationId = req.body.reservationId;
  var score = req.body.score;
  let sql, queryResult;

  score = parseInt(score);

  sql = `select leaderId from reservation where id=${reservationId}`;
  queryResult = await dbQuery(sql);
  queryResult = queryResult.rows;

  if (score == 1) {
    sql = `update user set score=score+1 where id=${queryResult[0].leaderId}`;
    var query = await dbQuery(sql);

    sql = `select token from user where id=${queryResult[0].leaderId}`;
    query = await dbQuery(sql);
    query = query.rows;

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        //  databaseURL: "https://asmr-799cf.firebaseio.com"
      });
    }

    //-----------
    //메세지 작성 부분
    var fcm_message = {
      data: {
        fileno: '1',
        style: 'good',
        title: '새로운 예약 알림입니다', //여기에 알림 목적을 작성
        body: `강의실 사용 미흡으로 패널티가 추가되었습니다.`
      },
      token: query[0].token
    }

    admin.messaging().send(fcm_message)
      .then(function(response) {
        console.log("보내기 성공 메세지" + response);
      }).catch(function(error) {
        console.log('보내기 실패 메세지' + error);
        if (!/already exists/.test(error.message)) {
          console.error('Firebase initialization error raised', error.stack)
        }
      });
  }

  sql = `delete from userreservationlist where reservationId=${reservationId}`;
  queryResult = await dbQuery(sql);

  sql = `delete from reservationdescription where reservationId=${reservationId}`;
  queryResult = await dbQuery(sql);

  sql = `delete from reservation where id=${reservationId}`;
  queryResult = await dbQuery(sql);

  res.json({
    response: 'success'
  });
});

router.post('/saveScore', async function(req, res, next) {
  var reservationId = req.body.reservationId;
  var leaderId = req.body.leaderId;
  var score = req.body.score;
  var scoreReason = req.body.scoreReason;
  var guardId = req.body.guardId;

  score = parseInt(score);

  if (score == 1) {
    let sql = `update reservation set score = '${score}', scoreReason = '${scoreReason}', guardId = '${guardId}' where id=${reservationId}`;
    var queryResult = await dbQuery(sql);

    sql = `update user set score = score+1 where id=${leaderId}`;
    queryResult = await dbQuery(sql);

    sql = `select token from user where id=${leaderId}`;
    queryResult = await dbQuery(sql);
    queryResult = queryResult.rows;

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        //  databaseURL: "https://asmr-799cf.firebaseio.com"
      });
    }

    //-----------
    //메세지 작성 부분
    var fcm_message = {
      data: {
        fileno: '1',
        style: 'good',
        title: '새로운 예약 알림입니다', //여기에 알림 목적을 작성
        body: `강의실 사용 미흡으로 패널티가 추가되었습니다.`
      },
      token: queryResult[0].token
    }

    admin.messaging().send(fcm_message)
      .then(function(response) {
        console.log("보내기 성공 메세지" + response);
      }).catch(function(error) {
        console.log('보내기 실패 메세지' + error);
        if (!/already exists/.test(error.message)) {
          console.error('Firebase initialization error raised', error.stack)
        }
      });
  } else {
    let sql = `update reservation set score = '${score}', scoreReason = '${scoreReason}', guardId = '${guardId}' where id=${reservationId}`;
    var queryResult = await dbQuery(sql);
  }

  res.json({
    response: 'success'
  });
});

router.post('/searchStudentId', async function(req, res, next) {
  var studentId = req.body.studentId;

  let sql = `select id from user where studentNum=${studentId}`;
  var queryResult = await dbQuery(sql);
  queryResult = queryResult.rows;

  if (queryResult.length != 0) {
    res.json({
      response: 'success'
    });
  } else {
    res.json({
      response: 'fail'
    });
  }

});

router.post('/test', async function(req, res, next) {
  var date = req.body.date;
  var reservationArray = new Array();
  var timeList = new Array();
  var time = new Array();
  var reservationList = new Array();
  var timelist = new Array();
  var lectureroomList = new Array();

  let sql = `select reservation.id, reservation.lectureRoomId from reservation, reservationdescription where reservation.id=reservationdescription.reservationId and reservationdescription.date='${date}' and reservation.reservationType=1`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  if (recodes.length != 0) {
    for (var i = 0; i < recodes.length; i++) {
      lectureroomList.push(recodes[i].lectureRoomId);
    }

    lectureroomList = Array.from(new Set(lectureroomList));

    for (var a = 0; a < lectureroomList.length; a++) {
      reservationArray = [];

      for (var j = 0; j < recodes.length; j++) {
        if(recodes[j].lectureRoomId==lectureroomList[a]){
          reservationArray.push(recodes[j].id);
        }
      }

      reservationArray = Array.from(new Set(reservationArray));

      for (var i = 0; i < reservationArray.length; i++) {
        sql = `select time from reservationdescription where reservationdescription.reservationId=${reservationArray[i]}`;
        let recode = await dbQuery(sql);
        recode = recode.rows;

        for (var j = 0; j < recode.length; j++) {
          timeList.push(recode[j].time);
          time.push(recode[j].time);
        }

        timeList.sort(function(a, b) {
          return a - b;
        });

        reservationList.push({
          id: reservationArray[i],
          startTime: timeList[0],
          lastTime: timeList[timeList.length - 1]
        });
        timeList = [];
      }

      time.sort(function(a, b) {
        return a - b;
      });

      var result = new Array();
      result = evaluateReservation(reservationList, parseInt(time[0]), parseInt(time[time.length - 1]));

      reservationList = [];

      for (var i = 0; i < reservationArray.length; i++) {
        if (result.indexOf(reservationArray[i]) != -1) {
          sql = `update reservation set reservationType='R' where id=${reservationArray[i]}`;
          let query = await dbQuery(sql);

          sql = `select * from lectureroomdescription where reservationId=${reservationArray[i]}`;
          let queryResult = await dbQuery(sql);
          queryResult = queryResult.rows;

          sql = `delete from lectureroomdescription where reservationId=${reservationArray[i]}`;
          query = await dbQuery(sql);

          sql = `select time from reservationdescription where reservationId=${reservationArray[i]}`;
          query = await dbQuery(sql);
          query = query.rows;

          for (var j = 0; j < query.length; j++) {
            timelist.push(query[j].time)
          }

          timelist.sort(function(a, b) {
            return a - b;
          });

          var startTime = parseInt(timelist[0]);
          var lastTime = parseInt(timelist[timelist.length - 1]);
          timelist = [];

          for (var j = startTime; j <= lastTime; j++) {
            sql = `insert into lectureroomdescription (lectureId, lectureRoomId, lectureTime, time, semester, roomStatus, date, day, reservationId) values(0, '${queryResult[0].lectureRoomId}', 0, '${j}', '2020-1', 'R', '${date}', '${queryResult[0].day}', ${reservationArray[i]})`;
            query = await dbQuery(sql);
            query = query.rows;
          }

          sql = `select user.token from user, reservation where reservation.id=${reservationArray[i]} and user.id=reservation.leaderId`;
          query = await dbQuery(sql);
          query = query.rows;

          if (!admin.apps.length) {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              //  databaseURL: "https://asmr-799cf.firebaseio.com"
            });
          }

          var fcm_target_token = query[0].token;

          //-----------
          //메세지 작성 부분
          var fcm_message = {
            data: {
              fileno: '1',
              style: 'good',
              userId: "1",
              title: '새로운 예약 알림입니다', //여기에 알림 목적을 작성
              body: `선지망 후추첨 예약이 확정되었습니다.`
            },
            token: fcm_target_token
          }

          admin.messaging().send(fcm_message)
            .then(function(response) {
              console.log("보내기 성공 메세지" + response);
            }).catch(function(error) {
              console.log('보내기 실패 메세지' + error);
              if (!/already exists/.test(error.message)) {
                console.error('Firebase initialization error raised', error.stack)
              }
            });
        } else {
          sql = `select user.token from user, reservation where reservation.id=${reservationArray[i]} and user.id=reservation.leaderId`;
          let query = await dbQuery(sql);
          query = query.rows;

          if (!admin.apps.length) {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              //  databaseURL: "https://asmr-799cf.firebaseio.com"
            });
          }

          var fcm_target_token = query[0].token;

          sql = `delete from lectureroomdescription where reservationId=${reservationArray[i]}`;
          query = await dbQuery(sql);

          sql = `select randomStatus from reservation where id=${reservationArray[i]}`;
          query = await dbQuery(sql);
          query = query.rows;

          var randomStatus = query[0].randomStatus;

          if (randomStatus == 1) {
            sql = `select time, date from reservationdescription where reservationId=${reservationArray[i]}`;
            query = await dbQuery(sql);
            query = query.rows;

            var regDate = query[0].date;
            var regDay = calculateTime(regDate);

            for (var j = 0; j < query.length; j++) {
              timeList.push(query[j].time);
              time.push(query[j].time);
            }

            timeList.sort(function(a, b) {
              return a - b;
            });

            sql = `select id from lectureroom`;
            query = await dbQuery(sql);
            query = query.rows;

            var lectureRoomList = new Array();

            for (var l = 0; l < query.length; l++) {
              lectureRoomList.push(query[l].id);
            }

            var count = 0;
            var selectedLectureRoom;

            for (var l = 0; l < lectureRoomList.length; l++) {
              for (var j = parseInt(timeList[0]); j <= parseInt(timeList[timeList.length - 1]); j++) {
                sql = `select roomStatus from lectureroomdescription where time='${j}' and day='${regDay}' and (date='${date}' or roomStatus='L') and lectureRoomId=${lectureRoomList[l]}`;
                query = await dbQuery(sql);
                query = query.rows;

                if (query.length != 0) {
                  count++;
                }
              }
              if (count == 0) {
                selectedLectureRoom = lectureRoomList[l];
                break;
              }
              count = 0;
            }

            for (var j = parseInt(timeList[0]); j <= parseInt(timeList[timeList.length - 1]); j++) {
              sql = `insert into lectureroomdescription (lectureId, lectureRoomId, lectureTime, time, semester, roomStatus, date, day, reservationId) values(0, '${selectedLectureRoom}', 0, '${j}', '2020-1', 'R', '${date}', '${regDay}', ${reservationArray[i]})`;
              query = await dbQuery(sql);
              query = query.rows;
            }

            sql = `update reservation set lectureRoomId=${selectedLectureRoom}, reservationType='R' where id=${reservationArray[i]}`;
            query = await dbQuery(sql);

            sql = `select lectureRoomId from lectureroom where id=${selectedLectureRoom}`;
            query = await dbQuery(sql);
            query = query.rows;

            if (!admin.apps.length) {
              admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                //  databaseURL: "https://asmr-799cf.firebaseio.com"
              });
            }

            //-----------
            //메세지 작성 부분
            var fcm_message = {
              data: {
                fileno: '1',
                style: 'good',
                title: '새로운 예약 알림입니다', //여기에 알림 목적을 작성
                body: `예약이 탈락되어 ${query[0].lectureRoomId}으로 다시 예약되었습니다.`
              },
              token: fcm_target_token
            }

            admin.messaging().send(fcm_message)
              .then(function(response) {
                console.log("보내기 성공 메세지" + response);
              }).catch(function(error) {
                console.log('보내기 실패 메세지' + error);
                if (!/already exists/.test(error.message)) {
                  console.error('Firebase initialization error raised', error.stack)
                }
              });
          } else {
            var fcm_message = {
              data: {
                fileno: '1',
                style: 'good',
                title: '새로운 예약 알림입니다', //여기에 알림 목적을 작성
                body: `선지망 후추첨 예약이 탈락되었습니다.`
              },
              token: fcm_target_token
            }

            admin.messaging().send(fcm_message)
              .then(function(response) {
                console.log("보내기 성공 메세지" + response);
              }).catch(function(error) {
                console.log('보내기 실패 메세지' + error);
                if (!/already exists/.test(error.message)) {
                  console.error('Firebase initialization error raised', error.stack)
                }
              });

            sql = `delete from reservation where id=${reservationArray[i]}`;
            query = await dbQuery(sql);
          }
        }
      }
    }
  }

  res.json({
    response: 'success'
  });
});

module.exports = router;
