function calculateTime(date, startTime, lastTime) {
  var week = ['일', '월', '화', '수', '목', '금', '토'];
  var dayOfWeek = week[new Date(date).getDay()];
  var day;

  if (dayOfWeek == '월') {
    day = 'A';
  } else if (dayOfWeek == '화') {
    day = 'B';
  } else if (dayOfWeek == '수') {
    day = 'C';
  } else if (dayOfWeek == '목') {
    day = 'D';
  } else if (dayOfWeek == '금') {
    day = 'E';
  } else if (dayOfWeek == '토') {
    day = 'F';
  } else if (dayOfWeek == '일') {
    day = 'G';
  }

  return day;
}

module.exports = calculateTime;
