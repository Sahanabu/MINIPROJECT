# Departmental Asset Tracking System

A modern, production-ready React frontend for tracking departmental assets (Capital and Revenue). Built with Vite, TypeScript, TailwindCSS, and shadcn/ui components.

## 🚀 Features

- **Asset Management**: Create, view, edit, and delete capital and revenue assets
- **Multi-step Forms**: Intuitive wizard-style forms with validation
- **File Uploads**: Upload and manage bill documents with drag-and-drop
- **Advanced Filtering**: Filter assets by department, category, vendor, and academic year
- **Comprehensive Reports**: Generate and export reports in Excel and Word formats
- **Responsive Design**: Beautiful, mobile-first design with professional UI
- **Type Safety**: Full TypeScript implementation with proper type definitions
- **State Management**: Redux Toolkit for predictable state management

## 🛠️ Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling
- **shadcn/ui** for components
- **React Router v6** for navigation
- **Redux Toolkit** for state management
- **React Hook Form + Yup** for form validation
- **Axios** for API calls
- **React Dropzone** for file uploads
- **Date-fns** for date formatting

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn package manager

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd asset-tracking-frontend

# Install dependencies
npm install
```

### 2. Environment Setup

```bash
# Copy the example environment file
cp .env.example .env

# Edit the .env file with your backend URL
VITE_API_BASE_URL=http://localhost:4000
```

### 3. Development

```bash
# Start the development server
npm run dev

# Open your browser to http://localhost:8080
```

### 4. Build for Production

```bash
# Build the application
npm run build

# Preview the production build
npm run preview
```

## 🔌 Backend API Integration

This frontend expects a REST API backend with the following endpoints:

### Required API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/departments` | Fetch all departments |
| POST | `/api/departments` | Create new department |
| PUT | `/api/departments/:id` | Update department |
| DELETE | `/api/departments/:id` | Delete department |
| GET | `/api/assets` | Fetch assets with filters |
| POST | `/api/assets` | Create new asset |
| PUT | `/api/assets/:id` | Update asset |
| DELETE | `/api/assets/:id` | Delete asset |
| GET | `/api/reports` | Generate reports |
| GET | `/api/reports/export` | Export reports |

### Sample API Responses

#### GET /api/departments
```json
{
  "success": true,
  "data": [
    {
      "_id": "dept1",
      "name": "Computer Science",
      "type": "major"
    }
  ]
}
```

#### POST /api/assets
```json
{
  "type": "capital",
  "departmentId": "dept1",
  "subcategory": "IT/computers",
  "academicYear": "2024-25",
  "officer": {
    "id": "officer1",
    "name": "John Doe"
  },
  "items": [
    {
      "itemName": "Laptop",
      "quantity": 2,
      "pricePerItem": 45000,
      "totalAmount": 90000,
      "vendorName": "Tech Corp",
      "vendorAddress": "123 Tech Street",
      "contactNumber": "9876543210",
      "email": "vendor@techcorp.com",
      "billNo": "B123",
      "billDate": "2025-09-23",
      "billFile": "(file upload)"
    }
  ]
}
```

## 📱 Application Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Layout.tsx      # Main layout wrapper
│   └── FileUploader.tsx # File upload component
├── hooks/              # Custom React hooks
│   ├── use-toast.ts    # Toast notifications
│   └── useApi.ts       # API helper hook
├── pages/              # Page components
│   ├── Index.tsx       # Landing page
│   ├── AssetForm.tsx   # Asset creation form
│   ├── AssetsList.tsx  # Assets listing & management
│   ├── Reports.tsx     # Reports generation
│   └── NotFound.tsx    # 404 page
├── services/           # API services
│   └── api.ts          # Axios configuration
├── store/              # Redux store
│   ├── index.ts        # Store configuration
│   └── slices/         # Redux slices
└── lib/                # Utility functions
```

## 🎨 Design System

The application uses a professional design system with:

- **Primary Color**: Professional blue (#3b82f6)
- **Success Color**: Green (#10b981) 
- **Warning Color**: Orange (#f59e0b)
- **Typography**: System fonts with careful hierarchy
- **Spacing**: Consistent 8px grid system
- **Shadows**: Subtle elevation for depth
- **Animations**: Smooth transitions and micro-interactions

## 📝 Usage Guide

### Adding Assets

1. **Choose Asset Type**: Select Capital or Revenue from the homepage
2. **Department Selection**: Choose the relevant department
3. **Category Selection**: Pick from predefined subcategories
4. **Item Details**: Add multiple items with vendor information
5. **File Upload**: Attach bill documents (PDF, JPG, PNG)
6. **Review & Submit**: Preview before final submission

### Managing Assets

- **View Assets**: Browse paginated lists with filters
- **Search**: Find assets by item name or vendor
- **Filter**: By department, category, vendor, or academic year
- **Actions**: View details, edit, or delete assets

### Generating Reports

- **Set Filters**: Academic year, department, items, vendors
- **Group By**: Department, item type, or vendor
- **Export**: Download as Excel or Word documents

## 🔧 Customization

### Adding New Subcategories

Edit the subcategories array in:
- `src/pages/AssetForm.tsx`
- `src/pages/AssetsList.tsx`

### Modifying Validation

Update Yup schemas in `src/pages/AssetForm.tsx`:

```typescript
const itemSchema = yup.object({
  itemName: yup.string().required('Item name is required'),
  // Add your custom validations
});
```

### Styling Changes

The design system is defined in:
- `src/index.css` - CSS variables and base styles
- `tailwind.config.ts` - Tailwind configuration

## 🧪 Testing

```bash
# Run type checking
npm run type-check

# Build to catch any issues
npm run build
```

## 📦 Deployment

### Vercel/Netlify

1. Connect your repository
2. Set environment variables:
   - `VITE_API_BASE_URL`: Your production API URL
3. Deploy

### Manual Deployment

```bash
# Build the application
npm run build

# Upload the dist/ folder to your web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the GitHub Issues
2. Review the API documentation
3. Ensure your backend matches the expected endpoints

---

Built with ❤️ using React, TypeScript, and modern web technologies.