function date(date) {
  var year = date.getFullYear();
  var month = date.getMonth()+1;
  var day = date.getDate();

  if((day+"").length<2){
    day = "0" + day;
  }

  year = year.toString();
  month = month.toString();
  day = day.toString();

  return year+month+day;
}

module.exports = date;
