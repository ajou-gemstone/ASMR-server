var express = require('express');
var router = express.Router();
var dbQuery = require("../database/promiseQuery.js");

/* GET home page. */
router.post('/', async function(req, res, next) {
  console.log(req.body.id);
  console.log(req.body.pw);
  let queryResult = await dbQuery('select * from study');
  console.log('success');
  res.json(queryResult.rows[0]);
});

router.get('/list', async function(req, res, next) {
  let sql = 'select id, category, title, studyGroupNumTotal, studyGroupNumCurrent, imageUri from study'
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

router.post('/create', function(req, res, next) {
  res.send('Success');
});

router.post('/:studyId/update', function(req, res, next) {
  res.send('Success');
});

router.post('/:studyId/delete', function(req, res, next) {
  res.send('Success');
});

module.exports = router;
