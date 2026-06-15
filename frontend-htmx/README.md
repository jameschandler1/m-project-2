# HTMX Frontend

This is the HTMX version of the task management application frontend. It provides the same functionality as the React and Solid.js frontends but uses HTMX for dynamic interactions.

## Features

- User authentication (login/register)
- Task management (create, read, update, delete)
- Task filtering (all, due soon, completed)
- Task pagination
- Media file upload (images and videos)
- Payment integration with Stripe
- Responsive design

## Technology Stack

- **HTMX** - For dynamic interactions without complex JavaScript
- **Express.js** - Lightweight server for serving static files and proxying API requests
- **Stripe.js** - Payment processing
- **CSS** - Same styling as React and Solid frontends for consistency

## API Contract

This frontend maintains the same API contract as the React and Solid frontends:

### Authentication
- `GET /api/auth/me` - Get current user
- `POST /api/auth/login` - Login user
- `POST /api/auth/register` - Register user
- `POST /api/auth/logout` - Logout user

### Tasks
- `GET /api/tasks?page=1&limit=50` - Get tasks with pagination
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Payment
- `GET /api/payment/status` - Get payment status
- `POST /api/payment/create-pay-intent` - Create Stripe payment intent

### Upload
- `POST /api/upload` - Upload file
- `GET /api/upload/:taskId` - Get media files for task
- `GET /api/upload/file/:taskId/:mediaId` - Get media file
- `DELETE /api/upload/:mediaId` - Delete media file

All API requests include `credentials: 'include'` for session cookie handling.

## Installation

```bash
npm install
```

## Running Locally

```bash
npm start
```

The server will start on port 3000 (or the port specified in the PORT environment variable).

Make sure the backend is running on port 4000 (or update the proxy URL in server.js).

## Building

The build process is minimal since HTMX uses server-side rendering:

```bash
npm run build
```

This simply validates that the project is ready for deployment.

## Testing

```bash
npm test
```

## Environment Variables

- `PORT` - Server port (default: 3000)
- `SESSION_SECRET` - Secret for session encryption (default: 'htmx-frontend-secret')
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key for payments

## Deployment

This frontend is designed to be deployed to an EC2 instance and served using Nginx, just like the React and Solid frontends.

The build process generates static files that can be served directly by Nginx, or you can run the Express server behind Nginx as a reverse proxy.

## Styling

The styling is identical to the React and Solid frontends to ensure a consistent user experience across all implementations.
