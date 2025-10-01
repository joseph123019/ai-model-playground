# Test Guide - AI Model Playground

## Overview
This document describes the E2E (End-to-End) testing strategy for the AI Model Playground backend application.

## Test Coverage

### 1. **Health Check Tests**
- Basic server health check
- Verifies application is running correctly

### 2. **Authentication Tests**
- ✅ User registration with valid credentials
- ✅ Duplicate email validation
- ✅ Email format validation
- ✅ Password length validation (minimum 6 characters)
- ✅ User login with correct credentials
- ✅ Login failure with incorrect password
- ✅ Login failure with non-existent user
- ✅ JWT token generation
- ✅ Protected route access with valid token
- ✅ Protected route access without token
- ✅ Protected route access with invalid token

### 3. **Database Operations Tests**
- ✅ Session creation
- ✅ Response creation
- ✅ Session-Response relationship
- ✅ Retrieve sessions with associated responses
- ✅ Find user-specific sessions

### 4. **User Model Validation Tests**
- ✅ Unique email constraint enforcement
- ✅ User creation with activation fields
- ✅ Activation token handling
- ✅ Activation token expiration

### 5. **Relationship Tests**
- ✅ Cascade delete: Responses deleted when session is deleted
- ✅ User-Session relationship
- ✅ Session-Response relationship

### 6. **Utility Function Tests**
- ✅ Cost calculator for different AI models
- ✅ Model display name resolution
- ✅ Token cost calculation accuracy

## Running Tests

### Run All E2E Tests
```bash
npm run test:e2e
```

### Run Tests with Coverage
```bash
npm run test:e2e -- --coverage
```

### Run Specific Test Suite
```bash
npm run test:e2e -- --testNamePattern="Authentication"
```

### Run Tests in Watch Mode
```bash
npm run test:e2e -- --watch
```

## Test Database

The tests use the database configured in your `.env` file. For E2E tests, consider:

1. **Using a separate test database**:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/test_db"
   ```

2. **Or use SQLite for testing**:
   ```env
   DATABASE_URL="file:./test.db"
   ```

## Test Structure

```
test/
├── app.e2e-spec.ts        # Main E2E test suite
├── jest-e2e.json          # Jest configuration for E2E tests
└── setup-e2e.ts           # Test setup and configuration
```

## Test Data Cleanup

The test suite automatically:
- Cleans up test data before running tests
- Cleans up test data after all tests complete
- Uses test emails with `test@` prefix for easy identification

## CI/CD Integration

Add to your CI/CD pipeline:

```yaml
# Example GitHub Actions
- name: Run E2E Tests
  run: npm run test:e2e
  env:
    DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
    JWT_SECRET: test-secret
```

## Test Metrics

Current test suite includes:
- **Total Test Cases**: 25+
- **Test Categories**: 6
- **Average Test Duration**: ~5-10 seconds
- **Code Coverage Target**: 80%+

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Cleanup**: Test data is cleaned up before and after tests
3. **Assertions**: Each test has clear, specific assertions
4. **Naming**: Test descriptions clearly state what is being tested
5. **Coverage**: Tests cover happy paths and error scenarios

## Adding New Tests

When adding new features, follow this template:

```typescript
describe('New Feature', () => {
  it('should perform expected behavior', async () => {
    // Arrange - Set up test data
    const testData = { /* ... */ };
    
    // Act - Perform the action
    const response = await request(app.getHttpServer())
      .post('/endpoint')
      .send(testData);
    
    // Assert - Verify the result
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('expectedField');
  });
});
```

## Troubleshooting

### Tests Failing Due to Database Connection
- Verify `DATABASE_URL` in `.env`
- Ensure database is running
- Check database permissions

### Tests Timing Out
- Increase timeout in `jest-e2e.json`
- Check for infinite loops or hanging promises

### Flaky Tests
- Ensure proper test isolation
- Add appropriate waits for async operations
- Check for race conditions

## Future Enhancements

- [ ] Add WebSocket connection tests
- [ ] Add AI streaming response tests (mocked)
- [ ] Add rate limiting tests
- [ ] Add integration tests for Gmail API
- [ ] Add performance benchmarking tests
