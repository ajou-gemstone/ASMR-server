var express = require('express');
var router = express.Router();
var dbQuery = require("../database/promiseQuery.js");
var crypto = require('crypto');

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

  let sql = `select id, salt, userPassword from user where userId='${userId}'`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  let hashPassword = crypto.createHash("sha512").update(password+recodes[0].salt).digest("hex");

  if (hashPassword == recodes[0].userPassword) {
    res.json({id: recodes[0].id});
  }

  else{
    res.json({id: -1});
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
  var lectureArray = new Array();

  if(typeof(lecture)=='string'){
    lectureArray.push(lecture);
    lecture = lectureArray;
  }

  let sql = `select max(id) as num from user`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  num = recodes[0].num;
  num += 1;

  let salt = Math.round((new Date().valueOf() * Math.random())) + "";
  let hashPassword = crypto.createHash("sha512").update(password + salt).digest("hex");

  sql = `insert into user(id, name, userId, userPassword, email, userType, photo, phoneNumber, score, studentNum, salt) values(${num}, '${name}', '${userId}', '${hashPassword}', '${email}', 1, null, null, null, '${studentNumber}', '${salt}')`
  recodes = await dbQuery(sql);

  for (var i = 0; i < lecture.length; i++) {
    sql = `select id from lecture where lectureName='${lecture[i]}'`
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
