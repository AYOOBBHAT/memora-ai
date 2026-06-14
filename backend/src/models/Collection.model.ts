import mongoose, { Document as MongooseDocument, Model, Schema, Types } from 'mongoose';

export interface ICollection {
  userId: Types.ObjectId;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICollectionDocument extends ICollection, MongooseDocument {}

export interface ICollectionModel extends Model<ICollectionDocument> {}

const collectionSchema = new Schema<ICollectionDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    color: {
      type: String,
      trim: true,
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g. #FF5733)'],
    },
    icon: {
      type: String,
      trim: true,
      maxlength: [50, 'Icon cannot exceed 50 characters'],
    },
  },
  {
    timestamps: true,
  },
);

collectionSchema.index({ userId: 1, createdAt: -1 });

export const CollectionModel = mongoose.model<ICollectionDocument, ICollectionModel>(
  'Collection',
  collectionSchema,
);
