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
exports.getWrongQuestionStats = exports.removeWrongQuestion = exports.getUserWrongQuestions = exports.addWrongQuestion = void 0;
const WrongQuestion_1 = __importDefault(require("../models/WrongQuestion"));
const Question_1 = __importDefault(require("../models/Question"));
const QuestionBank_1 = __importDefault(require("../models/QuestionBank"));
const mongoose_1 = __importDefault(require("mongoose"));
// 添加错题
const addWrongQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { questionId, wrongAnswer } = req.body;
        const userId = req.userId;
        // 检查题目是否存在
        const question = yield Question_1.default.findById(questionId);
        if (!question) {
            return res.status(404).json({ message: '题目不存在' });
        }
        // 查找是否已存在该用户的该错题记录
        let wrongQuestion = yield WrongQuestion_1.default.findOne({
            user: userId,
            question: questionId
        });
        if (wrongQuestion) {
            // 如果已存在，更新错误答案和时间戳
            wrongQuestion.wrongAnswer = wrongAnswer;
            wrongQuestion.timestamp = new Date();
            yield wrongQuestion.save();
        }
        else {
            // 如果不存在，创建新记录
            wrongQuestion = new WrongQuestion_1.default({
                user: userId,
                question: questionId,
                wrongAnswer
            });
            yield wrongQuestion.save();
        }
        return res.status(201).json(wrongQuestion);
    }
    catch (error) {
        console.error('添加错题错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.addWrongQuestion = addWrongQuestion;
// 获取用户的错题列表
const getUserWrongQuestions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        // 查找用户的所有错题记录
        const wrongQuestions = yield WrongQuestion_1.default.find({ user: userId })
            .populate({
            path: 'question',
            select: '-__v'
        })
            .select('-__v')
            .sort({ timestamp: -1 }); // 按时间倒序排列
        return res.status(200).json(wrongQuestions);
    }
    catch (error) {
        console.error('获取错题列表错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.getUserWrongQuestions = getUserWrongQuestions;
// 移除错题
const removeWrongQuestion = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const wrongQuestionId = req.params.id;
        const userId = req.userId;
        // 查找错题记录
        const wrongQuestion = yield WrongQuestion_1.default.findById(wrongQuestionId);
        if (!wrongQuestion) {
            return res.status(404).json({ message: '错题记录不存在' });
        }
        // 验证用户权限
        if (wrongQuestion.user.toString() !== userId) {
            return res.status(403).json({ message: '无权删除此错题记录' });
        }
        // 删除错题记录
        yield WrongQuestion_1.default.findByIdAndDelete(wrongQuestionId);
        return res.status(200).json({ message: '错题记录已删除' });
    }
    catch (error) {
        console.error('删除错题记录错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.removeWrongQuestion = removeWrongQuestion;
// 获取用户错题统计
const getWrongQuestionStats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.userId;
        // 获取用户的所有错题记录
        const wrongQuestions = yield WrongQuestion_1.default.find({ user: userId })
            .populate({
            path: 'question',
            select: 'type questionBank'
        });
        // 按题目类型分组统计
        const typeStats = {
            single: 0,
            multiple: 0,
            tf: 0
        };
        wrongQuestions.forEach(wq => {
            // 确保question存在且已正确populate
            if (wq.question && typeof wq.question !== 'string' && 'type' in wq.question) {
                const question = wq.question;
                typeStats[question.type]++;
            }
        });
        // 获取用户错题涉及的题库
        const questionBankIds = new Set();
        wrongQuestions.forEach(wq => {
            if (wq.question && typeof wq.question !== 'string' && 'questionBank' in wq.question) {
                const question = wq.question;
                const bankId = question.questionBank instanceof mongoose_1.default.Types.ObjectId
                    ? question.questionBank.toString()
                    : question.questionBank;
                questionBankIds.add(bankId.toString());
            }
        });
        // 获取题库信息
        const questionBanks = yield QuestionBank_1.default.find({
            _id: { $in: Array.from(questionBankIds) }
        }).select('name');
        return res.status(200).json({
            totalWrongQuestions: wrongQuestions.length,
            typeStats,
            questionBanks
        });
    }
    catch (error) {
        console.error('获取错题统计错误:', error);
        return res.status(500).json({ message: '服务器错误' });
    }
});
exports.getWrongQuestionStats = getWrongQuestionStats;
