# Testing

This project uses [Vitest](https://vitest.dev/) for unit testing.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

### Unit Tests

#### `calendar.test.ts`

Tests for the ICS calendar generation service:

- ✅ Valid ICS format generation
- ✅ Handling different outage statuses (ScheduleApplies, EmergencyShutdowns, WaitingForSchedule)
- ✅ Creating events only for "Definite" time slots
- ✅ Unique event UIDs
- ✅ Proper calendar structure

#### `cache.test.ts`

Tests for the cache service with mocked D1 database:

- ✅ Getting cached ICS files
- ✅ Expiration handling
- ✅ Setting cache entries
- ✅ Last update tracking
- ✅ Available groups management
- ✅ JSON parsing error handling

## Test Helpers

### `helpers.ts`

Provides utilities for testing:

- `createMockDb()` - Creates a mock Drizzle database for unit tests
- `mockScheduleData` - Sample schedule data for testing
- `mockEmergencyScheduleData` - Emergency shutdown data for testing

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { generateICS } from '../src/services/calendar';

describe('My Feature', () => {
  it('should do something', () => {
    const result = generateICS('1.1', mockSchedule);
    expect(result).toContain('BEGIN:VCALENDAR');
  });
});
```

### Mocking the Database

```typescript
import { createMockDb } from './helpers';
import { CacheService } from '../src/services/cache';

const mockDb = createMockDb();
const cacheService = new CacheService(mockDb);
```

## Coverage

Coverage reports are generated in the `coverage/` directory when running `npm run test:coverage`.

View the HTML report by opening `coverage/index.html` in your browser.

## Continuous Integration

Tests are automatically run on every commit to ensure code quality. Make sure all tests pass before submitting pull requests.

## Future Improvements

- Re-enable integration tests when Cloudflare Workers pool supports Vitest 4.x
- Add tests for Yasno API service
- Add E2E tests with actual browser testing
- Increase test coverage to 80%+
