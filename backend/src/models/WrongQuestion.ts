import mongoose, { Document, Schema } from 'mongoose';

// 错题接口
export interface IWrongQuestion extends Document {
  user: mongoose.Types.ObjectId;
  question: mongoose.Types.ObjectId;
  wrongAnswer: any;  // 用户错误的答案
  timestamp: Date;
}

// 错题模式
const wrongQuestionSchema = new Schema<IWrongQuestion>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  wrongAnswer: {
    type: Schema.Types.Mixed,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// 创建复合索引确保用户错题的唯一性
wrongQuestionSchema.index({ user: 1, question: 1 }, { unique: true });

export default mongoose.model<IWrongQuestion>('WrongQuestion', wrongQuestionSchema); 