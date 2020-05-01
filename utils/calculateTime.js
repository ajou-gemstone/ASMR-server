function calculateTime(date, startTime, lastTime) {
  var week = ['일', '월', '화', '수', '목', '금', '토'];
  var dayOfWeek = week[new Date(date).getDay()];

  if (dayOfWeek == '월') {
    startTime = 'A' + startTime;
    lastTime = 'A' + lastTime;
  } else if (dayOfWeek == '화') {
    startTime = 'B' + startTime;
    lastTime = 'B' + lastTime;
  } else if (dayOfWeek == '수') {
    startTime = 'C' + startTime;
    lastTime = 'C' + lastTime;
  } else if (dayOfWeek == '목') {
    startTime = 'D' + startTime;
    lastTime = 'D' + lastTime;
  } else if (dayOfWeek == '금') {
    startTime = 'E' + startTime;
    lastTime = 'E' + lastTime;
  }

  return {
    startTime: startTime,
    lastTime: lastTime
  };
}

module.exports = calculateTime;
