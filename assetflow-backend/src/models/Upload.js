import mongoose from 'mongoose';

const UploadSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  contentType: {
    type: String,
    required: true,
  },
  buffer: {
    type: Buffer,
    required: true,
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
  },
  itemIndex: {
    type: Number,
    required: true,
    min: 0,
  },
}, {
  timestamps: true,
  collection: 'uploads',
});

export const Upload = mongoose.model('Upload', UploadSchema);
