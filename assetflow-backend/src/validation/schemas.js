import Joi from 'joi';

export const departmentSchema = Joi.object({
	name: Joi.string().trim().min(2).max(200).required(),
	type: Joi.string().valid('major', 'academic', 'service').required(),
});

const assetItemSchema = Joi.object({
	itemName: Joi.string().trim().min(1).required(),
	quantity: Joi.number().integer().min(1).required(),
	pricePerItem: Joi.number().min(0).required(),
	totalAmount: Joi.number().min(0).optional(), // computed server-side, ignored if provided
	vendorName: Joi.string().allow('', null),
	vendorAddress: Joi.string().allow('', null),
	contactNumber: Joi.string().allow('', null),
	email: Joi.string().email({ tlds: false }).allow('', null),
	billNo: Joi.string().allow('', null),
	billDate: Joi.date().iso().allow(null),
	billFileUrl: Joi.string().uri().allow('', null),
});

export const assetCreateSchema = Joi.object({
	type: Joi.string().valid('capital', 'revenue').required(),
	departmentId: Joi.string().length(24).hex().required(),
	subcategory: Joi.string().trim().allow(''),
	academicYear: Joi.string()
		.pattern(/^\d{4}-\d{2}$/)
		.message('academicYear must be in format YYYY-YY')
		.required(),
	officer: Joi.object({ id: Joi.string().allow(''), name: Joi.string().allow('') }).default({}),
	items: Joi.array().items(assetItemSchema).min(1).required(),
	grandTotal: Joi.number().optional(), // computed server-side
});

export const assetUpdateSchema = Joi.object({
	type: Joi.string().valid('capital', 'revenue'),
	departmentId: Joi.string().length(24).hex(),
	subcategory: Joi.string().trim().allow(''),
	academicYear: Joi.string().pattern(/^\d{4}-\d{2}$/).message('academicYear must be in format YYYY-YY'),
	officer: Joi.object({ id: Joi.string().allow(''), name: Joi.string().allow('') }),
	items: Joi.array().items(assetItemSchema).min(1),
	grandTotal: Joi.number().optional(),
}).min(1);

export const listQuerySchema = Joi.object({
	type: Joi.string().valid('capital', 'revenue'),
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	departmentId: Joi.string().length(24).hex(),
	subcategory: Joi.string(),
	vendorName: Joi.string(),
	academicYear: Joi.string().pattern(/^\d{4}-\d{2}$/),
	search: Joi.string(),
});

export const reportQuerySchema = Joi.object({
	academicYear: Joi.string().pattern(/^\d{4}-\d{2}$/),
	departmentId: Joi.string().length(24).hex(),
	itemName: Joi.string(),
	vendorName: Joi.string(),
	groupBy: Joi.string().valid('department', 'item', 'vendor').required(),
	format: Joi.string().valid('excel', 'word'),
});

export const registerSchema = Joi.object({
	name: Joi.string().trim().min(2).max(50).required(),
	email: Joi.string().email({ tlds: false }).required(),
	password: Joi.string().min(6).required(),
	role: Joi.string().valid('officer', 'admin').default('officer'),
});

export const loginSchema = Joi.object({
	email: Joi.string().email({ tlds: false }).required(),
	password: Joi.string().required(),
});
