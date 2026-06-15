import mongoose, { Document as MongooseDocument, Model, Schema, Types } from 'mongoose';

import type { DocumentSourceType } from '@/types';

export type ChatMessageRole = 'user' | 'assistant';

export interface IChatMessageCitation {
  documentId: string;
  title: string;
  sourceType: DocumentSourceType;
  score: number;
}

export interface IChatMessage {
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: ChatMessageRole;
  content: string;
  citations?: IChatMessageCitation[];
  timestamp: Date;
}

export interface IChatMessageDocument extends IChatMessage, MongooseDocument {}

export interface IChatMessageModel extends Model<IChatMessageDocument> {}

const citationSchema = new Schema<IChatMessageCitation>(
  {
    documentId: { type: String, required: true },
    title: { type: String, required: true },
    sourceType: {
      type: String,
      enum: ['text', 'pdf', 'url'],
      required: true,
    },
    score: { type: Number, required: true },
  },
  { _id: false },
);

const chatMessageSchema = new Schema<IChatMessageDocument>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: [true, 'Role is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [20_000, 'Content cannot exceed 20000 characters'],
    },
    citations: {
      type: [citationSchema],
      default: undefined,
    },
    timestamp: {
      type: Date,
      required: [true, 'Timestamp is required'],
      default: Date.now,
    },
  },
  {
    timestamps: false,
  },
);

chatMessageSchema.index({ conversationId: 1, timestamp: 1 });
chatMessageSchema.index({ userId: 1, content: 1 });

export const ChatMessageModel = mongoose.model<IChatMessageDocument, IChatMessageModel>(
  'ChatMessage',
  chatMessageSchema,
);
