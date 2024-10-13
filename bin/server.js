#!/usr/bin/env node

var app = require('../app'); // Đảm bảo đường dẫn đúng với app.js
var debug = require('debug')('api2:server');
var http = require('http');
var socketIo = require('socket.io');

/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || '9999');
app.set('port', port);

/**
 * Create HTTP server only if not already listening.
 */
var server = http.createServer(app);

// Kiểm tra server đã listen hay chưa trước khi tạo lại kết nối
if (!server.listening) {
  // Tích hợp socket.io với server
  var io = socketIo(server);

  // Gắn io vào app để sử dụng ở các route khác
  app.set('io', io);

  // Import và sử dụng logic xử lý socket từ file socket.js
  require('./socket')(io);

  server.listen(port);
  server.on('error', onError);
  server.on('listening', onListening);
} else {
  console.log('Server already running on port ' + port);
}

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  debug('Listening on ' + bind);
  console.log('Server is running on port ' + addr.port);
}

module.exports = server;
