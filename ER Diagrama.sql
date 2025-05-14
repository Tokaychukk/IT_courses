CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
    email VARCHAR(25) UNIQUE NOT NULL,
    password VARCHAR(25) NOT NULL,
    role TEXT NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    created_at DATETIME,
    phone_name VARCHAR(50)  -- Змінено з INTEGER(50) на VARCHAR, бо телефон — це текст
);

CREATE TABLE categories (
    categories_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
    name VARCHAR(100) UNIQUE NOT NULL,  -- Змінено з INTEGER(100) на VARCHAR(100)
    description TEXT
);

CREATE TABLE courses (
    courses_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INT,
    price DECIMAL(10, 2),
    external_link VARCHAR(255),
    is_popular BOOLEAN,
    FOREIGN KEY (category_id) REFERENCES categories(categories_id)
);

CREATE TABLE purchase (
    purchase_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
    user_id INT,
    course_id INT,
    purchase_date TIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (course_id) REFERENCES courses(courses_id)
);

CREATE TABLE support (
    support_id INT PRIMARY KEY AUTO_INCREMENT UNIQUE,
    user_id INT,
    email VARCHAR(25),
    message TEXT,
    created_at TIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
