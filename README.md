# 🌳 Porompora - Connecting Dots

A beautiful, interactive family tree and genealogy platform that helps preserve family heritage across generations with modern glass morphism design.

![Family Tree Demo](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-Latest-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)

## ✨ Vision
Enable families worldwide to preserve their heritage beyond the typical 3-4 generations we usually remember, creating a lasting digital legacy for future generations.

## 🎯 Features

### 🎨 Modern UI/UX
- **Glass Morphism Design** - Beautiful, modern interface with backdrop blur effects
- **Interactive Family Tree** - Drag-and-drop nodes with smooth animations  
- **Multiple Layout Modes** - Tree, Generational, and Circular views
- **Responsive Design** - Works seamlessly on desktop and mobile devices

### 👥 Family Management
- **Smart Relationship Mapping** - Intelligent relationship calculations
- **Visual Connections** - Clear relationship lines with labels
- **Real-time Updates** - Instant tree refresh when adding relationships
- **Privacy Controls** - Control information sharing and visibility

### 🌐 Heritage Preservation
- **Multi-generational Support** - Preserve family history across generations
- **Public Family Database** - Discover connections with distant relatives
- **Connection Requests** - Connect with other families sharing heritage
- **Digital Legacy** - Create lasting records for future generations

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/porompora-connecting-dots.git
   cd porompora-connecting-dots
   ```

2. **Setup Server**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env with your MongoDB URI and JWT secret
   npm run dev
   ```

3. **Setup Client**
   ```bash
   cd ../client
   npm install
   npm start
   ```

4. **Access the Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## Tech Stack
- **Frontend**: React + React Flow (family tree visualization)
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Authentication**: JWT

## Project Structure
```
porompora/
├── client/          # React frontend
├── server/          # Node.js backend
├── docs/           # Documentation
└── README.md       # This file
```

## Getting Started
1. Clone the repository
2. Install dependencies for both client and server
3. Set up MongoDB database
4. Configure environment variables
5. Run development servers

## Development Roadmap
- [x] Project Setup & Architecture
- [ ] Database Schema Design
- [ ] User Authentication System
- [ ] Basic Family Tree CRUD
- [ ] Family Tree Visualization
- [ ] Search & Discovery System
- [ ] Privacy & Permission System
- [ ] Advanced Relationship Logic

---
*Building families, one connection at a time* 💝
