import mongoose, { Document as MongooseDocument, Model, Schema, Types } from 'mongoose';

export interface IConversation {
  userId: Types.ObjectId;
  title?: string;
  collectionIds?: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationDocument extends IConversation, MongooseDocument {}

export interface IConversationModel extends Model<IConversationDocument> {}

const conversationSchema = new Schema<IConversationDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    title: {
      type: String,
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    collectionIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Collection',
      },
    ],
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({ userId: 1, updatedAt: -1 });

export const ConversationModel = mongoose.model<IConversationDocument, IConversationModel>(
  'Conversation',
  conversationSchema,
);
