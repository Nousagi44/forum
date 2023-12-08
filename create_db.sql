-- Use the existing database
USE forum_db;

-- Create Users Table (if not exists)
CREATE TABLE IF NOT EXISTS users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Create Topics Table (if not exists)
CREATE TABLE IF NOT EXISTS topics (
    topic_id INT AUTO_INCREMENT PRIMARY KEY,
    topic_name VARCHAR(255) NOT NULL
);

-- Create Memberships Table (if not exists)
CREATE TABLE IF NOT EXISTS memberships (
    membership_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    topic_id INT,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id)
);

-- Create Posts Table (if not exists)
CREATE TABLE IF NOT EXISTS posts (
    post_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    topic_id INT,
    text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (topic_id) REFERENCES topics(topic_id)
);

-- Create User (if not exists)
CREATE USER IF NOT EXISTS 'your-username'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your-password';

-- Grant Privileges
GRANT ALL PRIVILEGES ON forum_db.* TO 'your-username'@'localhost';
