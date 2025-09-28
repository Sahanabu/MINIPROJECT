import mongoose from 'mongoose';

const AssetItemSchema = new mongoose.Schema(
	{
		itemName: { type: String, required: true, trim: true },
		quantity: { type: Number, required: true, min: 1 },
		pricePerItem: { type: Number, required: true, min: 0 },
		totalAmount: { type: Number, required: true, min: 0 },
		vendorName: { type: String, default: '' },
		vendorAddress: { type: String, default: '' },
		contactNumber: { type: String, default: '' },
		email: { type: String, default: '' },
		billNo: { type: String, default: '' },
		billDate: { type: Date },
		billFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'Upload', default: null },
	},
	{ _id: false }
);

const AssetSchema = new mongoose.Schema(
	{
		type: { type: String, required: true, enum: ['capital', 'revenue'] },
		departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
		subcategory: { type: String, default: '' },
		academicYear: { type: String, required: true },
		officer: {
			id: { type: String, default: '' },
			name: { type: String, default: '' },
		},
		items: { type: [AssetItemSchema], required: true, validate: v => Array.isArray(v) && v.length > 0 },
		grandTotal: { type: Number, required: true, min: 0 },
	},
	{ timestamps: true }
);

AssetSchema.pre('validate', function (next) {
	if (this.items && Array.isArray(this.items)) {
		this.items = this.items.map((it) => ({
			...it,
			totalAmount: Number((Number(it.quantity || 0) * Number(it.pricePerItem || 0)).toFixed(2)),
		}));
		this.grandTotal = this.items.reduce((sum, it) => sum + (it.totalAmount || 0), 0);
	}
	next();
});

export const Asset = mongoose.model('Asset', AssetSchema);

// Separate collections for isolation
export const CapitalAsset = mongoose.model('CapitalAsset', AssetSchema, 'capital_assets');
export const RevenueAsset = mongoose.model('RevenueAsset', AssetSchema, 'revenue_assets');

export function getAssetModelByType(type) {
	if (type === 'capital') return CapitalAsset;
	if (type === 'revenue') return RevenueAsset;
	throw new Error('Invalid asset type');
}
