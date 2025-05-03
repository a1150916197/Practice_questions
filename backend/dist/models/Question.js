"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionType = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// 题目类型枚举
var QuestionType;
(function (QuestionType) {
    QuestionType["SINGLE_CHOICE"] = "single";
    QuestionType["MULTIPLE_CHOICE"] = "multiple";
    QuestionType["TRUE_FALSE"] = "tf"; // 判断题
})(QuestionType || (exports.QuestionType = QuestionType = {}));
// 题目模式
const questionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        enum: Object.values(QuestionType),
        required: true
    },
    content: {
        type: String,
        required: true
    },
    options: [{
            label: String,
            content: String
        }],
    answer: {
        type: mongoose_1.Schema.Types.Mixed,
        required: true
    },
    explanation: {
        type: String,
        default: ''
    },
    questionBank: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'QuestionBank',
        required: true
    }
});
exports.default = mongoose_1.default.model('Question', questionSchema);
