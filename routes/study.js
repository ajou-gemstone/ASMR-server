var express = require('express');
var router = express.Router();
var dbQuery = require("../database/promiseQuery.js");

/* GET home page. */
router.get('/', async function(req, res, next) {
  var groupId = req.query.groupId;
  var userList = new Array();

  let sql = `select title, textBody, studyGroupNumTotal, studyGroupNumCurrent, leaderId from study where id=${groupId}`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  sql = 'select tagName from studytag ';
  sql += `where studyId in (select studyId from studyTag where studyId = ${groupId})`;
  let queryResult = await dbQuery(sql);
  recodes[0].tagName = queryResult.rows;

  sql = `select userId from userstudylist where studyId = ${groupId}`;
  queryResult = await dbQuery(sql);
  queryResult = queryResult.rows;

  for (var i = 0; i < queryResult.length; i++) {
    sql = `select name from user where id = ${queryResult[i].userId}`;
    query = await dbQuery(sql);
    query = query.rows;

    if (queryResult[i].userId == recodes[0].leaderId) {
      userList.push({
        userId: queryResult[i].userId,
        name: query[0].name,
        leader: 1
      });
    }
    else{
      userList.push({
        userId: queryResult[i].userId,
        name: query[0].name,
        leader: 0
      });
    }
  }
  recodes[0].userList = userList;

  delete recodes[0].leaderId;

  res.json(recodes[0]);
});

router.get('/list', async function(req, res, next) {
  let sql = 'select id, category, studyGroupNumTotal, studyGroupNumCurrent, imageUri from study';
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

router.get('/myLecture', function(req, res, next) {
  res.send('Success');
});

router.get('/myStudy', function(req, res, next) {
  res.send('Success');
});

router.post('/create', async function(req, res, next) {
  var leaderId = req.body.leaderId;
  var name = req.body.name;
  var category = req.body.category;
  var title = req.body.title;
  var textBody = req.body.textBody;
  var tagName = req.body.tagName;
  var studyGroupNumTot = req.body.studyGroupNumTot;
  var num;

  let sql = `select count(*) as num from study`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  num = recodes[0].num;
  num += 1;

  sql = `insert into study(id, name, category, title, textBody, classCode, studyGroupNumTotal, studyGroupNumCurrent, imageUri, leaderId) values(${num}, '${name}', '${title}', '${textBody}', 0, '${studyGroupNumTot}', 0, null, ${leaderId})`;
  recodes = await dbQuery(sql);

  for(var i=0;i<tagName.length;i++){
    sql = `insert into studytag(studyId, tagName) values(${num}, '${tagName[i]}')`;
    recodes = await dbQuery(sql);
  }

  res.json({
    response: 'success'
  });
});

router.post('/register', async function(req, res, next) {
  var groupId = req.body.groupId;
  var userId = req.body.userId;

  let sql = `insert into userstudylist(studyId, userId) values(${groupId}, ${userId})`;
  let recodes = await dbQuery(sql);

  sql = `update study set studyGroupNumCurrent = studyGroupNumCurrent+1 where id=${groupId}`;
  let recodes = await dbQuery(sql);

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
