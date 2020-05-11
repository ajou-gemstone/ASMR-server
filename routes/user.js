var express = require('express');
var router = express.Router();
var dbQuery = require("../database/promiseQuery.js");

/* GET home page. */
router.get('/', async function(req, res, next) {
  var userId = req.query.userId;
  var lectureList = new Array();

  let sql = `select name, userType, email from user where id=${userId}`
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  sql = `select lectureName from lecture, userlecturelist where userlecturelist.studentId=${userId} and userlecturelist.lectureId=lecture.id`
  let query = await dbQuery(sql);
  query = query.rows;

  for (var i = 0; i < query.length; i++) {
    lectureList.push(query[i].lectureName)
  }

  recodes[0].lectureList = lectureList;

  res.json(recodes[0]);
});

router.post('/login', async function(req, res, next) {
  var userId = req.body.userId;
  var password = req.body.password;

  let sql = `select id from user where userId='${userId}' and userPassword='${password}'`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  if (recodes.length == 0) {
    res.json({
      id: '-1'
    });
  } else {
    res.json(
      recodes[0]);
  }
});

router.post('/signup', async function(req, res, next) {
  var userId = req.body.userId;
  var password = req.body.password;
  var name = req.body.name;
  var studentNumber = req.body.studentNumber;
  var email = req.body.email;
  var lecture = req.body.lecture;
  var num;
  var lectureList = new Array();

  let sql = `select count(*) as num from user`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  num = recodes[0].num;
  num += 1;

  sql = `insert into user(id, name, userId, userPassword, email, userType, photo, phoneNumber, score, studentNum) values(${num}, '${name}', '${userId}', '${password}', '${email}', 1, null, null, null, '${studentNumber}')`
  recodes = await dbQuery(sql);

  for (var i = 0; i < lecture.length; i++) {
    sql = `select id from lecture where id=${lecture[i]}`
    recodes = await dbQuery(sql);
    recodes = recodes.rows;
    lectureList.push(recodes[i].id);
  }

  for (var i = 0; i < lectureList.length; i++) {
    sql = `insert into userlecturelist(lectureId, studentId) values(${lectureList[i]}, ${num})`
    recodes = await dbQuery(sql);
  }

  res.json({
    response: 'success'
  });
});

module.exports = router;
