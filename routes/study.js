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

router.get('/list', function(req, res, next) {
  res.send('Success');
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
