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
exports.batchImportQuestions = exports.deleteQuestionBank = exports.updateQuestionBank = exports.getQuestionBankById = exports.getUserQuestionBanks = exports.getPublicQuestionBanks = exports.createQuestionBank = void 0;
const QuestionBank_1 = __importDefault(require("../models/QuestionBank"));
const Question_1 = __importDefault(require("../models/Question"));
// 创建题库
const createQuestionBank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description, isPublic } = req.body;
        const userId = req.userId; // 从请求中获取用户ID
        const questionBank = new QuestionBank_1.default({
            name,
            description,
            isPublic,
            creator: userId
        });
        yield questionBank.save();
        return res.status(201).json(questionBank);
    }
    catch (error) {
        console.error('创建题库错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.createQuestionBank = createQuestionBank;
// 获取所有公开题库
const getPublicQuestionBanks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questionBanks = yield QuestionBank_1.default.find({ isPublic: true })
            .populate('creator', 'name')
            .select('-__v');
        return res.status(200).json(questionBanks);
    }
    catch (error) {
        console.error('获取公开题库错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.getPublicQuestionBanks = getPublicQuestionBanks;
// 获取用户创建的题库
const getUserQuestionBanks = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        const questionBanks = yield QuestionBank_1.default.find({ creator: userId })
            .populate('creator', 'name')
            .select('-__v');
        return res.status(200).json(questionBanks);
    }
    catch (error) {
        console.error('获取用户题库错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.getUserQuestionBanks = getUserQuestionBanks;
// 获取题库详情
const getQuestionBankById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questionBankId = req.params.id;
        const questionBank = yield QuestionBank_1.default.findById(questionBankId)
            .populate('creator', 'name')
            .select('-__v');
        if (!questionBank) {
            return res.status(404).json({ message: '题库不存在' });
        }
        return res.status(200).json(questionBank);
    }
    catch (error) {
        console.error('获取题库详情错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.getQuestionBankById = getQuestionBankById;
// 更新题库
const updateQuestionBank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questionBankId = req.params.id;
        const { name, description, isPublic } = req.body;
        const userId = req.userId; // 用于验证权限
        // 查找题库
        const questionBank = yield QuestionBank_1.default.findById(questionBankId);
        if (!questionBank) {
            return res.status(404).json({ message: '题库不存在' });
        }
        // 验证用户是否为题库创建者
        if (questionBank.creator.toString() !== userId) {
            return res.status(403).json({ message: '无权修改此题库' });
        }
        // 更新题库信息
        questionBank.name = name || questionBank.name;
        questionBank.description = description !== undefined ? description : questionBank.description;
        questionBank.isPublic = isPublic !== undefined ? isPublic : questionBank.isPublic;
        yield questionBank.save();
        return res.status(200).json(questionBank);
    }
    catch (error) {
        console.error('更新题库错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.updateQuestionBank = updateQuestionBank;
// 删除题库
const deleteQuestionBank = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const questionBankId = req.params.id;
        const userId = req.userId; // 用于验证权限
        // 查找题库
        const questionBank = yield QuestionBank_1.default.findById(questionBankId);
        if (!questionBank) {
            return res.status(404).json({ message: '题库不存在' });
        }
        // 验证用户是否为题库创建者
        if (questionBank.creator.toString() !== userId) {
            return res.status(403).json({ message: '无权删除此题库' });
        }
        // 先删除题库中的所有题目
        yield Question_1.default.deleteMany({ questionBank: questionBankId });
        // 然后删除题库
        yield QuestionBank_1.default.findByIdAndDelete(questionBankId);
        return res.status(200).json({ message: '题库删除成功' });
    }
    catch (error) {
        console.error('删除题库错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.deleteQuestionBank = deleteQuestionBank;
// 批量导入题目到题库
const batchImportQuestions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const bankId = req.params.id;
        const { questions } = req.body;
        const userId = req.userId; // 用于验证权限
        // 检查题库是否存在
        const questionBank = yield QuestionBank_1.default.findById(bankId);
        if (!questionBank) {
            return res.status(404).json({ message: '题库不存在' });
        }
        // 验证用户是否为题库创建者
        if (questionBank.creator.toString() !== userId) {
            return res.status(403).json({ message: '无权在此题库中添加题目' });
        }
        if (!Array.isArray(questions) || questions.length === 0) {
            return res.status(400).json({ message: '请提供有效的题目数据' });
        }
        // 准备批量导入的题目
        const questionsToInsert = questions.map(question => (Object.assign(Object.assign({}, question), { questionBank: bankId })));
        // 批量插入题目
        const insertedQuestions = yield Question_1.default.insertMany(questionsToInsert);
        // 更新题库的题目数量
        questionBank.questionCount = (questionBank.questionCount || 0) + insertedQuestions.length;
        yield questionBank.save();
        return res.status(201).json({
            message: `成功导入 ${insertedQuestions.length} 道题目`,
            importedCount: insertedQuestions.length,
            questions: insertedQuestions
        });
    }
    catch (error) {
        console.error('批量导入题目错误:', error);
        return res.status(500).json({ message: '服务器错误', error: error.message });
    }
});
exports.batchImportQuestions = batchImportQuestions;
