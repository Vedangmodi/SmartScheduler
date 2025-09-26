# Smart Scheduler - Recurring Weekly Slots System

A full-stack scheduler application that supports recurring weekly time slots with a maximum of 2 slots per day.

## 🚀 Live Demo

- **Frontend**: [Vercel Link]
- **Backend API**: https://smartscheduler-q1ol.onrender.com
- **API Documentation**: [Backend URL]/health

## 📋 Features

- ✅ Create time slots with start/end times
- ✅ Recurring slots (automatically replicates for 12 weeks)
- ✅ Maximum 2 slots per day enforcement
- ✅ Edit/Delete slots with exception handling for recurring slots
- ✅ Responsive design (mobile + desktop)
- ✅ Infinite scroll for loading weeks
- ✅ Real-time UI updates

## 🛠️ Tech Stack

### Frontend
- React 18 + TypeScript
- TailwindCSS
- Vite
- Custom hooks for state management

### Backend
- Node.js + TypeScript
- Express.js
- PostgreSQL + Knex.js
- CORS enabled

## 📁 Project Structure

SmartScheduler/
├── backend/ # Node.js API server
│ ├── src/
│ │ ├── config/     # Database configuration
│ │ ├── controllers/    # Route controllers
│ │ ├── models/     # Data models
│ │ ├── routes/     # API routes
│ │ └── index.ts.   # Server entry point
│ ├── knexfile.js   # Knex configuration
│ └── package.json
├── scheduler-frontend/ # React application
│ ├── src/
│ │ ├── components/    # React components
│ │ ├── hooks/        # Custom hooks
│ │ ├── services/     # API services
│ │ └── utils/        # Utility functions
│ └── package.json
└── README.md


## 🚀 Quick Start

### Prerequisites 
- Node.js 16+
- PostgreSQL
- npm or yarn

### Backend Setup
```bash
cd backend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npx knex migrate:latest

# Start development server
npm run dev


### Frontend Setup
bash
cd scheduler-frontend
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev


📚 API Endpoints
Slots Management
GET /api/slots?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD - Get slots for date range

POST /api/slots - Create a new slot

PUT /api/slots/:id - Update a slot

DELETE /api/slots/:id - Delete a slot (creates exception for recurring)

DELETE /api/slots/:id/series - Delete entire recurring series

Health Check
GET /health - API health status


🗃️ Database Schema
sql
slots table:
- id (string, primary key)
- start_time (string)
- end_time (string)
- day_of_week (integer)
- date (date)
- is_recurring (boolean)
- exception_id (string, nullable)
- created_at (timestamp)
- updated_at (timestamp)


🤝 Contributing
Fork the repository
Create a feature branch
Commit your changes
Push to the branch
Open a Pull Request


📄 License

text

### **3. Create Environment Example Files**

**File: `backend/.env.example`**
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/scheduler_db

# Server
PORT=3001
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
File: scheduler-frontend/.env.example

env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001
