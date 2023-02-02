var express = require('express');
var session = require('express-session');
var formidable = require('formidable');
var mysql = require('mysql');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var path = require('path');
var fs = require('fs');
var saltRounds = 10;
var app = express();

app.use(session({
    secret: 'abcdefghijklmnopqrstuvxz',
    resave: false,
    saveUninitialized: true,
}));

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static('public'));

var db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'trabalho05',
});

db.connect(function (err) {
    if (err) throw err;
});

/* Autenticação do usuário:  */
app.get('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) throw err;
    });
    res.redirect('/login');
});

app.get('/login', function (req, res) {
    res.render('login.ejs', { error: '' });
});

app.post('/login', function (req, res) {
    var email = req.body.email;
    var senha = req.body.senha;
    var sql = 'SELECT * FROM tb_usuarios WHERE email = ?';
    db.query(sql, [email], (err, result) => {
        if (err) throw err;
        if (result.length > 0) {
            bcrypt.compare(senha, result[0].senha, (err, result) => {
                if (err) throw err;
                if (result) {
                    req.session.logado = true;
                    res.redirect('/');
                } else {
                    res.redirect('/login');
                }
            });
        } else {
            res.redirect('/login');
        }
    });
});

app.get('/register', function (req, res) {
    res.render('cadastro.ejs');
});

app.post('/register', function (req, res) {
    var nome = req.body.nome;
    var email = req.body.email;
    var senha = req.body.senha;
    bcrypt.hash(senha, saltRounds, (err, hash) => {
        if (err) throw err;
        var sql = 'INSERT INTO tb_usuarios (nome, email, senha) VALUES ?';
        var values = [
            [nome, email, hash],
        ];
        db.query(sql, [values], (err) => {
            if (err) throw err;
        });
    });
    res.redirect('/login');
});

/* 
CRUD (Create, read, update e delete) 

1) Create (registrar, adicionar dados) 
*/
app.get('/create', function (req, res) {
    if (req.session.logado) {
        res.render('criar.ejs', { posts: [] });
    } else {
        res.render('login.ejs', {
            error: 'voce precisa estar logado para criar um post'
        })
    }
});

app.post('/create', function (req, res) {
    var form = new formidable.IncomingForm();

    form.parse(req, (err, fields, files) => {
        // pega o local onde o arquivo foi salvo, renomeia e move para a pasta public/imagens
        var oldpath = files.imagem.filepath;
        var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        var nomeimg = hash + '.' + files.imagem.mimetype.split('/')[1];
        var newpath = path.join(__dirname, 'public/imagens/', nomeimg);

        // renomeia e move o arquivo
        fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
        });

        // insere os dados no banco de dados
        var sql = "INSERT INTO tb_posts (titulo, descricao, imagem, criadoEm) VALUES ?";
        var values = [
            [fields.titulo, fields.descricao, nomeimg, new Date()]
        ];

        db.query(sql, [values], function (err) {
            if (err) throw err;
        });
    });
    res.redirect('/');
});

/* Read (ler dados) */
app.get('/', function (req, res) {
    // verifica se o usuário está logado
    if (req.session.logado) {
        // se estiver logado, exibe os posts
        var sql = 'SELECT * FROM tb_posts';
        db.query(sql, (err, result) => {
            if (err) throw err;
            res.render('exibir.ejs', { posts: result });
        });
    } else {
        res.render('login.ejs', {
            error: 'Você precisa estar logado para entrar no sistema'
        })
    }
});

/* Update (atualizar) */
app.get('/edit/:id', function (req, res) {
    if (req.session.logado) {
        var sql = 'SELECT * FROM tb_posts WHERE id = ?';
        var id = req.params.id;
        db.query(sql, id, (err, result) => {
            if (err) throw err;
            res.render('editar.ejs', { posts: result });
        });
    } else {
        res.render('login.ejs', {
            error: 'Você precisa estar logado para editar um post'
        })
    }
});

app.post('/edit/:id', (req, res) => {
    var form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) throw err;
        var id = req.params.id;

        var sql = 'SELECT * FROM tb_posts WHERE id = ?';

        // deleta a imagem antiga
        db.query(sql, id, (err, result) => {
            if (err) throw err;
            var existingPost = result[0];
            var img = path.join(__dirname, 'public/imagens/', existingPost.imagem)
            fs.unlink(img, (err) => {
                if (err) throw err;
            });
        });

        var oldpath = files.imagem.filepath;
        var hash = crypto.createHash('md5').update(Date.now().toString()).digest('hex');
        var nomeimg = hash + '.' + files.imagem.mimetype.split('/')[1];
        var newpath = path.join(__dirname, 'public/imagens/', nomeimg);

        // renomeia e move o arquivo novo para a pasta public/imagens
        fs.rename(oldpath, newpath, function (err) {
            if (err) throw err;
        });

        // atualiza os dados no banco de dados
        var sql = 'UPDATE tb_posts SET titulo = ?, descricao = ?, imagem = ? WHERE id = ?';
        var values = [fields.titulo, fields.descricao, nomeimg, id];

        db.query(sql, values, (err) => {
            if (err) throw err;
        });
        res.redirect('/');
    });
});


/* Delete (apaga os dados) */
app.get('/delete/:id', function (req, res) {
    if (req.session.logado) {
        var id = req.params.id;
        var sql = 'DELETE FROM tb_posts WHERE id = ?';
        db.query(sql, id, (err) => {
            if (err) throw err;
        });
        res.redirect('/');
    } else {
        res.redirect('/login');
    }
});

/* Inicia o servidor */
app.listen(3000, function () {
    console.log('Servidor rodando na porta 3000');
});
