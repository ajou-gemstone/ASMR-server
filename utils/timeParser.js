function timeParser() {
  const today = new Date();
  const hours = today.getHours();
  const minutes = today.getMinutes();
  var time = parseFloat(hours + "." + minutes);
  var result;
  time = time + 9;

  if (time >= 7.0 && time <= 7.3) {
    result = 0;
  } else if (time >= 7.3 && time <= 8.0) {
    result = 1;
  } else if (time >= 8.0 && time <= 8.3) {
    result = 2;
  } else if (time >= 8.3 && time <= 9.0) {
    result = 3;
  } else if (time >= 9.0 && time <= 9.3) {
    result = 4;
  } else if (time >= 9.3 && time <= 10.0) {
    result = 5;
  } else if (time >= 10.0 && time <= 10.3) {
    result = 6;
  } else if (time >= 10.3 && time <= 11.0) {
    result = 7;
  } else if (time >= 11.0 && time <= 11.3) {
    result = 8;
  } else if (time >= 11.3 && time <= 12.0) {
    result = 9;
  } else if (time >= 12.0 && time <= 12.3) {
    result = 10;
  } else if (time >= 12.3 && time <= 13.0) {
    result = 11;
  } else if (time >= 13.0 && time <= 13.3) {
    result = 12;
  } else if (time >= 13.3 && time <= 14.0) {
    result = 13;
  } else if (time >= 14.0 && time <= 14.3) {
    result = 14;
  } else if (time >= 14.3 && time <= 15.0) {
    result = 15;
  } else if (time >= 15.0 && time <= 15.3) {
    result = 16;
  } else if (time >= 15.3 && time <= 16.0) {
    result = 17;
  } else if (time >= 16.0 && time <= 16.3) {
    result = 18;
  } else if (time >= 16.3 && time <= 17.0) {
    result = 19;
  } else if (time >= 17.0 && time <= 17.3) {
    result = 20;
  } else if (time >= 17.3 && time <= 18.0) {
    result = 21;
  } else if (time >= 18.0 && time <= 18.3) {
    result = 22;
  } else if (time >= 18.3 && time <= 19.0) {
    result = 23;
  } else if (time >= 19.0 && time <= 19.3) {
    result = 24;
  } else if (time >= 19.3 && time <= 20.0) {
    result = 25;
  } else if (time >= 20.0 && time <= 20.3) {
    result = 26;
  } else if (time >= 20.3 && time <= 21.0) {
    result = 27;
  } else if (time >= 21.0 && time <= 21.3) {
    result = 28;
  } else if (time >= 21.3 && time <= 22.0) {
    result = 29;
  } else {
    result = -1;
  }

  return result;
}

module.exports = timeParser;
