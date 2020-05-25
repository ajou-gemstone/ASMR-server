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

// const j = schedule.scheduleJob('00 * * * * *', function(){
//   console.log(new Date());
//   console.log('매 10초에 실행');
// });

var app = express();

app.io = require('socket.io')();

app.io.sockets.on('connection', function(socket) {
  console.log('user connected: ', socket.id);

  var msg;
  var roomname;
  var tmp;

  socket.on('join', function(text) {
    socket.join(text.roomname);
    text.roomnum = parseInt(text.roomnum) + 1;
    app.io.sockets.in(text.roomname).emit('enter', text);
  });

  socket.on('message', function(text) {
    msg = text;
    app.io.sockets.in(text.roomname).emit('receiveMsg', msg);
  });

  socket.on('leave', function(text) {
    socket.leave(text.roomname);
    text.roomnum = parseInt(text.roomnum) - 1;
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
