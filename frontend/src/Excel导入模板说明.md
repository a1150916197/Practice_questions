# Excel题目导入模板说明

使用Excel导入题目时，请按照以下格式准备您的文件：

## 必填列

- **content**：题目内容 (也可以使用 `title` 列名)
- **type**：题目类型，必须是以下值之一：
  - `single` - 单选题
  - `multiple` - 多选题
  - `tf` - 判断题

## 选项相关列 (适用于单选题和多选题)

- **option1, option2, option3...** - 选项内容
- **isCorrect1, isCorrect2, isCorrect3...** - 对应选项是否为正确答案
  - 可以使用 `true`/`false` 或 `"true"`/`"false"` 表示

## 判断题答案

- **correctAnswer** - 判断题的答案
  - 可以使用 `true`/`false` 或 `"true"`/`"false"` 表示
  - 也可以使用 `"对"`/`"错"` 或 `"正确"`/`"错误"` 表示

## 可选列

- **explanation** - 题目解析

## 示例数据

下面是各类型题目的Excel格式示例：

### 单选题
| content | type | option1 | option2 | option3 | option4 | isCorrect1 | isCorrect2 | isCorrect3 | isCorrect4 | explanation |
|---------|------|---------|---------|---------|---------|------------|------------|------------|------------|-------------|
| TCP协议属于OSI模型中的哪一层? | single | 应用层 | 表示层 | 会话层 | 传输层 | false | false | false | true | TCP协议属于OSI七层参考模型中的传输层。 |

### 多选题
| content | type | option1 | option2 | option3 | option4 | option5 | isCorrect1 | isCorrect2 | isCorrect3 | isCorrect4 | isCorrect5 | explanation |
|---------|------|---------|---------|---------|---------|---------|------------|------------|------------|------------|------------|-------------|
| 以下哪些是NoSQL数据库系统? | multiple | MongoDB | MySQL | Redis | PostgreSQL | Cassandra | true | false | true | false | true | MongoDB是文档型数据库，Redis是键值对存储数据库，Cassandra是列式数据库，都属于NoSQL系统。 |

### 判断题
| content | type | correctAnswer | explanation |
|---------|------|---------------|-------------|
| HTTP是一个无状态协议 | tf | true | HTTP协议本身是无状态的，这意味着每个请求都是独立的。 |

## 注意事项

1. Excel文件中可以包含多个工作表，但只会处理第一个工作表中的数据
2. 列名称区分大小写，请确保与上述示例完全一致
3. 每行数据必须包含题目内容(content)和题目类型(type)
4. 系统会自动忽略空行
5. 如果Excel文件中含有格式错误的行，这些行将被跳过 