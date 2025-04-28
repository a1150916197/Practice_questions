import mongoose, { Document, Schema } from 'mongoose';

// 题库接口
export interface IQuestionBank extends Document {
  name: string;
  description: string;
  isPublic: boolean;
  creator: mongoose.Types.ObjectId;
  createdAt: Date;
  questionCount: number;
}

// 题库模式
const questionBankSchema = new Schema<IQuestionBank>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  questionCount: {
    type: Number,
    default: 0
  }
});

export default mongoose.model<IQuestionBank>('QuestionBank', questionBankSchema); 