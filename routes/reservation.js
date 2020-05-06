var express = require('express');
var router = express.Router();
var moment = require('moment');
var calculateTime = require('../utils/calculateTime');
var dbQuery = require("../database/promiseQuery.js");
var timeTable = require('../utils/timeTable');

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

  date = date.split('-');
  date = moment([date[0], date[1] - 1, date[2]]).format("YYYY-MM-DD");

  for (var i = 0; i < building.length; i++) {
    let sql = `select lectureRoomId from lectureRoom where buildingName='${building[i]}'`
    queryResult = await dbQuery(sql);
    queryResult = queryResult.rows;

    for (let query of queryResult) {
      lectureRoomArray.push(query.lectureRoomId);
    }
  }

  for (var i = 0; i < building.length; i++) {
    let sql = `SELECT lectureroomdescription.TIME, lectureroomdescription.roomStatus, lectureRoom.lectureRoomId FROM lectureroom, lectureroomdescription WHERE lectureroom.buildingName='${building[i]}' AND lectureroomdescription.date='${date}' AND lectureroom.id=lectureroomdescription.lectureRoomId`
    recodes = await dbQuery(sql);
    recodes = recodes.rows;

    var array = new Array();
    for (var j = 0; j < recodes.length; j++) {
      array.push(recodes[j]['lectureRoomId'])
      reservedRoomArray.push(recodes[j]['lectureRoomId'])
    }

    array = Array.from(new Set(array));

    for (var l = 0; l < array.length; l++) {
      var result = recodes.filter(function(recode) {
        return recode.lectureRoomId == array[l];
      });

      var sortingField = "TIME";

      result.sort(function(a, b) { // 오름차순
        return a[sortingField] - b[sortingField];
      });

      tableList = timeTable(result, date, startTime, lastTime);

      resultList = {
        lectureroom: result[0].lectureRoomId,
        stateList: tableList
      }

      jsonResult.push(resultList);
    }
  }

  reservedRoomArray = Array.from(new Set(reservedRoomArray));
  for(var i=0;i<lectureRoomArray.length;i++){
    if(reservedRoomArray.indexOf(lectureRoomArray[i])==-1){
      for(var j=startTime;j<=lastTime;j++){
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

router.get('/', function(req, res, next) {

});

module.exports = router;
