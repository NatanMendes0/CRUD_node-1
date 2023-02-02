const mysql = require('mysql');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "trabalho05"
});

db.connect(function (err) {
    if (err) throw err;
    console.log("Conectado!");
    let sql = "CREATE TABLE tb_usuarios (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(255), email VARCHAR(255), senha VARCHAR(255))";

    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log("Tabela criada: ", result);
    });
    
    db.end();
});