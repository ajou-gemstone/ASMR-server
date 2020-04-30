let mysql = require('mysql');
let databaseOption = require('../database/database.js');

function query(sql) {
  let queryPromise;

  var conn = mysql.createConnection(databaseOption);

  conn.connect();

  queryPromise = new Promise(function(res, rej) {
    conn.query(sql, function(err, rows, fields) {
      if (err) {
        rej(err);
        return;
      }

      conn.end();

      let result = {
        rows: rows,
        fields: fields
      }

      res(result);
    });
  });

  return queryPromise;
}

module.exports = query;
