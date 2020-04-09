var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/:studyId', function(req, res, next) {
  res.send('Success');
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
