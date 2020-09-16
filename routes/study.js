var express = require('express');
var router = express.Router();
var dbQuery = require("../database/promiseQuery.js");
var admin = require("firebase-admin");
var serviceAccount = require("../asmr-799cf-firebase-adminsdk-57wam-7a9f28cc26.json");

/* GET home page. */
router.get('/', async function(req, res, next) {
  var groupId = req.query.groupId;
  var userList = new Array();

  let sql = `select title, textBody, studyGroupNumTotal, studyGroupNumCurrent, leaderId from study where id='${groupId}'`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  sql = 'select tagName from studytag ';
  sql += `where studyId in (select studyId from studyTag where studyId = ${groupId})`;
  let queryResult = await dbQuery(sql);
  recodes[0].tagName = queryResult.rows;

  sql = `select userId from userstudylist where studyId = ${groupId} and confirm=1`;
  queryResult = await dbQuery(sql);
  queryResult = queryResult.rows;

  for (var i = 0; i < queryResult.length; i++) {
    sql = `select name, studentNum from user where id = ${queryResult[i].userId}`;
    query = await dbQuery(sql);
    query = query.rows;

    if (queryResult[i].userId == recodes[0].leaderId) {
      userList.push({
        userId: queryResult[i].userId,
        name: query[0].name,
        leader: 1,
        studentNum: query[0].studentNum
      });
    } else {
      userList.push({
        userId: queryResult[i].userId,
        name: query[0].name,
        leader: 0,
        studentNum: query[0].studentNum
      });
    }
  }
  recodes[0].userList = userList;

  delete recodes[0].leaderId;

  res.json(recodes[0]);
});

router.get('/list', async function(req, res, next) {
  let sql = 'select id, title, category, studyGroupNumTotal, studyGroupNumCurrent, imageUri from study';
  let recodes = await dbQuery(sql);

  recodes = recodes.rows

  for (let recode of recodes) {
    sql = 'select tagName from studytag ';
    sql += `where studyId in (select studyId from studyTag where studyId = ${recode['id']})`;
    let queryResult = await dbQuery(sql);
    recode.tagName = queryResult.rows;
  }

  res.json(recodes);
});

router.get('/mylist', async function(req, res, next) {
  var userId = req.query.userId;
  let sql = `select studyId from userstudylist where userId=${userId} and confirm=1`;
  let recodes = await dbQuery(sql);
  let querys;
  let queryResult

  recodes = recodes.rows

  for (var i = 0; i < recodes.length; i++) {
    sql = `select id, title, studyGroupNumTotal, studyGroupNumCurrent from study where id=${recodes[i].studyId}`;
    querys = await dbQuery(sql);

    querys = querys.rows;

    for (let query of querys) {
      sql = 'select tagName from studytag ';
      sql += `where studyId in (select studyId from studyTag where studyId = ${query['id']})`;
      queryResult = await dbQuery(sql);
      query.tagName = queryResult.rows;
    }

    recodes[i].id = querys[0].id;
    recodes[i].title = querys[0].title;
    recodes[i].studyGroupNumTotal = querys[0].studyGroupNumTotal;
    recodes[i].studyGroupNumCurrent = querys[0].studyGroupNumCurrent;
    recodes[i].tagName = querys[0].tagName;
  }

  res.json(recodes);
});

router.get('/waitinglist', async function(req, res, next) {
  var groupId = req.query.groupId;
  var result = new Array();

  let sql = `select userId from userstudylist where studyId=${groupId} and confirm=0`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  for (var i = 0; i < recodes.length; i++) {
    sql = `select id, name, studentNum from user where id=${recodes[i].userId}`;
    let recode = await dbQuery(sql);
    recode = recode.rows;

    result.push(recode[0]);
  }

  res.json(result);
});

router.post('/create', async function(req, res, next) {
  var leaderId = req.body.userId;
  var category = req.body.category;
  var title = req.body.title;
  var textBody = req.body.textBody;
  var tagName = req.body.tagName;
  var studyGroupNumTot = req.body.studyGroupNumTot;
  var num;
  var tagArray = new Array();
  var chatNum;
  var date = new Date();

  if (typeof(tagName) == 'string') {
    tagArray.push(tagName);
    tagName = tagArray;
  }

  let sql = `select max(id) as num from study`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  num = recodes[0].num;
  num += 1;

  sql = `select max(id) as num from chatroom`;
  recodes = await dbQuery(sql);
  recodes = recodes.rows;

  chatNum = recodes[0].num;
  chatNum += 1;

  sql = `insert into study(id, category, title, textBody, classCode, studyGroupNumTotal, studyGroupNumCurrent, imageUri, leaderId) values(${num}, '${category}', '${title}', '${textBody}', 0, '${studyGroupNumTot}', 1, null, ${leaderId})`;
  recodes = await dbQuery(sql);

  for (var i = 0; i < tagName.length; i++) {
    sql = `insert into studytag(studyId, tagName) values(${num}, '${tagName[i]}')`;
    recodes = await dbQuery(sql);
  }

  sql = `insert into userstudylist(studyId, userId, confirm, regDate, chatNum, current) values(${num}, '${leaderId}', 1, '${date}', 0, 0)`;
  recodes = await dbQuery(sql);

  sql = `insert into chatroom(id, title, studyId, currentNum, totalNum) values(${chatNum}, '${title}', ${num}, 0, 0)`;
  recodes = await dbQuery(sql);

  res.json({
    response: 'success'
  });
});

router.post('/register', async function(req, res, next) {
  var groupId = req.body.groupId;
  var userId = req.body.userId;
  var date = new Date()

  let sql = `insert into userstudylist(studyId, userId, confirm, regDate, chatNum, current) values(${groupId}, ${userId}, 0, '${date}', 0, 0)`;
  let recodes = await dbQuery(sql);

  sql = `select user.token from user, study where study.id=${groupId} and user.id=study.leaderId`;
  recodes = await dbQuery(sql);
  recodes = recodes.rows;

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      //  databaseURL: "https://asmr-799cf.firebaseio.com"
    });
  }

  var fcm_target_token = recodes[0].token;

  //-----------
  //메세지 작성 부분
  var fcm_message = {
    data: {
      fileno: '1',
      style: 'good',
      title: '새 모임 신청이 있습니다.', //여기에 알림 목적을 작성
      body: '새 모임 신청이 있습니다.',
      groupId: groupId+""
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

  res.json({
    response: 'success'
  });
});

router.post('/edit', async function(req, res, next) {
  var groupId = req.body.groupId;
  var title = req.body.title;
  var textBody = req.body.textBody;
  var tagName = req.body.tagName;
  var studyGroupNumTot = req.body.studyGroupNumTot;
  var tagArray = new Array();

  if (typeof(tagName) == 'string') {
    tagArray.push(tagName);
    tagName = tagArray;
  }

  let sql = `update study set title='${title}', textBody='${textBody}', studyGroupNumTotal='${studyGroupNumTot}' where id=${groupId}`;
  let recodes = await dbQuery(sql);

  sql = `update chatroom set title='${title}' where studyId=${groupId}`;
  recodes = await dbQuery(sql);

  sql = `delete from studytag where studyId=${groupId}`;
  recodes = await dbQuery(sql);

  for (var i = 0; i < tagName.length; i++) {
    sql = `insert into studytag(studyId, tagName) values(${groupId}, '${tagName[i]}')`;
    recodes = await dbQuery(sql);
  }

  res.json({
    response: 'success'
  });
});

router.post('/accept', async function(req, res, next) {
  var groupId = req.body.groupId;
  var userId = req.body.userId;
  var date = new Date();

  let sql = `update userstudylist set confirm=1, regDate='${date}' where studyId=${groupId} and userId=${userId}`;
  let recodes = await dbQuery(sql);

  sql = `update study set studyGroupNumCurrent = studyGroupNumCurrent+1 where id=${groupId}`;
  recodes = await dbQuery(sql);

  sql = `select user.token from user where user.id=${userId}`;
  recodes = await dbQuery(sql);
  recodes = recodes.rows;

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      //  databaseURL: "https://asmr-799cf.firebaseio.com"
    });
  }

  var fcm_target_token = recodes[0].token;

  //-----------
  //메세지 작성 부분
  var fcm_message = {
    data: {
      fileno: '1',
      style: 'good',
      title: '신청이 수락되었습니다.', //여기에 알림 목적을 작성
      body: '신청이 수락되었습니다.',
      groupId: groupId
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

  res.json({
    response: 'success'
  });
});

router.post('/reject', async function(req, res, next) {
  var groupId = req.body.groupId;
  var userId = req.body.userId;

  let sql = `delete from userstudylist where studyId=${groupId} and userId=${userId}`;
  let recodes = await dbQuery(sql);

  sql = `select user.token from user where user.id=${userId}`;
  recodes = await dbQuery(sql);
  recodes = recodes.rows;

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      //  databaseURL: "https://asmr-799cf.firebaseio.com"
    });
  }

  var fcm_target_token = recodes[0].token;

  //-----------
  //메세지 작성 부분
  var fcm_message = {
    data: {
      fileno: '1',
      style: 'good',
      title: '신청이 거절되었습니다.', //여기에 알림 목적을 작성
      body: '신청이 거절되었습니다.',
      groupId: groupId+""
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

  res.json({
    response: 'success'
  });
});

router.post('/:studyId/delete', function(req, res, next) {
  res.json({
    response: 'success'
  });
});

module.exports = router;
