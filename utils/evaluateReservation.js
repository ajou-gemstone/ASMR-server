function evaluateReservation(reservationList, timeStart, timeLast) {
  function myAlgo(resId, startTime, lastTime) {
    this.resId = resId;
    this.startTime = startTime;
    this.lastTime = lastTime;
    this.priority = 0.0;
    this.probabilityZone = 0.0;
    this.realPriority = 0
    this.stacksTime = 0;
    this.stacksRes = "";
  }

  var arraySize = reservationList.length; //같은 날, 같은 강의실의 예약 수

  var myAlgoArray = Array(arraySize);

  for(var i=0;i<arraySize;i++){
    myAlgoArray[i] = new myAlgo(reservationList[i].id, reservationList[i].startTime, reservationList[i].lastTime);
  }

  timeStart = 0;
  timeLast = 27;

  var seatOfRes = Array(28);

  //문자열로 초기화
  for (var i = 0; i < seatOfRes.length; i++) {
    seatOfRes[i] = "";
  }

  //각각의 예약의 index를 리스트의 startTime ~ lastTime에 해당하는 칸에 넣는다.
  myAlgoArray.forEach(function(m) {
    for (var i = m.startTime; i <= m.lastTime; i++) {
      seatOfRes[i] = seatOfRes[i].concat(myAlgoArray.indexOf(m));
    }
  });

  //다시 순회하면서 예약의 겹치는 시간 수와 겹치는 예약 수를 증가시킨다.
  myAlgoArray.forEach(function(m) {
    for (var i = m.startTime; i <= m.lastTime; i++) {
      m.stacksTime += seatOfRes[i].length; // 겹치는 시간 수 증가
      for (var j = 0; j < seatOfRes[i].length; j++) {
        if (!m.stacksRes.includes(seatOfRes[i].charAt(j))) {
          m.stacksRes = m.stacksRes.concat(seatOfRes[i].charAt(j)); //겹치는 예약 수 증가
        }
      }
    }
  });

  var prioritySum = 0.0;
  //우선 순위를 정해준다. 우선순위(높으면 좋음) = 시간 차지 수 / (겹치는 예약 수 + 겹치는 시간 수)
  myAlgoArray.forEach(function(m) {
    m.priority = (m.lastTime - m.startTime + 1) / (m.stacksTime - (m.lastTime - m.startTime + 1) + m.stacksRes.length);
    //로그를 취하여 편차를 조금 줄여준다.
    m.priority = Math.log(1 + m.priority);
    prioritySum += m.priority;
    m.probabilityZone = prioritySum;
  });

  //0~1사이 값이 되도록 나눠준다.
  myAlgoArray.forEach(function(m) {
    m.probabilityZone = m.probabilityZone / prioritySum;
  });

  //확률적으로 순위를 정한다.
  var currentAssignedNum = 0;
  while (true) {
    var randDouble = Math.random();
    var beforeProbability = 0;
    myAlgoArray.some(function(m) {
      if (beforeProbability <= randDouble && randDouble <= m.probabilityZone) {
        if (m.realPriority == 0) {
          m.realPriority = currentAssignedNum;
          currentAssignedNum++;
          //강의실의 시간대를 선점을 한다.
          return true;
        }
      } else {
        beforeProbability = m.probabilityZone;
      }
    });
    //모든 순위가 정해질 때까지 계속 랜덤변수를 생성한다.
    if (currentAssignedNum == myAlgoArray.length)
      break;
  }

  var realSeatOfRes = Array(28);
  var reservations = new Array();

  for (var i = 0; i < realSeatOfRes.length; i++) {
    realSeatOfRes[i] = false;
  }

  for (var i = 0; i < arraySize; i++) {
    myAlgoArray.forEach(function(m) {
      if (m.realPriority == i) {
        if (realSeatOfRes.slice(m.startTime, m.lastTime + 1).includes(true)) {
          //do nothing
        } else {
          for (var j = m.startTime; j <= m.lastTime; j++) {
            realSeatOfRes[j] = true;
          }
          reservations.push(m.resId);
        }
      }
    });
  }

  return reservations
}

module.exports = evaluateReservation;
