/**
 * MongoDB初始化脚本
 * 为常用查询创建索引，优化查询性能
 */

// 选择数据库
db = db.getSiblingDB('teacher-exam');

// 创建集合（如果不存在）
db.createCollection('users');
db.createCollection('questionbanks');
db.createCollection('questions');
db.createCollection('wrongquestions');

// 用户集合索引
db.users.createIndex({ "name": 1 }, { background: true });

// 题库集合索引
db.questionbanks.createIndex({ "creator": 1 }, { background: true });
db.questionbanks.createIndex({ "isPublic": 1 }, { background: true });
db.questionbanks.createIndex({ "creator": 1, "isPublic": 1 }, { background: true });

// 题目集合索引
db.questions.createIndex({ "questionBank": 1 }, { background: true });
db.questions.createIndex({ "type": 1 }, { background: true });
db.questions.createIndex({ "questionBank": 1, "type": 1 }, { background: true });

// 错题集合索引
db.wrongquestions.createIndex({ "user": 1 }, { background: true });
db.wrongquestions.createIndex({ "question": 1 }, { background: true });
db.wrongquestions.createIndex({ "user": 1, "question": 1 }, { background: true, unique: true });
db.wrongquestions.createIndex({ "createdAt": 1 }, { background: true });

// 添加过期索引以自动清理旧的错题
db.wrongquestions.createIndex({ "createdAt": 1 }, { 
  background: true, 
  expireAfterSeconds: 60 * 60 * 24 * 180  // 保留180天的错题
});

print('MongoDB教师编制备考答题系统索引初始化完成');

// 如果需要，可以在这里创建初始管理员用户
db.users.insertOne({
  name: "管理员",
  role: "admin",
  createdAt: new Date()
});

print('管理员用户创建完成'); 