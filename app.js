var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var studyRouter = require('./routes/study');
var chatRouter = require('./routes/chat');
var lectureRouter = require('./routes/lecture');
var reservationRouter = require('./routes/reservation');
var cafeRouter = require('./routes/cafe');
var userRouter = require('./routes/user');
var timetableRouter = require('./routes/timetable')

const schedule = require('node-schedule');
var dbQuery = require("./database/promiseQuery.js");
var admin = require("firebase-admin");
var serviceAccount = require("./asmr-799cf-firebase-adminsdk-57wam-7a9f28cc26.json");
var evaluateReservation = require('./utils/evaluateReservation');
var evaluateDate = require('./utils/date');
var calculateTime = require('./utils/calculateTime');

const j = schedule.scheduleJob('00 00 * * * *', async function() {
  var date = new Date();
  var year = date.getFullYear();
  var month = date.getMonth() + 1;
  var day = date.getDate();
  var reservationArray = new Array();
  var timeList = new Array();
  var time = new Array();
  var reservationList = new Array();
  var timelist = new Array();
  var lectureroomList = new Array();

  day = parseInt(day) + 1;

  if ((month + "").length < 2) {
    month = "0" + month;
  }

  if ((day + "").length < 2) {
    day = "0" + day;
  }

  year = year.toString();
  month = month.toString();
  day = day.toString();

  date = year + "-" + month + "-" + day;
  date = "2020-06-30";

  let sql = `select reservation.id, reservation.lectureRoomId from reservation, reservationdescription where reservation.id=reservationdescription.reservationId and reservationdescription.date='${date}'`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  if (recodes.length != 0) {
    for (var i = 0; i < recodes.length; i++) {
      lectureroomList.push(recodes[i].lectureRoomId);
    }

    lectureroomList = Array.from(new Set(lectureroomList));

    for (var a = 0; a < lectureroomList.length; a++) {
      reservationArray = [];

      for (var j = 0; j < recodes.length; j++) {
        if(recodes[j].lectureRoomId==lectureroomList[a]){
          reservationArray.push(recodes[j].id);
        }
      }

      reservationArray = Array.from(new Set(reservationArray));

      for (var i = 0; i < reservationArray.length; i++) {
        sql = `select time from reservationdescription where reservationdescription.reservationId=${reservationArray[i]}`;
        let recode = await dbQuery(sql);
        recode = recode.rows;

        for (var j = 0; j < recode.length; j++) {
          timeList.push(recode[j].time);
          time.push(recode[j].time);
        }

        timeList.sort(function(a, b) {
          return a - b;
        });

        reservationList.push({
          id: reservationArray[i],
          startTime: timeList[0],
          lastTime: timeList[timeList.length - 1]
        });
        timeList = [];
      }

      time.sort(function(a, b) {
        return a - b;
      });

      var result = new Array();
      result = evaluateReservation(reservationList, parseInt(time[0]), parseInt(time[time.length - 1]));

      reservationList = [];

      for (var i = 0; i < reservationArray.length; i++) {
        if (result.indexOf(reservationArray[i]) != -1) {
          sql = `update reservation set reservationType='R' where id=${reservationArray[i]}`;
          let query = await dbQuery(sql);

          sql = `select * from lectureroomdescription where reservationId=${reservationArray[i]}`;
          let queryResult = await dbQuery(sql);
          queryResult = queryResult.rows;

          sql = `delete from lectureroomdescription where reservationId=${reservationArray[i]}`;
          query = await dbQuery(sql);

          sql = `select time from reservationdescription where reservationId=${reservationArray[i]}`;
          query = await dbQuery(sql);
          query = query.rows;

          for (var j = 0; j < query.length; j++) {
            timelist.push(query[j].time)
          }

          timelist.sort(function(a, b) {
            return a - b;
          });

          var startTime = parseInt(timelist[0]);
          var lastTime = parseInt(timelist[timelist.length - 1]);
          timelist = [];

          for (var j = startTime; j <= lastTime; j++) {
            sql = `insert into lectureroomdescription (lectureId, lectureRoomId, lectureTime, time, semester, roomStatus, date, day, reservationId) values(0, '${queryResult[0].lectureRoomId}', 0, '${j}', '2020-1', 'R', '${date}', '${queryResult[0].day}', ${reservationArray[i]})`;
            query = await dbQuery(sql);
            query = query.rows;
          }

          sql = `select user.token from user, reservation where reservation.id=${reservationArray[i]} and user.id=reservation.leaderId`;
          query = await dbQuery(sql);
          query = query.rows;

          if (!admin.apps.length) {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              //  databaseURL: "https://asmr-799cf.firebaseio.com"
            });
          }

          var fcm_target_token = query[0].token;

          //-----------
          //메세지 작성 부분
          var fcm_message = {
            data: {
              fileno: '1',
              style: 'good',
              userId: "1",
              title: '새로운 예약 알림입니다', //여기에 알림 목적을 작성
              body: `선지망 후추첨 예약이 확정되었습니다.`
            },
            token: fcm_target_token
          }

          admin.messaging().send(fcm_message)
            .then(function(response) {
              console.log("보내기 성공 메세지" + response);
            }).catch(function(error) {
              console.log('보내기 실패 메세지' + error);
              if (!/already exists/.test(error.message)) {
                console.error('Firebase initialization error raised', error.stack)
              }
            });
        } else {
          sql = `select user.token from user, reservation where reservation.id=${reservationArray[i]} and user.id=reservation.leaderId`;
          let query = await dbQuery(sql);
          query = query.rows;

          if (!admin.apps.length) {
            admin.initializeApp({
              credential: admin.credential.cert(serviceAccount),
              //  databaseURL: "https://asmr-799cf.firebaseio.com"
            });
          }

          var fcm_target_token = query[0].token;

          sql = `delete from lectureroomdescription where reservationId=${reservationArray[i]}`;
          query = await dbQuery(sql);

          sql = `select randomStatus from reservation where id=${reservationArray[i]}`;
          query = await dbQuery(sql);
          query = query.rows;

          var randomStatus = query[0].randomStatus;

          if (randomStatus == 1) {
            sql = `select time, date from reservationdescription where reservationId=${reservationArray[i]}`;
            query = await dbQuery(sql);
            query = query.rows;

            var regDate = query[0].date;
            var regDay = calculateTime(regDate);

            for (var j = 0; j < query.length; j++) {
              timeList.push(query[j].time);
              time.push(query[j].time);
            }

            timeList.sort(function(a, b) {
              return a - b;
            });

            sql = `select id from lectureroom`;
            query = await dbQuery(sql);
            query = query.rows;

            var lectureRoomList = new Array();

            for (var l = 0; l < query.length; l++) {
              lectureRoomList.push(query[l].id);
            }

            var count = 0;
            var selectedLectureRoom;

            for (var l = 0; l < lectureRoomList.length; l++) {
              for (var j = parseInt(timeList[0]); j <= parseInt(timeList[timeList.length - 1]); j++) {
                sql = `select roomStatus from lectureroomdescription where time='${j}' and day='${regDay}' and (date='${date}' or roomStatus='L') and lectureRoomId=${lectureRoomList[l]}`;
                query = await dbQuery(sql);
                query = query.rows;

                if (query.length != 0) {
                  count++;
                }
              }
              if (count == 0) {
                selectedLectureRoom = lectureRoomList[l];
                break;
              }
              count = 0;
            }

            for (var j = parseInt(timeList[0]); j <= parseInt(timeList[timeList.length - 1]); j++) {
              sql = `insert into lectureroomdescription (lectureId, lectureRoomId, lectureTime, time, semester, roomStatus, date, day, reservationId) values(0, '${selectedLectureRoom}', 0, '${j}', '2020-1', 'R', '${date}', '${regDay}', ${reservationArray[i]})`;
              query = await dbQuery(sql);
              query = query.rows;
            }

            sql = `update reservation set lectureRoomId=${selectedLectureRoom}, reservationType='R' where id=${reservationArray[i]}`;
            query = await dbQuery(sql);

            sql = `select lectureRoomId from lectureroom where id=${selectedLectureRoom}`;
            query = await dbQuery(sql);
            query = query.rows;

            if (!admin.apps.length) {
              admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
                //  databaseURL: "https://asmr-799cf.firebaseio.com"
              });
            }

            //-----------
            //메세지 작성 부분
            var fcm_message = {
              data: {
                fileno: '1',
                style: 'good',
                title: '새로운 예약 알림입니다', //여기에 알림 목적을 작성
                body: `예약이 탈락되어 ${query[0].lectureRoomId}으로 다시 예약되었습니다.`
              },
              token: fcm_target_token
            }

            admin.messaging().send(fcm_message)
              .then(function(response) {
                console.log("보내기 성공 메세지" + response);
              }).catch(function(error) {
                console.log('보내기 실패 메세지' + error);
                if (!/already exists/.test(error.message)) {
                  console.error('Firebase initialization error raised', error.stack)
                }
              });
          } else {
            var fcm_message = {
              data: {
                fileno: '1',
                style: 'good',
                title: '새로운 예약 알림입니다', //여기에 알림 목적을 작성
                body: `선지망 후추첨 예약이 탈락되었습니다.`
              },
              token: fcm_target_token
            }

            admin.messaging().send(fcm_message)
              .then(function(response) {
                console.log("보내기 성공 메세지" + response);
              }).catch(function(error) {
                console.log('보내기 실패 메세지' + error);
                if (!/already exists/.test(error.message)) {
                  console.error('Firebase initialization error raised', error.stack)
                }
              });

            sql = `delete from reservation where id=${reservationArray[i]}`;
            query = await dbQuery(sql);
          }
        }
      }
    }
  }
});

var app = express();

app.io = require('socket.io')();

app.io.sockets.on('connection', function(socket) {
  console.log('user connected: ', socket.id);

  var msg;
  var roomname;
  var tmp;

  socket.on('join', async function(text) {
    socket.join(text.roomname);

    text.roomnum = parseInt(text.roomnum) + 1;

    let sql = `update userstudylist set chatNum=0, current=1 where studyId=${text.groupId} and userId=${text.userId}`;
    let recodes = await dbQuery(sql);

    sql = `update chatroom set currentNum=currentNum+1 where studyId=${text.groupId}`;
    recodes = await dbQuery(sql);

    sql = `select currentNum from chatroom where studyId=${text.groupId}`;
    recodes = await dbQuery(sql);
    recodes = recodes.rows;

    text.currentNum = recodes[0].currentNum;

    app.io.sockets.in(text.roomname).emit('enter', text);
  });

  socket.on('message', async function(text) {
    msg = text;

    let sql = `update userstudylist set chatNum=0 where studyId=${text.groupId} and userId=${text.userId}`;
    let recodes = await dbQuery(sql);

    sql = `select chatroom.id, chatroom.title, study.leaderId from chatroom, study where chatroom.studyId=${text.groupId} and study.id=chatroom.studyId`;
    recodes = await dbQuery(sql);
    recodes = recodes.rows;

    sql = `update userstudylist set chatNum=chatNum+1 where studyId=${text.groupId} and userId!=${text.userId}`;
    recode = await dbQuery(sql);

    sql = `select user.token, user.name, userstudylist.chatNum, userstudylist.current from user, userstudylist where user.id=userstudylist.userId and studyId=${text.groupId}`;
    recode = await dbQuery(sql);
    recode = recode.rows;

    for (var i = 0; i < recode.length; i++) {
      if (recode[i].chatNum >= 1 && recode[i].current == 0) {
        if (!admin.apps.length) {
          admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            //  databaseURL: "https://asmr-799cf.firebaseio.com"
          });
        }

        var fcm_target_token = recode[i].token;
        var leaderormember;

        if (leaderormember == recodes[0].leaderId) {
          leaderormember = 1;
        } else {
          leaderormember = 0;
        }
        //-----------
        //메세지 작성 부분
        var fcm_message = {
          data: {
            fileno: '1',
            style: 'good',
            username: recode[0].name,
            leaderormember: leaderormember + "",
            grouptitle: recodes[0].title,
            groupId: text.groupId + "",
            title: '새로운 메시지 알림입니다', //여기에 알림 목적을 작성
            body: `"'${recodes[0].title}'모임"에서 새 메시지가 도착했습니다.`,
          },
          token: fcm_target_token
        }

        admin.messaging().send(fcm_message)
          .then(function(response) {
            console.log("보내기 성공 메세지" + response);
          }).catch(function(error) {
            console.log('보내기 실패 메세지' + error);
            if (!/already exists/.test(error.message)) {
              console.error('Firebase initialization error raised', error.stack)
            }
          });
      }
    }

    app.io.sockets.in(text.roomname).emit('receiveMsg', msg);
  });

  socket.on('leave', async function(text) {
    socket.leave(text.roomname);
    text.roomnum = parseInt(text.roomnum) - 1;

    let sql = `update userstudylist set chatNum=0, current=0 where studyId=${text.groupId} and userId=${text.userId}`;
    let recodes = await dbQuery(sql);

    sql = `update chatroom set currentNum=currentNum-1 where studyId=${text.groupId}`;
    recodes = await dbQuery(sql);

    sql = `select currentNum from chatroom where studyId=${text.groupId}`;
    recodes = await dbQuery(sql);
    recodes = recodes.rows;

    text.currentNum = recodes[0].currentNum;

    app.io.sockets.in(text.roomname).emit('exit', text);
  });

  socket.on('disconnect', function() {
    console.log('user disconnected: ', socket.id);
  })
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/study', studyRouter);
app.use('/chat', chatRouter);
app.use('/lecture', lectureRouter);
app.use('/reservation', reservationRouter);
app.use('/cafe', cafeRouter);
app.use('/user', userRouter);
app.use('/timetable', timetableRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
