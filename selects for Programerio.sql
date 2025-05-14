use programmerio;
-- 1. Вибірка популярних курсів, відсортованих за ціною
-- Цей запит відбирає популярні курси (is_popular = 1) і сортує їх за ціною у порядку зростання
SELECT title, price 
FROM courses 
WHERE is_popular = 1 
ORDER BY price ASC;

-- 2. Фільтрація покупок для конкретного користувача
-- Цей запит показує історію покупок для користувача з user_id = 2
SELECT p.purchase_id, c.title, p.purchase_date 
FROM purchase p 
JOIN courses c ON p.course_id = c.courses_id 
WHERE p.user_id = 2;

-- 3. Об’єднання таблиць для аналізу куплених курсів
-- Цей запит об’єднує дані про користувачів, їхні покупки та курси для детального аналізу
SELECT u.first_name, u.last_name, c.title, p.purchase_date 
FROM purchase p 
JOIN users u ON p.user_id = u.user_id 
JOIN courses c ON p.course_id = c.courses_id;

-- 4. Групування покупок за курсами
-- Цей запит підраховує кількість покупок для кожного курсу
SELECT c.title, COUNT(p.purchase_id) as purchase_count 
FROM purchase p 
JOIN courses c ON p.course_id = c.courses_id 
GROUP BY c.title;

-- 5. Користувачі, які купили найдорожчі курси
-- Цей запит відбирає користувачів, які купили курси дорожчі за середню ціну, сортуючи за ціною спаданням
SELECT u.first_name, u.last_name, c.title, c.price 
FROM users u 
JOIN purchase p ON u.user_id = p.user_id 
JOIN courses c ON p.course_id = c.courses_id 
WHERE c.price > (SELECT AVG(price) FROM courses) 
ORDER BY c.price DESC;
