# OzuPlanner: Advanced Course Schedule Optimizer 📅🚀

OzuPlanner is a high-performance web application designed to help university students navigate the complexities of course registration. It automates the generation of conflict-free weekly schedules from thousands of potential combinations.

---

## 🏗️ Technical Architecture

The project follows a modern **three-tier architecture** optimized for high-traffic "registration weeks."

### 1. Frontend (Student Interface)
- **Tech**: React 18 + Vite
- **State Management**: React Hooks (Memoized for performance)
- **Styling**: Vanilla CSS with a custom-engineered Design System (Ozu Design Language)
- **Optimization**: Component-level memoization to handle large course lists without UI lag.

### 2. Admin Dashboard (Data Management)
- **Tech**: React + Firebase Client SDK
- **Auth**: Google Sign-In with an **Email Whitelist** policy.
- **Features**: Excel Batch Import, Term Isolation, Real-time Analytics, and Course Maintenance tools.

### 3. Backend (Compute & API)
- **Tech**: Node.js + Express
- **Session**: `express-session` with `connect-pg-simple` for persistent PostgreSQL-backed sessions.
- **Security**: Firebase Admin SDK for token verification, CORS hardening, and Rate Limiting.
- **Compute**: Combinatorial conflict-detection algorithm for schedule generation.

### 4. Database (PostgreSQL)
- **Relational Design**: Normalized tables for Courses, Time Slots, and Mappings.
- **Dynamic Term Isolation**: Sub-tables are generated per semester (e.g., `courses_2025_2026_fall`) for maximum reliability.
- **Performance**: 
    - **GIN Trigram Indexes**: Uses `pg_trgm` for near-instant fuzzy search.
    - **Advanced SQL**: CTE-optimized queries with `json_agg` for zero-redundancy data transfer.
    - **Connection Pooling**: Tuned for high concurrency with a **50-connection pool** and statement timeouts.
    - **Metadata Caching**: Server-side caching of table schemas to reduce DB overhead.

---

## ☁️ VPS Infrastructure & Deployment

The production environment is hosted on a Linux VPS, engineered for stability and security.

### **Reverse Proxy & Web Server (Nginx)**
- **Role**: Entry point for all traffic, handling SSL termination and static file serving.
- **SSL**: Cloudflare **Origin CA Certificates** (Full Strict mode) with 15-year stability.
- **Optimizations**: Gzip compression, HTTP/2 enabled, and optimized buffer sizes.

### **Process Management (PM2)**
- **Persistence**: Backend processes (Node.js) are managed by PM2 with auto-restart on failure and server reboot.

### **🛡️ Security Layers ("Bot Armor")**
1.  **Nginx Level**: Custom "Bot Armor" blocks malicious User-Agents and non-browser automated requests.
2.  **Infrastructure Level**: Cloudflare WAF and DDoS protection.
3.  **App Level**: Email whitelist restricted Google Authentication for administrative paths.
4.  **Network Level**: Fail2Ban monitoring logs to catch and jail scanners/exploiters.

---

## 🛠️ Key Developer Features

### **Excel Batch Import**
Allows admins to upload university-wide course catalogues in seconds. The system parses complex time-slot strings (e.g., `Pazartesi | 08:40 - 10:30`), deduplicates entries, and maps them to normalized database records.

### **Performance Optimization Suite**
Implemented to handle datasets exceeding 10,000 course sections:
- **`src/scripts/optimizeDb.js`**: Automatically configures PostgreSQL extensions and trigram indexes on the current production table.
- **Node.js Memory Cache**: Integrated `node-cache` for 0ms response times on common repeated searches.
- **Request Deduplication**: A "Pending Queries" balancer that prevents the thundering herd problem by sharing results between identical simultaneous requests.
- **`src/utils/dbUtils.js`**: Lightweight caching layer for database metadata.

---

## 🚀 Deployment Guide

To deploy this project to a new VPS:

1.  **Clone & Install**:
    ```bash
    git clone https://github.com/faruk-avci/schedule-generator.git
    npm install
    ```
2.  **Database**:
    - Install PostgreSQL and enable `pg_trgm`.
    - Run `node src/scripts/optimizeDb.js` to initialize production indexes.
3.  **Environment Configuration**:
    - Setup `.env` with DB credentials, `FIREBASE_SERVICE_ACCOUNT` JSON, and `ADMIN_EMAILS`.
4.  **Production Run**:
    ```bash
    pm2 start app.js --name "ozu-backend"
    ```

---

## ❓ Required Information for AI Tools
If you are an AI tool working on this project, ensure you check the following environment variables:
- `CURRENT_TERM`: Defines the active database table scope.
- `FIREBASE_SERVICE_ACCOUNT`: Crucial for Admin Auth.
- `ADMIN_EMAILS`: Authorized users list.
- `VITE_API_URL`: Backend endpoint for the frontend.

---
**Vision**: To provide every student with a stress-free registration experience through algorithmic precision.
