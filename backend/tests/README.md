# Backend Tests

This directory contains unit tests for the backend API using the Jest testing framework.

## Dependencies

To run the tests, you need to have the following installed:

- Node.js (v18 or higher)
- npm

Install the required dependencies:

```bash
cd backend
npm install
```

The test dependencies are:
- `jest` - Testing framework

## Running Tests

To run all tests:

```bash
cd backend
npm test
```

To run tests in watch mode (for development):

```bash
cd backend
npm test -- --watch
```

To run tests with coverage:

```bash
cd backend
npm test -- --coverage
```

## Test Coverage

The test suite includes:

### Validation Tests (`validation.test.js`)
- Email format validation
- Email normalization
- Password validation (length, uppercase, lowercase, numbers)
- Empty password rejection

### Task Utilities Tests (`taskUtils.test.js`)
- Task sorting by due date and ID
- Task sorting with missing due dates
- Due date formatting
- Overdue task detection

## Test Files

- `validation.test.js` - Tests for email and password validation logic
- `taskUtils.test.js` - Tests for task sorting and date formatting utilities

## Continuous Integration

Tests are automatically run on GitHub Actions when:
- Code is pushed to the `main` branch
- Pull requests are created targeting the `main` branch

See `.github/workflows/test.yml` for the CI configuration.
