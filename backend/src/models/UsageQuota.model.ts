import mongoose, { Document as MongooseDocument, Model, Schema, Types } from 'mongoose';

export type UsageQuotaKind = 'ai' | 'upload';

export interface IUsageQuota {
  userId: Types.ObjectId;
  kind: UsageQuotaKind;
  /** UTC calendar day `YYYY-MM-DD`. */
  dateKey: string;
  count: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUsageQuotaDocument extends IUsageQuota, MongooseDocument {}

export interface IUsageQuotaModel extends Model<IUsageQuotaDocument> {}

const usageQuotaSchema = new Schema<IUsageQuotaDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    kind: {
      type: String,
      enum: ['ai', 'upload'] satisfies UsageQuotaKind[],
      required: true,
    },
    dateKey: {
      type: String,
      required: true,
    },
    count: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

usageQuotaSchema.index({ userId: 1, kind: 1, dateKey: 1 }, { unique: true });

export const UsageQuotaModel = mongoose.model<IUsageQuotaDocument, IUsageQuotaModel>(
  'UsageQuota',
  usageQuotaSchema,
);
