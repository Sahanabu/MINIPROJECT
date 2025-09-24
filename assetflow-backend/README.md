# AssetFlow Backend (Node.js + Express + MongoDB)

RESTful API for an asset tracking system (capital and revenue) with file uploads, validations, basic security, and reports export (Excel & Word).

## Stack
- Node.js LTS
- Express.js
- MongoDB Atlas + Mongoose
- Multer (file uploads) with optional AWS S3 storage
- Joi (payload validation)
- ExcelJS, docx (report export)
- dotenv, CORS, Helmet, express-rate-limit, Morgan

## Project Structure
```text
src/
  config/          # config and env
  controllers/     # route handlers
  middleware/      # multer upload, etc
  models/          # mongoose schemas
  routes/          # api routes
  utils/           # storage utils (local/S3)
  exports/         # reserved for future export helpers
  app.js           # express app
  server.js        # bootstrap
uploads/           # local uploads (if not using S3)
seedDepartments.js # seed 18 departments
```

## Getting Started
1) Copy env file
```bash
cp .env.example .env
```
2) Edit `.env` with your values
```
PORT=4000
MONGO_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>?retryWrites=true&w=majority
ALLOWED_ORIGINS=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_FILE_MB=10
ALLOWED_FILE_TYPES=application/pdf,image/jpeg,image/png,image/jpg
# Optional S3
S3_BUCKET=
S3_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_PUBLIC_URL_BASE=
```
3) Install dependencies
```bash
npm install
```
4) Run in dev
```bash
npm run dev
```

## Seed Departments
```bash
node seedDepartments.js
# ✅ Departments seeded successfully
```

## Data Models (Mongoose)
- Department: `{ name, type: 'major'|'academic'|'service' }`
- Vendor (optional): `{ name, address, contactNumber, email }`
- Asset:
  - `type`: 'capital' | 'revenue'
  - `departmentId`: ref Department
  - `subcategory`, `academicYear` (e.g. 2024-25)
  - `officer`: `{ id, name }`
  - `items[]`: `{ itemName, quantity, pricePerItem, totalAmount, vendorName, vendorAddress, contactNumber, email, billNo, billDate, billFileUrl }`
  - `grandTotal`

Totals are computed server-side; file URLs are saved server-side.

## API
Base URL: `http://localhost:4000/api`

### Departments
- GET `/departments`
- POST `/departments`
- PUT `/departments/:id`
- DELETE `/departments/:id`

### Assets
- POST `/assets` (multipart/form-data)
  - Fields:
    - `payload`: JSON string of the asset
    - `itemFiles[]`: files matching items by index
- GET `/assets` with query: `type, page, limit, departmentId, subcategory, vendorName, academicYear, search`
- GET `/assets/:id`
- PUT `/assets/:id`
- DELETE `/assets/:id`

### Reports
- GET `/reports` params: `academicYear, departmentId, itemName, vendorName, groupBy=department|item|vendor`
- GET `/reports/export` same params + `format=excel|word`

## Sample cURL

### Create Department
```bash
curl -X POST http://localhost:4000/api/departments \
  -H "Content-Type: application/json" \
  -d '{"name":"Department of Physics","type":"academic"}'
```

### List Departments
```bash
curl http://localhost:4000/api/departments
```

### Create Asset (multipart)
```bash
curl -X POST http://localhost:4000/api/assets \
  -H "Accept: application/json" \
  -F "payload={\"type\":\"capital\",\"departmentId\":\"<DEPT_ID>\",\"subcategory\":\"IT\",\"academicYear\":\"2024-25\",\"officer\":{\"id\":\"EMP1\",\"name\":\"Officer\"},\"items\":[{\"itemName\":\"Laptop\",\"quantity\":2,\"pricePerItem\":65000,\"vendorName\":\"ABC Corp\",\"billNo\":\"INV-1\",\"billDate\":\"2024-06-10\"},{\"itemName\":\"Monitor\",\"quantity\":3,\"pricePerItem\":12000,\"vendorName\":\"XYZ Ltd\"}]}" \
  -F "itemFiles[]=@/path/to/laptop-invoice.pdf" \
  -F "itemFiles[]=@/path/to/monitor-invoice.pdf"
```

### List Assets (paginated)
```bash
curl "http://localhost:4000/api/assets?type=capital&page=1&limit=10&search=laptop"
```

### Get Asset by ID
```bash
curl http://localhost:4000/api/assets/<ASSET_ID>
```

### Update Asset
```bash
curl -X PUT http://localhost:4000/api/assets/<ASSET_ID> \
  -H "Content-Type: application/json" \
  -d '{"subcategory":"Computers","items":[{"itemName":"Laptop","quantity":3,"pricePerItem":64000}]}'
```

### Delete Asset
```bash
curl -X DELETE http://localhost:4000/api/assets/<ASSET_ID>
```

### Report (JSON)
```bash
curl "http://localhost:4000/api/reports?groupBy=department&academicYear=2024-25"
```

### Report Export (Excel)
```bash
curl -L "http://localhost:4000/api/reports/export?groupBy=vendor&format=excel" -o report.xlsx
```

### Report Export (Word)
```bash
curl -L "http://localhost:4000/api/reports/export?groupBy=item&format=word" -o report.docx
```

## Notes
- CORS restricts origins by `ALLOWED_ORIGINS` (comma-separated). Add your frontend origin.
- File uploads are limited by `MAX_FILE_MB` and mime types via `ALLOWED_FILE_TYPES`.
- Local storage serves under `/uploads/...`. For S3, set S3 env vars and files are uploaded to the bucket under year-based prefixes.
