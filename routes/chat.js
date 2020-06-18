var express = require('express');
var router = express.Router();
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dbQuery = require("../database/promiseQuery.js");
var admin = require("firebase-admin");
var serviceAccount = require("../asmr-799cf-firebase-adminsdk-57wam-7a9f28cc26.json");
var moment = require('moment');

/* GET home page. */
router.get('/get', async function(req, res, next) {
  var groupId = req.query.groupId;
  var userId = req.query.userId;

  var chatting = [];

  let sql = `select chatroomdetail.textBody as message, chatroomdetail.userId, chatroomdetail.regDate from chatroom, chatroomdetail where chatroom.id=chatroomdetail.chatRoomId and chatroom.studyId=${groupId}`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  sql = `select leaderId from study where id=${groupId}`;
  let recode = await dbQuery(sql);
  recode = recode.rows;

  sql = `select regDate from userstudylist where studyId=${groupId} and userId=${userId}`;
  let queryResult = await dbQuery(sql);
  queryResult = queryResult.rows;

  for (var i = 0; i < recodes.length; i++) {
    sql = `select name from user where id=${recodes[i].userId}`;
    let query = await dbQuery(sql);
    query = query.rows;

    if (recodes[i].userId == recode[0].leaderId) {
      recodes[i].leader = 1;
      recodes[i].name = query[0].name;
    } else {
      recodes[i].leader = 0;
      recodes[i].name = query[0].name;
    }
  }

  for (var i = 0; i < recodes.length; i++) {
    var current = moment(recodes[i].regDate).format();
    var regDate = moment(queryResult[0].regDate).format();

    if(current>=regDate){
      chatting.push(recodes[i])
    }
  }

  res.json(
    chatting
  );
});

router.post('/post', async function(req, res, next) {
  var groupId = req.body.groupId;
  var userId = req.body.userId;
  var message = req.body.message;

  var date = new Date();

  let sql = `select id, title from chatroom where studyId=${groupId}`;
  let recodes = await dbQuery(sql);
  recodes = recodes.rows;

  sql = `insert into chatroomdetail(chatRoomId, textBody, userId, regDate) values(${recodes[0].id}, '${message}', ${userId}, '${date}')`;
  let recode = await dbQuery(sql);

  res.json({
    response: 'success'
  });
});

// io.sockets.on('connection', function(socket) {
//   console.log('user connected: ', socket.id);
//
//   var msg;
//   var roomname;
//   var tmp;
//
//   socket.on('join', function(text) {
//     socket.join(text.roomname);
//     connection.query('SELECT * from chattingRoomInfo', function(err, rows, fields) {
//       if (!err) {
//         for (var i = 0; i < rows.length; i++) {
//           if (rows[i].title == text.roomname) {
//             tmp = rows[i].roomnum;
//             console.log(tmp);
//             connection.query('UPDATE chattingRoomInfo SET roomnum=? WHERE title=?', [tmp + 1, text.roomname], function(err, rows, fields) {
//               if (!err) {
//                 console.log('Chatting Room Entered');
//               } else
//                 console.log('Error while performing Query.', err);
//             });
//           }
//         }
//       } else
//         console.log('Error while performing Query.', err);
//     });
//
//     io.sockets.in(text.roomname).emit('enter', text);
//   });
//
//   socket.on('message', function(text) {
//     msg = text;
//     console.log(text.key);
//
//     connection.query('Insert into chattingList(title, chatting, userkey, emotion) values(?, ?, ?, ?)', [text.roomname, text.message, text.key, text.profile], function(err, rows1, fields) { //id정보로 채팅방 찾는 기능 추가
//       if (!err) {
//
//       } else
//         console.log('Error while performing Query.', err);
//     });
//
//     roomname = text.roomname;
//     io.sockets.in(text.roomname).emit('receiveMsg', msg);
//   });
//
//   socket.on('leave', function(text) {
//     socket.leave(text.roomname);
//     connection.query('SELECT * from chattingRoomInfo', function(err, rows, fields) {
//       if (!err) {
//         for (var i = 0; i < rows.length; i++) {
//           if (rows[i].title == text.roomname) {
//             tmp = rows[i].roomnum;
//             connection.query('UPDATE chattingRoomInfo SET roomnum=? WHERE title=?', [tmp - 1, text.roomname], function(err, rows, fields) {
//               if (!err) {
//                 console.log('Chatting Room Exit');
//                 text.roomnum = tmp - 1;
//               } else
//                 console.log('Error while performing Query.', err);
//             });
//           }
//         }
//       } else
//         console.log('Error while performing Query.', err);
//     });
//     console.log(text);
//     io.sockets.in(text.roomname).emit('exit', text);
//   })
//
//   socket.on('disconnect', function() {
//     console.log('user disconnected: ', socket.id);
//   })
// });

module.exports = router;
