const mysql = require('mysql');

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
});

db.connect((err) => {
    if (err) throw err;
    console.log('base de dados conectada');

    let sql = "CREATE DATABASE trabalho05"

    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log('Base de dados criada: ', result);
    });

    db.end();
});