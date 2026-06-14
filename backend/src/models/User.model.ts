import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from '@/config/env';
import type { AuthProvider, SubscriptionTier, UserRole } from '@/types';

export interface IUser {
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  avatar?: string;
  provider: AuthProvider;
  /** Google OAuth subject (`sub` claim); internal identity binding only. */
  googleSub?: string;
  subscription: SubscriptionTier;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserDocument extends IUser, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

export interface IUserModel extends Model<IUserDocument> {}

const userSchema = new Schema<IUserDocument>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: function (this: IUserDocument) {
        return this.provider === 'local';
      },
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'] satisfies UserRole[],
      default: 'user',
    },
    avatar: {
      type: String,
      trim: true,
    },
    provider: {
      type: String,
      enum: ['local', 'google', 'github'] satisfies AuthProvider[],
      default: 'local',
    },
    googleSub: {
      type: String,
    },
    subscription: {
      type: String,
      enum: ['free', 'pro', 'enterprise'] satisfies SubscriptionTier[],
      default: 'free',
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }

  const salt = await bcrypt.genSalt(env.BCRYPT_SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.index({ googleSub: 1 }, { unique: true, sparse: true });

userSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) {
    return false;
  }

  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);
