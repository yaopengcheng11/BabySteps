require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

// 1. 定义用户表 SQL (新增)
const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

// 2. 之前的宝宝表 (保持不变，但为了安全加了 IF NOT EXISTS)
const createBabiesTable = `
    CREATE TABLE IF NOT EXISTS babies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        parent_id INT, -- 这里后续会关联到 user.id
        name VARCHAR(100) NOT NULL,
        gender ENUM('boy', 'girl') NOT NULL,
        birth_date DATETIME NOT NULL,
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`;

console.log('⏳ 正在更新数据库结构...');

// 顺序：先建用户表，再建宝宝表
connection.query(createUsersTable, (err) => {
    if (err) {
        console.error('❌ 创建 users 表失败:', err.message);
        process.exit(1);
    }
    console.log('✅ users 表就绪');

    connection.query(createBabiesTable, (err) => {
        if (err) {
            console.error('❌ 创建 babies 表失败:', err.message);
        } else {
            console.log('✅ babies 表就绪');
        }
        console.log('🎉 数据库结构更新完成！');
        connection.end();
    });
});