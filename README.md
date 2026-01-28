
```markdown
# Smart Inventory AI

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)
![Status](https://img.shields.io/badge/status-production--ready-success.svg?style=for-the-badge)
![MERN](https://img.shields.io/badge/stack-MERN-orange.svg?style=for-the-badge)

> **The Next-Generation Asset Intelligence Platform.**
>
> A robust, enterprise-grade inventory management system powered by predictive machine learning algorithms, real-time telemetry, and automated risk analysis. Designed for scalability, security, and operational efficiency.

---

## Table of Contents

1.  [Executive Summary](#executive-summary)
2.  [Key Features](#key-features)
3.  [Technology Stack](#technology-stack)
4.  [System Architecture](#system-architecture)
5.  [Installation & Setup](#installation--setup)
6.  [Configuration](#configuration)
7.  [API Documentation](#api-documentation)
8.  [Performance & Security](#performance--security)
9.  [Contributing](#contributing)
10. [License](#license)

---

## Executive Summary

Smart Inventory AI is a high-load enterprise resource planning (ERP) simulation tool. It addresses the critical business challenge of Stockout vs. Overstock optimization using simulated AI models (ARIMA, Random Forest).

The application features a decoupled architecture (Frontend/Backend) ensuring high availability via Node.js clustering and a reactive, optimistic UI built with React.js.

---

## Key Features

### Artificial Intelligence & Analytics
* **Multi-Model Forecasting:** Switch dynamically between Linear Regression, ARIMA, and Random Forest simulations to predict future demand.
* **Real-Time Anomaly Detection:** Live feed of statistical irregularities in stock levels.
* **Market Intelligence:** Radar and Bar charts comparing internal velocity against industry benchmarks.
* **Risk Analysis:** Categorization of assets into Critical, High Risk, and Stable segments.

### Enterprise Security
* **Advanced Authentication:** JWT-based stateless auth with HttpOnly cookies.
* **Brute-Force Protection:** Account lockout logic after 5 failed attempts.
* **Session Management:** Auto-logout on idle (30 mins) and concurrent session handling.
* **Input Sanitization:** Helmet.js headers, XSS protection, and NoSQL injection prevention.

### Operational Efficiency
* **Live Telemetry:** Real-time stock updates and system uptime tracking.
* **Bulk Operations:** CSV Import/Export streaming for handling large datasets without memory leaks.
* **Optimistic UI:** Instant feedback on delete/update actions before server confirmation.
* **Advanced Filtering:** Server-side pagination, faceted search, and date-range filtering.

### UI/UX Engineering
* **Responsive Design:** Fully adaptive layout for Desktop, Tablet, and Mobile.
* **Theming:** System-aware Dark/Light mode with persistence.
* **Data Visualization:** Complex interactive charts using Recharts.
* **Animations:** Smooth transitions using Framer Motion.

---

## Technology Stack

### Frontend (Client)
| Technology | Description |
| :--- | :--- |
| **React 18** | Component-based UI library. |
| **Tailwind CSS** | Utility-first styling for rapid development. |
| **Framer Motion** | Production-ready animation library. |
| **Recharts** | Composable charting library. |
| **Axios** | Promise-based HTTP client with interceptors. |
| **Context API** | State management for Auth, Theme, and Language. |

### Backend (Server)
| Technology | Description |
| :--- | :--- |
| **Node.js** | Javascript runtime. |
| **Express.js** | Web framework with middleware architecture. |
| **MongoDB** | NoSQL database for flexible schema design. |
| **Mongoose** | ODM with strict schema validation and hooks. |
| **Cluster** | Multi-core CPU utilization. |
| **Winston/Morgan** | Structured logging streams. |

---

## System Architecture

The application follows a Service-Oriented Architecture (SOA) pattern.

1.  **Request Layer:** Server handles rate limiting, CORS, and compression.
2.  **Route Layer:** Delegates requests to specific controllers.
3.  **Controller Layer:** Contains business logic and validation.
4.  **Service/Model Layer:** Interacts with the database using Mongoose Schemas.

---

## Installation & Setup

### Prerequisites
* Node.js v18.x or higher
* MongoDB (Local or Atlas Connection String)
* Git

### Step 1: Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/smart-inventory-ai.git](https://github.com/YOUR_USERNAME/smart-inventory-ai.git)
cd smart-inventory-ai

```

### Step 2: Backend Setup

```bash
cd backend
npm install

```

### Step 3: Frontend Setup

```bash
cd ../frontend
npm install

```

### Step 4: Database Seeding (Optional)

To populate the database with demo data, users, and logs:

```bash
# In backend directory
npm run seed

```

---

## Configuration

Create a .env file in the backend/ directory.

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Connection
MONGO_URI=mongodb://localhost:27017/smart_inventory_enterprise

# Security Secrets (Use strong random strings)
JWT_SECRET=your_super_secret_jwt_key_123!
JWT_EXPIRE=30d

# CORS Policy
ALLOWED_ORIGINS=http://localhost:3000

```

---

## API Documentation

### Authentication

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| POST | /api/auth/register | Register a new user | Public |
| POST | /api/auth/login | Authenticate user & return token | Public |
| GET | /api/auth/me | Get current user profile | Private |

### Inventory

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| GET | /api/inventory | Get paginated products with filters | Private |
| POST | /api/inventory | Create a new product | Private |
| PUT | /api/inventory/:id | Update product details | Private |
| DELETE | /api/inventory/:id | Soft delete a product | Private |
| POST | /api/inventory/import | Bulk upload CSV data | Private |

### Analytics

| Method | Endpoint | Description | Access |
| --- | --- | --- | --- |
| GET | /api/analytics/stats | KPI Aggregation | Private |
| GET | /api/analytics/forecast | Run AI Prediction Model | Private |

---

## Performance & Security

### Clustering

The server utilizes the native Node.js cluster module. It forks a worker process for every CPU core available on the host machine. If a worker dies, a new one is instantly spawned, ensuring zero downtime.

### Rate Limiting

To prevent DDoS attacks, the API limits requests to 100 per 15 minutes per IP address using express-rate-limit.

### Data Sanitization

* **NoSQL Injection:** Mongoose schemas use strict typing.
* **XSS:** Input validation prevents script injection.
* **HTTP Parameter Pollution:** Recommended middleware prevents array injection attacks.

---

## Contributing

We welcome contributions to the enterprise branch!

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Push to the branch.
5. Open a Pull Request.

---

## License

Distributed under the MIT License. See LICENSE for more information.

---

**Developed by SmartInv Engineering Team**

```


