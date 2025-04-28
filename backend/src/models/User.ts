import mongoose, { Document, Schema } from 'mongoose';

// 用户角色枚举
export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin'
}

// 用户接口
export interface IUser extends Document {
  name: string;
  role: UserRole;
  createdAt: Date;
}

// 用户模式
const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.STUDENT
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model<IUser>('User', userSchema); 