# USER-GUIDE.md

# User Guide & Features

## Overview

DidYouDoItYet is a personal task management application designed to help users organize work, monitor progress, and manage daily tasks through a simple web interface.

After creating an account and logging in, users can create, update, complete, and delete tasks while organizing them into categories and attaching media files.

---

# User Authentication

Users can:

* Register a new account
* Log in securely
* Log out using the navigation bar

Authentication is handled using JWT (JSON Web Tokens), ensuring users only have access to their own data.

---

# Task Management

Users create and edit tasks using a submission form containing the following fields.

| Field        | Type                  |
| ------------ | --------------------- |
| Title        | Text                  |
| Due Date     | Date                  |
| Category     | Text                  |
| Completed    | Checkbox              |
| Description  | Multi-line Text       |
| Media Upload | File stored in AWS S3 |

Users can:

* Create tasks
* View tasks
* Edit existing tasks
* Mark tasks as completed
* Delete unwanted tasks

---

# Categories

Tasks can be organized into categories, making it easier to group similar work and improve navigation.

---

# Media Uploads

Each task supports optional media attachments.

Uploaded files are stored in an AWS S3 bucket and remain associated with the corresponding task.

---

# Pagination

Task lists are displayed using pagination so that large collections of tasks can be browsed efficiently without loading every task simultaneously.

---

# Subscription Features

The application includes a Stripe-powered subscription demonstration.

Features include:

* Task counter
* Usage tracking
* Paywall
* Stripe checkout flow
* Successful payment confirmation messaging
* Failed or cancelled payment messaging

The task counter displays current usage and prompts users to upgrade when the configured task limit has been reached.

---

# Frontend Options

The application includes two frontend implementations.

## React

Primary production frontend built using React.

## Solid.js

Alternative frontend built using Solid.js while maintaining equivalent functionality and styling.

---

# Security Features

The application includes:

* JWT authentication
* bcrypt password hashing
* Input validation
* Parameterized SQL queries
* CORS protection

---

# Infrastructure

The production application is hosted on AWS using:

* EC2
* Nginx
* PM2
* AWS S3
* Terraform
* GitHub Actions CI/CD

---

# Performance

Application scalability is evaluated using k6 performance testing scripts that measure:

* Response times
* Request throughput
* Pagination performance
* Concurrent user behavior
* API scalability
