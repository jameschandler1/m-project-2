# DEVELOPMENT.md / DEPLOYMENT.md

# Development & Deployment Guide

# Local Development

## Install Dependencies

**Run from:**

```
m-project-2/
```

```bash
npm install
```

This installs dependencies for:

* backend
* frontend
* frontend-sld

---

# Running the Express Backend

**Run from:**

```
m-project-2/backend/
```

```bash
npm run server
```

or

```bash
node server.js
```

Backend URL:

```
http://localhost:4000
```

---

# Running the React Frontend

**Run from:**

```
m-project-2/frontend/
```

```bash
npm start
```

Available at:

```
http://localhost:3000
```

---

# Running the Solid Frontend

**Run from:**

```
m-project-2/frontend-sld/
```

```bash
npm run dev
```

Available at:

```
http://localhost:3001
```

---

# Running React + Backend

Open two terminals.

Terminal 1

```
m-project-2/backend/
```

```bash
npm run server
```

Terminal 2

```
m-project-2/frontend/
```

```bash
npm start
```

---

# Running Solid + Backend

Open two terminals.

Terminal 1

```
m-project-2/backend/
```

```bash
npm run server
```

Terminal 2

```
m-project-2/frontend-sld/
```

```bash
npm run dev
```

---

# Manual Testing

## ESLint

Run from:

```
m-project-2/
```

```bash
npm run lint
```

---

## Jest

Run from:

```
m-project-2/
```

```bash
npm test
```

or

```bash
npm test --workspace=backend
```

---

# Production Builds

## React

Run from:

```
m-project-2/frontend/
```

```bash
npm run build
```

Build output:

```
frontend/build/
```

---

## Solid

Run from:

```
m-project-2/frontend-sld/
```

```bash
npm run build
```

Build output:

```
frontend-sld/dist/
```

---

# Performance Testing

## Node Helper Scripts

Run from:

```
m-project-2/backend/
```

Generate tasks:

```bash
node gen-tasks.js
```

Seed load test users:

```bash
node seed-loadtest-users.js
```

Reset database:

```bash
node reset-database.js
```

---

## k6 Scripts

Run from:

```
m-project-2/backend/
```

Load test:

```bash
k6 run load-test.js
```

Ramp load test:

```bash
k6 run ramp-load-test.js
```

Task benchmark:

```bash
k6 run benchmark-tasks.js
```

Pagination benchmark:

```bash
k6 run benchmark-paginated-test.js
```

---

# Manual EC2 Deployment

Run on the EC2 instance.

```
~/m-project-2/
```

Update project:

```bash
git pull origin main

npm ci
```

---

Build React:

```bash
cd frontend

npm run build
```

Copy React build into Nginx:

```bash
sudo cp -r build/* /var/www/didyoudoityet/
```

---

Build Solid:

```bash
cd ../frontend-sld

npm run build
```

---

Restart backend:

```bash
pm2 restart all
```

---

# PM2 Commands

Start application:

```bash
cd ~/m-project-2/backend

pm2 start server.js --name didyoudoityet-api
```

Restart:

```bash
pm2 restart didyoudoityet-api
```

or

```bash
pm2 restart all
```

Stop:

```bash
pm2 stop didyoudoityet-api
```

Delete:

```bash
pm2 delete didyoudoityet-api
```

View processes:

```bash
pm2 list
```

View logs:

```bash
pm2 logs didyoudoityet-api
```

Save PM2 configuration:

```bash
pm2 save
```

---

# Terraform

All Terraform commands are run from:

```
m-project-2/infrastructure/
```

Format configuration:

```bash
terraform fmt
```

Validate configuration:

```bash
terraform validate
```

Preview infrastructure changes:

```bash
terraform plan
```

Apply infrastructure changes:

```bash
terraform apply
```

Recommended workflow:

```bash
terraform fmt
terraform validate
terraform plan
terraform apply
```

---

# GitHub Actions

## Backend Tests

Automatically:

* Checks out repository
* Runs `npm ci`
* Runs ESLint
* Runs Jest tests

## Frontend Build Check

Automatically:

* Runs `npm ci`
* Builds the React frontend
* Builds the Solid frontend

## Deploy to EC2

On successful workflows:

* SSH into EC2
* Pull latest changes
* Run `npm ci`
* Build React
* Copy React build to `/var/www/didyoudoityet/`
* Build Solid
* Restart the application with PM2
