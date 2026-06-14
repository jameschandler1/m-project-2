# README.md

# DidYouDoItYet

DidYouDoItYet is a lightweight task management web application that allows users to create, organize, and track personal tasks through categorized task lists.

The project demonstrates a complete full-stack application deployed on AWS and includes a React frontend, Express.js backend, automated CI/CD pipelines, Infrastructure as Code using Terraform, AWS S3 media storage, and performance testing using k6.

---

# Technology Stack

## Backend

* Node.js
* Express.js
* MySQL
* JWT Authentication
* bcrypt Password Hashing
* Express Validator

## Frontend

* React
* Solid.js

## Infrastructure

* AWS EC2
* AWS S3
* Nginx
* PM2
* Terraform
* GitHub Actions CI/CD

## Testing

* Jest
* ESLint
* k6 Performance Testing

---

# Project Structure

```
m-project-2/
│
├── backend/
├── frontend/
├── frontend-sld/
├── infrastructure/
│
├── README.md
├── DEVELOPMENT.md
├── DEPLOYMENT.md
└── USER-GUIDE.md
```

---

# Available Frontends

The project includes two interchangeable frontend implementations:

* React
* Solid.js

Both communicate with the same Express REST API and provide equivalent functionality.

---

# Documentation

Additional project documentation is available in:

### USER-GUIDE.md

Describes the application from an end-user perspective, including available features and functionality.

### DEVELOPMENT.md

Contains local setup instructions, testing commands, development workflow, and performance testing scripts.

### DEPLOYMENT.md

Contains production deployment instructions, PM2 management, Terraform workflow, AWS infrastructure notes, and GitHub Actions deployment information.

---

# License

ISC
