const express = require('express');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const session = require('express-session');
const app = express();
const port = 8000;

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'your-username',
    password: 'your-password',
    database: 'forum_db',
    insecureAuth: true,
});

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
}));

const checkLoggedIn = (req, res, next) => {
    if (req.session.userId) {
        next();
    } else {
        res.redirect('/login');
    }
};

const navLinks = [
    { path: '/', text: 'Home' },
    { path: '/about', text: 'About' },
    { path: '/posts', text: 'Posts' },
    { path: '/add-post', text: 'Add Post', loggedIn: true },
    { path: '/register', text: 'Register', loggedOut: true },
    { path: '/login', text: 'Login', loggedOut: true },
    { path: '/logout', text: 'Logout', loggedIn: true }
];

app.use((req, res, next) => {
    res.locals.navLinks = navLinks.map(link => ({ ...link, active: req.path === link.path }));
    res.locals.user = req.session.user;
    res.locals.userId = req.session.userId;
    next();
});

app.get('/', (req, res) => {
    if (req.session.userId) {
        connection.query(
            'SELECT posts.*, users.username, topics.topic_name AS topic_title ' +
            'FROM posts ' +
            'JOIN users ON posts.user_id = users.user_id ' +
            'JOIN topics ON posts.topic_id = topics.topic_id ' +
            'WHERE posts.user_id = ? ' +
            'ORDER BY posts.created_at DESC ' +
            'LIMIT 1',
            [req.session.userId],
            (error, results) => {
                if (error) throw error;
                res.render('index', { userPost: results[0] });
            }
        );
    } else {
        // If the user is not logged in, pass an empty object to userPost
        res.render('index', { userPost: {} });
    }
});


app.get('/add-post', checkLoggedIn, (req, res) => {
    connection.query('SELECT * FROM topics', (error, topics) => {
        if (error) {
            console.error('Error getting topics:', error);
            return res.status(500).send('Internal Server Error');
        }

        // Render the add-post template with the topics array
        res.render('add-post', { topics });
    });
});


app.post('/add-post', checkLoggedIn, (req, res) => {
    const { text, topicId } = req.body;
    const userId = req.session.userId;

    console.log('Received post request:', { userId, text, topicId });

    if (!userId || !text || !topicId) {
        console.error('Invalid post data. Missing required fields.');
        return res.status(400).send('Invalid post data. Missing required fields.');
    }

    connection.query(
        'INSERT INTO posts (user_id, text, topic_id) VALUES (?, ?, ?)',
        [userId, text, topicId],
        (error, results) => {
            if (error) {
                console.error('Error inserting post:', error);
                return res.status(500).send('Internal Server Error');
            }
            console.log('Post inserted successfully:', results);

            res.redirect('/posts');
        }
    );
});


app.get('/profile', checkLoggedIn, (req, res) => {
    res.render('profile', { user: { username: req.session.user, userId: req.session.userId } });
});
app.get('/posts', checkLoggedIn, (req, res) => {
    connection.query(
        'SELECT posts.*, users.username, topics.topic_name AS topic_title ' +
        'FROM posts ' +
        'JOIN users ON posts.user_id = users.user_id ' +
        'JOIN topics ON posts.topic_id = topics.topic_id ' +
        'ORDER BY posts.created_at DESC',
        async (error, results) => {
            if (error) {
                console.error(error);
                throw error;
            }

            console.log(results);

            res.render('posts', { posts: results });
        }
    );
});


app.get('/clear-posts', (req, res) => {
    res.render('clear-posts'); 
});


app.post('/clear-posts', (req, res) => {
    connection.query('DELETE FROM posts', (error, results) => {
        if (error) {
            console.error('Error clearing posts:', error);
            res.status(500).send('Internal Server Error');
        } else {
            console.log('All posts cleared successfully.');
            res.redirect('/posts');
        }
    });
});
app.get('/about', (req, res) => {
    res.render('about');
});
app.get('/register', (req, res) => {
    res.render('register');
  });
  

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) throw err;

        connection.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], (error, results) => {
            if (error) throw error;

            res.redirect('/login');
        });
    });
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    connection.query('SELECT * FROM users WHERE username = ?', [username], (error, results) => {
        if (error) throw error;

        if (results.length > 0) {
            const user = results[0];

            bcrypt.compare(password, user.password, (err, result) => {
                if (err) throw err;

                if (result) {
                    req.session.userId = user.user_id;
                    req.session.user = user.username;

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

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) throw err;
        res.redirect('/');
    });
});

app.get('/add-post', checkLoggedIn, (req, res) => {
    res.render('add-post');
});

app.post('/add-post', checkLoggedIn, (req, res) => {
    const { text, topicId } = req.body;
    const userId = req.session.userId;

    console.log('Received post request:', { userId, text, topicId });

    connection.query(
        'INSERT INTO posts (user_id, text, topic_id) VALUES (?, ?, ?)',
        [userId, text, topicId],
        (error, results) => {
            if (error) {
                console.error('Error inserting post:', error);
                throw error;
            }
            console.log('Post inserted successfully:', results);

            res.redirect('/posts');
        }
    );
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
