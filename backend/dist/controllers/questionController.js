"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteQuestion = exports.updateQuestion = exports.getQuestionById = exports.getQuestionsByBankId = exports.importQuestions = exports.createQuestion = void 0;
const Question_1 = __importDefault(require("../models/Question"));
const QuestionBank_1 = __importDefault(require("../models/QuestionBank"));
const WrongQuestion_1 = __importDefault(require("../models/WrongQuestion"));
// 创建题目
const createQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type, content, options, answer, explanation, questionBankId } = req.body;
        const userId = req.userId; // 用于验证权限
        // 检查题库是否存在
        const questionBank = yield QuestionBank_1.default.findById(questionBankId);
        if (!questionBank) {
            return res.status(404).json({ message: '题库不存在' });
        }
        // 验证用户是否为题库创建者
        if (questionBank.creator.toString() !== userId) {
            return res.status(403).json({ message: '无权在此题库中添加题目' });
        }
        // 创建新题目
        const question = new Question_1.default({
            type,
            content,
            options,
            answer,
            explanation,
            questionBank: questionBankId
        });
        yield question.save();
        return res.status(201).json(question);
    }
    catch (error) {
        console.error('创建题目错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.createQuestion = createQuestion;
// 批量导入题目
const importQuestions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { questions, questionBankId } = req.body;
        const userId = req.userId; // 用于验证权限
        // 检查题库是否存在
        const questionBank = yield QuestionBank_1.default.findById(questionBankId);
        if (!questionBank) {
            return res.status(404).json({ message: '题库不存在' });
        }
        // 验证用户是否为题库创建者
        if (questionBank.creator.toString() !== userId) {
            return res.status(403).json({ message: '无权在此题库中添加题目' });
        }
        // 准备批量导入的题目
        const questionsToInsert = questions.map((question) => (Object.assign(Object.assign({}, question), { questionBank: questionBankId })));
        // 批量插入题目
        const insertedQuestions = yield Question_1.default.insertMany(questionsToInsert);
        return res.status(201).json({
            message: `成功导入 ${insertedQuestions.length} 道题目`,
            questions: insertedQuestions
        });
    }
    catch (error) {
        console.error('批量导入题目错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.importQuestions = importQuestions;
// 获取题库中的所有题目
const getQuestionsByBankId = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questionBankId = req.params.bankId;
        // 检查题库是否存在
        const questionBank = yield QuestionBank_1.default.findById(questionBankId);
        if (!questionBank) {
            return res.status(404).json({ message: '题库不存在' });
        }
        // 获取题库中的所有题目
        const questions = yield Question_1.default.find({ questionBank: questionBankId })
            .select('-__v');
        return res.status(200).json(questions);
    }
    catch (error) {
        console.error('获取题目错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.getQuestionsByBankId = getQuestionsByBankId;
// 获取题目详情
const getQuestionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questionId = req.params.id;
        const question = yield Question_1.default.findById(questionId)
            .select('-__v');
        if (!question) {
            return res.status(404).json({ message: '题目不存在' });
        }
        return res.status(200).json(question);
    }
    catch (error) {
        console.error('获取题目详情错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.getQuestionById = getQuestionById;
// 更新题目
const updateQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questionId = req.params.id;
        const { type, content, options, answer, explanation } = req.body;
        const userId = req.userId; // 用于验证权限
        // 查找题目及其所属题库
        const question = yield Question_1.default.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: '题目不存在' });
        }
        // 查找题库以验证权限
        const questionBank = yield QuestionBank_1.default.findById(question.questionBank);
        if (!questionBank) {
            return res.status(404).json({ message: '题库不存在' });
        }
        // 验证用户是否为题库创建者
        if (questionBank.creator.toString() !== userId) {
            return res.status(403).json({ message: '无权修改此题目' });
        }
        // 更新题目信息
        question.type = type || question.type;
        question.content = content || question.content;
        question.options = options || question.options;
        question.answer = answer !== undefined ? answer : question.answer;
        question.explanation = explanation !== undefined ? explanation : question.explanation;
        yield question.save();
        return res.status(200).json(question);
    }
    catch (error) {
        console.error('更新题目错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.updateQuestion = updateQuestion;
// 删除题目
const deleteQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questionId = req.params.id;
        const userId = req.userId; // 用于验证权限
        // 查找题目及其所属题库
        const question = yield Question_1.default.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: '题目不存在' });
        }
        // 查找题库以验证权限
        const questionBank = yield QuestionBank_1.default.findById(question.questionBank);
        if (!questionBank) {
            return res.status(404).json({ message: '题库不存在' });
        }
        // 验证用户是否为题库创建者
        if (questionBank.creator.toString() !== userId) {
            return res.status(403).json({ message: '无权删除此题目' });
        }
        // 删除题目
        yield Question_1.default.findByIdAndDelete(questionId);
        // 同时删除相关的错题记录
        yield WrongQuestion_1.default.deleteMany({ question: questionId });
        return res.status(200).json({ message: '题目删除成功' });
    }
    catch (error) {
        console.error('删除题目错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.deleteQuestion = deleteQuestion;
