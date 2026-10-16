# 🚚 FleetFlow — Fleet Management & Logistics Tracking Platform

<p align="center">
  <strong>A full-stack fleet management and logistics tracking platform for vehicles, drivers, shipments, trips, maintenance, fuel monitoring, analytics, alerts, and real-time operations.</strong>
</p>

<p align="center">
  <a href="https://feetflowmanagement.up.railway.app">🌐 Live Demo</a> •
  <a href="https://github.com/amitedit56/FleetFlow">💻 GitHub Repository</a> •
  <a href="https://fleetflow-production-e3cb.up.railway.app">⚡ Backend API</a>
</p>

---

## 📌 Overview

**FleetFlow** is a modern full-stack fleet management and logistics tracking application built to centralize fleet operations in one platform.

It provides modules for fleet and driver management, shipments, routes, trips, maintenance, fuel monitoring, driver assignments, analytics, reports, and notifications.

The platform also includes **Celery background jobs**, **Redis**, **WebSocket communication**, **Docker**, **Nginx**, and **Railway production deployment**.

---

## ✨ Key Features

### 📊 Dashboard
- Fleet overview and operational KPIs
- Vehicle and driver statistics
- Shipment and trip activity
- Operational summaries
- Analytics-oriented views

### 🚛 Fleet Management
- Add, edit, view, and manage vehicles
- Vehicle status and operational information
- Fleet-wide vehicle visibility
- Maintenance-related vehicle tracking

### 👨‍✈️ Driver Management
- Driver profiles and records
- Driver status management
- Driver assignments
- Driver operational information

### 📦 Shipment Management
- Create and manage shipments
- Shipment status tracking
- Origin and destination information
- Shipment lifecycle visibility

### 🛣️ Routes & Trips
- Route management
- Trip scheduling
- Trip status tracking
- Origin/destination workflow
- Map-based logistics support

### 🔧 Maintenance Management
- Maintenance records and history
- Service schedules
- Overdue maintenance detection
- Upcoming maintenance visibility

### 🚨 Automated Maintenance Alerts

FleetFlow uses **Celery background tasks** to check maintenance schedules and generate alerts.

The workflow supports:

- Overdue service detection
- Due-soon maintenance detection
- New maintenance alert creation
- Maintenance alert API integration
- Notification display
- Automatic frontend alert refresh

### ⛽ Fuel Monitoring
- Fuel records
- Fuel usage visibility
- Fleet fuel monitoring
- Operational fuel insights

### 📈 Analytics & Reports
- Fleet performance analytics
- Operational reporting
- Data-driven fleet insights
- Report-oriented views

### 🔔 Notifications
- Maintenance alerts
- Shipment and trip activity
- Recent fleet activity
- Automatically refreshed maintenance notifications

### ⚡ Real-Time Communication
- WebSocket support
- Redis-backed infrastructure
- Real-time application communication

### 🔐 Authentication
- User authentication
- Protected frontend routes
- Authenticated API access
- Administrator-oriented workflows

---

## 🏗️ Architecture

```text
                    ┌─────────────────────────┐
                    │      FleetFlow UI       │
                    │   React + Vite + CSS    │
                    └────────────┬────────────┘
                                 │
                         REST API / WebSocket
                                 │
                    ┌────────────▼────────────┐
                    │     FastAPI Backend     │
                    │   Auth / Business API   │
                    └───────┬─────────┬───────┘
                            │         │
                ┌───────────▼───┐   ┌▼────────────────┐
                │  PostgreSQL   │   │ Redis + Celery  │
                │   Database    │   │ Background Jobs │
                └───────────────┘   └─────────────────┘
                            │
                    ┌───────▼────────┐
                    │ Maintenance /  │
                    │ Alert Services │
                    └────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS
- Axios
- React Router
- WebSocket
- Maps integration

### Backend
- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Alembic
- Pydantic
- JWT authentication
- WebSockets

### Background Processing
- Celery
- Redis

### Deployment & Infrastructure
- Docker
- Nginx
- Railway
- PostgreSQL
- Redis

### Development
- Git
- GitHub
- VS Code
- npm
- Python virtual environment

---

## 📂 Project Structure

```text
FleetFlow/
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── celery_app.py
│   │   ├── config.py
│   │   ├── connection_manager.py
│   │   ├── database.py
│   │   └── main.py
│   ├── alembic/
│   ├── uploads/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── config.js
│   │   └── main.jsx
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── ...
│
├── docker-compose.yml
├── README.md
└── ...
```

---

## 🌐 Deploy for a Public Demo

This project can be deployed as a demo with the Vercel frontend, Render API,
and a PostgreSQL database such as Neon. Free plans have usage limits and may
sleep or pause; they are not intended for guaranteed always-on production use.

### 1. Create a PostgreSQL database

Create a database with your PostgreSQL provider and copy its connection string.
Keep it private; it will be added to Render as `DATABASE_URL`.

### 2. Deploy the backend on Render

In Render, create a Blueprint from this repository and select `render.yaml`.
Set the prompted environment variables in the Render dashboard:

- `DATABASE_URL`: the PostgreSQL connection string
- `SECRET_KEY`: a long, random secret
- `FRONTEND_URL`: the final public Vercel URL, with no trailing slash
- `GOOGLE_MAPS_API_KEY`: the key used by the app
- `SMTP_USER` and `SMTP_PASSWORD`: email credentials used for password resets

The API is configured to use Render's `PORT` environment variable. Its root
URL returns a simple health response. `Base.metadata.create_all` creates tables
for a new empty database when the API starts.

### 3. Deploy the frontend on Vercel

Import the repository into Vercel and set the project root directory to
`frontend`. Use the Vite build command `npm run build` and output directory
`dist`. Add `VITE_API_BASE_URL` as an environment variable, using the public
Render API URL (for example, `https://your-service.onrender.com`), then deploy.
The Vercel rewrite configuration supports React Router deep links.

After Vercel provides the frontend URL, set that exact URL as Render's
`FRONTEND_URL` and redeploy the backend so browser CORS allows the frontend.

### Free-tier limitations

- A free Render web service can spin down while idle, so its first request may
  take time to respond.
- Render's local filesystem is ephemeral; uploaded profile photos may disappear
  after a restart or redeploy.
- This setup does not deploy the Celery worker or beat service. Background
  maintenance alerts therefore will not run until a worker is hosted separately.
- Before changing hosts, export any existing Railway database data that needs
  to be preserved.

---

## ⚙️ Environment Variables

### Backend

Create a `.env` file inside `backend/`:

```env
DATABASE_URL=your_postgresql_database_url
SECRET_KEY=your_secret_key
FRONTEND_URL=http://localhost:5173

REDIS_URL=redis://localhost:6379/0
```

### Frontend

Example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

> Never commit real credentials, database URLs, API keys, or production secrets to GitHub.

---

## 💻 Local Development

### 1. Clone the repository

```bash
git clone https://github.com/amitedit56/FleetFlow.git
cd FleetFlow
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
```

#### Windows

```bash
venv\Scripts\activate
```

#### macOS / Linux

```bash
source venv/bin/activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn app.main:app --reload
```

Backend:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## ⚡ Celery & Redis

Start a Celery worker from the backend directory:

```bash
celery -A app.celery_app worker --loglevel=info
```

For scheduled background execution:

```bash
celery -A app.celery_app beat --loglevel=info
```

The maintenance background task checks service schedules and creates alerts when required.

---

## 🔔 Maintenance Alert Flow

```text
Vehicle Maintenance Data
          │
          ▼
   Celery Background Task
          │
          ▼
 Check Maintenance Dates
          │
     ┌────┴─────┐
     │          │
  Overdue    Due Soon
     │          │
     └────┬─────┘
          ▼
    Create Alert
          │
          ▼
  Maintenance Alerts API
          │
          ▼
      React UI
          │
          ▼
    Notifications
```

The frontend periodically refreshes maintenance alerts so newly generated alerts can appear without requiring a full page reload.

---

## 🐳 Docker Deployment

Build and start the stack:

```bash
docker compose up --build
```

Stop containers:

```bash
docker compose down
```

The production frontend is served through Nginx, including SPA route handling.

---

## 🌐 API Modules

The backend provides API functionality for the main FleetFlow modules, including:

```text
/auth/
/vehicles/
/drivers/
/shipments/
/trips/
/maintenance/
/maintenance-alerts/
/fuel/
/analytics/
/reports/
```

When running locally, interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

---

## 🔄 Infrastructure Services

| Service | Purpose |
|---|---|
| React + Vite | Frontend application |
| FastAPI | REST API and backend |
| PostgreSQL | Persistent application data |
| Redis | Broker/cache infrastructure |
| Celery | Background task processing |
| WebSocket | Real-time communication |
| Nginx | Production frontend server and SPA routing |
| Docker | Containerization |
| Railway | Cloud deployment |

---

## 🧪 Production Testing

The deployed system has been tested across major workflows, including:

- Authentication
- Dashboard
- Fleet management
- Drivers
- Shipments
- Routes
- Trips
- Maintenance
- Maintenance alerts
- Notifications
- Fuel monitoring
- Driver assignments
- Analytics
- Reports
- REST API communication
- WebSocket connectivity
- Redis connectivity
- Celery task execution
- Production SPA routing

---

## 🔒 Security

- Keep `.env` files out of version control.
- Never commit production secrets.
- Use strong secret keys.
- Protect database credentials.
- Configure CORS for trusted frontend origins.
- Use HTTPS/WSS in production.
- Keep Redis and database credentials private.

---

## 📌 What This Project Demonstrates

FleetFlow demonstrates practical experience with:

- Full-stack web development
- React frontend development
- FastAPI backend development
- REST API architecture
- PostgreSQL and SQLAlchemy
- Authentication and protected routes
- Fleet and logistics management
- Celery background jobs
- Redis integration
- WebSocket communication
- Automated maintenance alerts
- Notification workflows
- Docker containerization
- Nginx production serving
- Cloud deployment
- Production debugging and monitoring

---

## 👨‍💻 Developer

### Amit Bind

**BCA — Computer Science**

- GitHub: https://github.com/amitedit56
- LinkedIn: https://www.linkedin.com/in/amit-bind-ba305a331/
- GeeksforGeeks: https://www.geeksforgeeks.org/user/amitbind03/

---

## ⭐ Support

If you find FleetFlow useful, consider giving the repository a ⭐ on GitHub.

---

## 📄 License

This project is licensed under the **MIT License**.
