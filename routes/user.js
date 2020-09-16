var express = require('express');
var router = express.Router();
var dbQuery = require("../database/promiseQuery.js");
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');

/* GET home page. */
router.get('/', async function(req, res, next) {
  var userId = req.query.userId;
  var lectureList = new Array();

  let sql = `select name, userType, email, studentNum, score from user where id=${userId}`
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
  var token = req.body.token;

  let sql = `select id, salt, userPassword from user where userId='${userId}'`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  if (recodes.length == 0) {
    res.json({
      id: -1
    });
  } else {
    let hashPassword = crypto.createHash("sha512").update(password + recodes[0].salt).digest("hex");

    if (hashPassword == recodes[0].userPassword) {
      sql = `update user set token='${token}' where id=${recodes[0].id}`;
      let recode = await dbQuery(sql);

      res.json({
        id: recodes[0].id
      });
    } else {
      res.json({
        id: -1
      });
    }
  }
});

router.post('/confirm', async function(req, res, next) {
  var userId = req.body.userId;

  let sql = `select userId from user where userId='${userId}'`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  if (recodes.length == 0) {
    res.json({
      response: 'success'
    });
  } else {
    res.json({
      response: 'fail'
    });
  }
});

router.post('/email', async function(req, res, next) {
  var email = req.body.email;
  var result;

  let sql = `select email from user where email='${email}'`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  if (recodes.length == 0) {
    result = Math.floor(Math.random() * 1000000) + 100000;
    if (result > 1000000) {
      result = result - 100000;
    }

    var transporter = nodemailer.createTransport(smtpTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      auth: {
        user: 'hjw9504@ajou.ac.kr',
        pass: 'hjw201520987'
      }
    }));

    var mailOptions = {
      from: 'hjw9504@ajou.ac.kr',
      to: email,
      subject: 'ASMR 인증번호',
      text: `다음 내용을 입력해주세요! ${result}`
    };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    res.json({
      response: result
    });
  } else {
    res.json({
      response: '-1'
    });
  }

});

router.post('/signup', async function(req, res, next) {
  var userId = req.body.userId;
  var password = req.body.password;
  var name = req.body.name;
  var studentNumber = req.body.studentNumber;
  var email = req.body.email;
  var lecture = req.body.lecture;
  var lectureCode = req.body.lectureCode;

  var num;
  var lectureList = new Array();
  var lectureArray = new Array();

  if (typeof(lecture) == 'string') {
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

  sql = `insert into user(id, name, userId, userPassword, email, userType, photo, phoneNumber, score, studentNum, salt, token) values(${num}, '${name}', '${userId}', '${hashPassword}', '${email}', 0, null, null, 0, '${studentNumber}', '${salt}', null)`
  recodes = await dbQuery(sql);

  for (var i = 0; i < lecture.length; i++) {
    sql = `select id from lecture where lectureName='${lecture[i]}' and lectureCode='${lectureCode[i]}'`
    recodes = await dbQuery(sql);
    recodes = recodes.rows;
    lectureList.push(recodes[0].id);
  }

  for (var i = 0; i < lectureList.length; i++) {
    sql = `insert into userlecturelist(lectureId, studentId) values(${lectureList[i]}, ${num})`
    recodes = await dbQuery(sql);
  }

  for (var i = 0; i < lectureList.length; i++) {
    sql = `select lectureroom.lectureRoomId as lectureRoomId, lectureroomdescription.time as time, lectureroomdescription.day as day from lectureroom, lectureroomdescription where lectureroomdescription.lectureId='${lectureList[i]}' and lectureroomdescription.lectureRoomId=lectureroom.id`;
    let query = await dbQuery(sql);
    query = query.rows;

    for (var j = 0; j < query.length; j++) {
      var contents = lecture[i] + "," + query[j].lectureRoomId;
      var time = query[j].day + query[j].time;
      sql = `insert into timetable(contents, time, userId, type) values('${contents}', '${time}', ${num}, 1)`;
      let queryResult = await dbQuery(sql);
    }
  }

  res.json({
    response: 'success'
  });
});

module.exports = router;
