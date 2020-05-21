var express = require('express');
var router = express.Router();
var dbQuery = require("../database/promiseQuery.js");

/* GET home page. */
router.get('/list', async function(req, res, next) {
  let sql = `select id as cafeId, name, congestion, latitude, longitude, cafeBody from cafe`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  res.json(recodes);
});

module.exports = router;
