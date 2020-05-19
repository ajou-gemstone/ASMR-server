var express = require('express');
var router = express.Router();
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

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

/* GET home page. */
router.get('/', function(req, res, next) {

});

module.exports = router;
