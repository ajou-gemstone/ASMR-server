function timeTable(tableList, startTime, lastTime) {
  var week = ['일', '월', '화', '수', '목', '금', '토'];
  var timeTable = [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27
  ];
  var day;

  startTime = parseInt(startTime);
  lastTime = parseInt(lastTime);

  timeTable = timeTable.splice(startTime, lastTime-startTime+1);

  var tableArray = new Array();
  var j = 0;
  var search;
  var resultArray = '';

  for(j=0;j<=lastTime-startTime;j++){
    tableArray.push('A')
  }

  j=0;

  while (1) {
    if (timeTable.indexOf(parseInt(tableList[j]['TIME'])) != -1) {
      search = timeTable.indexOf(parseInt(tableList[j]['TIME']));
      tableArray[search]=tableList[j]['roomStatus'];
      j++;
    }
    else{
      j++;
    }

    if(j>=tableList.length){
      break;
    }
  }

  for(var i=0;i<tableArray.length;i++){
    resultArray += tableArray[i] + ' ';
  }

  return resultArray;
}

module.exports = timeTable;
