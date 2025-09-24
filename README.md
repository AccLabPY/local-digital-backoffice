# Chequeo Digital 2.0

A comprehensive business innovation survey tracking application for monitoring and analyzing innovation metrics across companies in Paraguay.

## Project Overview

Chequeo Digital 2.0 is a React-based Single Page Application (SPA) designed to track and visualize business innovation surveys. The application allows users to view, filter, and analyze innovation data across multiple companies and dimensions.

## Repository Structure

This repository contains both the frontend and backend code for the application:

- `/app`: Next.js frontend application
- `/components`: React components
- `/backend`: Node.js/Express backend API

## Features

- Company listing with advanced filtering and searching
- Detailed company information and innovation scores
- Survey history tracking and response visualization
- Interactive charts for innovation evolution
- Integration with Looker Studio dashboard
- Data export functionality (CSV/Excel)
- Responsive design for all device sizes

## Technology Stack

### Frontend
- **Next.js**: React framework
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: UI component library
- **Recharts**: Charting library

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **SQL Server**: Database
- **JWT**: Authentication
- **Winston**: Logging
- **Swagger**: API documentation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- NPM (v6 or higher)
- SQL Server instance

### Installation

#### Backend Setup
1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file based on the `.env.example` template

4. Initialize the database:
   ```
   npm run init-db
   ```

5. Start the development server:
   ```
   npm run dev
   ```

The API will be available at `http://localhost:3001` with documentation at `http://localhost:3001/api-docs`.

#### Frontend Setup
1. Install dependencies:
   ```
   npm install
   ```

2. Start the development server:
   ```
   npm run dev
   ```

The application will be available at `http://localhost:3000`.

## Deployment

See [backend/DEPLOYMENT.md](backend/DEPLOYMENT.md) for detailed backend deployment instructions.

## License

This project is proprietary and confidential.
