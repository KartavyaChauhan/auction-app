# 🏆 Auction App

A modern, real-time auction platform built with Node.js, Express, MongoDB, and Socket.io. Users can create accounts, list items for auction, place bids, and experience live bidding with real-time updates.

![Auction App](https://img.shields.io/badge/Status-Active-green)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

## 🚀 Features

### For Bidders
- 🔐 **User Authentication** - Secure registration and login
- 🏷️ **Browse Auctions** - View all active auctions with images
- 💰 **Real-time Bidding** - Place bids with live updates
- 🏆 **Auction Status** - Track auction progress and winners
- 📱 **Responsive Design** - Works on desktop and mobile

### For Sellers
- 📝 **Create Auctions** - List items with images, descriptions, and expiration times
- 📊 **Seller Dashboard** - Manage all your auctions in one place
- ✏️ **Edit Auctions** - Update auction details and status
- 📈 **Export Data** - Download bidding history and auction data as CSV
- 🖼️ **Image Upload** - Add high-quality images to your listings

### For Admins
- 👥 **User Management** - View and manage all users
- 📋 **Auction Management** - Oversee all auctions on the platform
- 📊 **Analytics Dashboard** - Monitor platform activity
- 🛠️ **System Administration** - Platform configuration and maintenance

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time communication
- **JWT** - Authentication tokens
- **Multer** - File upload handling
- **Bull Queue** - Background job processing
- **Redis** - Caching and session management

### Frontend
- **HTML5** - Structure
- **CSS3** - Styling with responsive design
- **Vanilla JavaScript** - Client-side logic
- **Socket.io Client** - Real-time updates

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **PM2** - Process management
- **Nginx** - Web server (for frontend)

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v18 or higher)
- **Docker** and **Docker Compose**
- **MongoDB Atlas** account (or local MongoDB)
- **Git** for version control

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/YourUsername/auction-app.git
cd auction-app
```

### 2. Environment Setup
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
REDIS_HOST=localhost
REDIS_PORT=6379
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

### 3. Run with Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### 4. Access the Application
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api-docs

## 🔧 Manual Installation (Without Docker)

### Backend Setup
```bash
cd backend
npm install
npm start
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Database Setup
- Install MongoDB locally or use MongoDB Atlas
- Install Redis locally
- Update connection strings in `.env` file

## 📁 Project Structure

```
auction-app/
├── 📁 backend/                 # Server-side application
│   ├── 📁 config/             # Database and app configuration
│   ├── 📁 controllers/        # Business logic
│   ├── 📁 middleware/         # Custom middleware
│   ├── 📁 models/            # Database schemas
│   ├── 📁 routes/            # API endpoints
│   ├── 📁 sockets/           # Real-time communication
│   ├── 📁 utils/             # Helper functions
│   ├── 📁 workers/           # Background jobs
│   ├── 📄 server.js          # Main server file
│   └── 📄 package.json       # Dependencies
├── 📁 frontend/               # Client-side application
│   ├── 📁 public/            # HTML pages
│   │   ├── 📄 index.html     # Home page
│   │   ├── 📄 login.html     # Authentication
│   │   ├── 📄 auctions.html  # Auction listings
│   │   ├── 📄 seller.html    # Seller dashboard
│   │   └── 📄 admin.html     # Admin panel
│   └── 📄 package.json       # Dependencies
├── 📁 uploads/               # User uploaded images
├── 📄 docker-compose.yml     # Docker services configuration
└── 📄 README.md             # Project documentation
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Auctions
- `GET /api/auctions` - Get all auctions
- `POST /api/auctions` - Create new auction
- `GET /api/auctions/:id` - Get auction by ID
- `PATCH /api/auctions/:id` - Update auction
- `DELETE /api/auctions/:id` - Delete auction

### Bidding
- `POST /api/auctions/:id/bid` - Place a bid

### Admin
- `GET /api/admin/users` - Get all users
- `GET /api/admin/auctions` - Get all auctions (admin view)

### Export
- `GET /api/export/auctions/:userId` - Export user's auctions
- `GET /api/export/bidding-history/:userId` - Export bidding history

## 🔄 Real-time Features

The application uses Socket.io for real-time functionality:

- **Live Bidding**: Bids are instantly shown to all users
- **Auction Updates**: Status changes are broadcast immediately
- **Winner Notifications**: Real-time winner announcements
- **Connection Status**: Shows online/offline status

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🐳 Docker Services

The application runs 4 Docker containers:

1. **Backend API** (`auction-app-api`) - Node.js server on port 3000
2. **Frontend** (`auction-app-frontend`) - Nginx server on port 8080
3. **MongoDB** (`auction-app-mongo`) - Database on port 27017
4. **Redis** (`auction-app-redis`) - Cache/queue on port 6379

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - Bcrypt for password security
- **Input Validation** - Server-side validation for all inputs
- **CORS Protection** - Configured CORS policies
- **Rate Limiting** - API rate limiting to prevent abuse
- **Helmet.js** - Security headers for production

## 📊 Monitoring

- **PM2 Process Manager** - Automatic restarts and monitoring
- **Bull Board** - Queue monitoring dashboard at `/admin/queues`
- **Logging** - Comprehensive logging with Winston
- **Health Checks** - Application health monitoring endpoint

## 🚢 Deployment

### Production Deployment
1. Update environment variables for production
2. Build Docker images
3. Deploy using Docker Compose
4. Configure reverse proxy (Nginx)
5. Set up SSL certificates

### Environment Variables for Production
```env
NODE_ENV=production
MONGO_URI=your_production_mongodb_uri
JWT_SECRET=strong_production_secret
CORS_ORIGIN=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/YourUsername)

## 🙏 Acknowledgments

- Socket.io for real-time communication
- MongoDB for flexible data storage
- Express.js for robust backend framework
- Docker for containerization
- All the open-source contributors

## 📞 Support

If you have any questions or need help:

- 📧 Email: your.email@example.com
- 💬 GitHub Issues: [Create an issue](https://github.com/YourUsername/auction-app/issues)
- 📖 Documentation: Check the `/docs` folder for detailed guides

## 🔮 Roadmap

- [ ] Mobile app development
- [ ] Payment gateway integration
- [ ] Advanced search and filtering
- [ ] Email notifications
- [ ] Auction categories
- [ ] Multi-language support
- [ ] Advanced analytics dashboard

---

Made with ❤️ by [Your Name]
