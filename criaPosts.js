const mysql = require('mysql');

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "trabalho05"
});

db.connect((err) => {
    if (err) throw err;
    console.log("Conectado!");
    let sql = "CREATE TABLE tb_posts (id INT AUTO_INCREMENT PRIMARY KEY, titulo VARCHAR(255), descricao VARCHAR(255), imagem VARCHAR(255), criadoEm DATETIME)";

    db.query(sql, (err, result) => {
        if (err) throw err;
        console.log("Tabela criada: \n", result);
    });

    db.end();
});