import mongoose, { Document, Schema } from 'mongoose';

// 题目类型枚举
export enum QuestionType {
  SINGLE_CHOICE = 'single',  // 单选题
  MULTIPLE_CHOICE = 'multiple',  // 多选题
  TRUE_FALSE = 'tf'  // 判断题
}

// 选项接口
interface IOption {
  label: string;  // 选项标签，如A、B、C、D
  content: string;  // 选项内容
}

// 判断题答案类型
type TrueFalseAnswer = boolean;

// 单选题答案类型（选项的索引）
type SingleChoiceAnswer = string;

// 多选题答案类型（选项的索引数组）
type MultipleChoiceAnswer = string[];

// 题目接口
export interface IQuestion extends Document {
  type: QuestionType;
  content: string;
  options?: IOption[];
  answer: TrueFalseAnswer | SingleChoiceAnswer | MultipleChoiceAnswer;
  explanation: string;
  questionBank: mongoose.Types.ObjectId;
}

// 题目模式
const questionSchema = new Schema<IQuestion>({
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
    type: Schema.Types.Mixed,
    required: true
  },
  explanation: {
    type: String,
    default: ''
  },
  questionBank: {
    type: Schema.Types.ObjectId,
    ref: 'QuestionBank',
    required: true
  }
});

export default mongoose.model<IQuestion>('Question', questionSchema); 