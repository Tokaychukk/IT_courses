const mysql = require('mysql');
   const connection = mysql.createConnection({
       host: '192.168.174.134',
       user: 'taras',
       password: 'TARAStaras123!!',
       database: 'programmerio'
   });
   connection.connect(err => {
       if (err) {
           console.error(`[${new Date().toISOString()}] DB connection error:`, err);
           return;
       }
       console.log(`[${new Date().toISOString()}] Connected to MySQL`);
   });
   module.exports = connection;
