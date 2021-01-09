# Tests

This API has both unit tests and end-to-end tests.

## Unit tests

Currently, unit tests are focused on single services in providers. In the near future, unit tests should be added to each module by mocking their services and testing their controllers.

Unit tests use [facebook/jest](https://github.com/facebook/jest). To run unit tests:

```bash
npm run test:unit
```

<details>
  <summary>Expected output</summary>

```
> jest --forceExit

 PASS  src/providers/dns/dns.service.spec.ts (14.789 s)
 PASS  src/providers/tokens/tokens.service.spec.ts (14.868 s)
 PASS  src/providers/geolocation/geolocation.service.spec.ts (14.951 s)
 PASS  src/providers/pwned/pwned.service.spec.ts (15.241 s)

Test Suites: 4 passed, 4 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        16.382 s
Ran all test suites.
```

</details>

## End-to-end tests

End-to-end tests use [visionmedia/supertest](https://github.com/visionmedia/supertest) for requests and [facebook/jest](https://github.com/facebook/jest) for assertions.

To run end-to-end tests:

```bash
npm run test:e2e
```

<details>
  <summary>Expected output</summary>

```
> export TEST=true; npx ts-node tests/test-before.ts && jest --runInBand --config ./tests/jest-e2e.json --forceExit

  AppController (e2e)
    ✓ gets / (49 ms)
    ✓ registers and logs in (5008 ms)
    ✓ gets user details (4231 ms)
    ✓ creates and uses API key (3424 ms)
```

</details>

The goal of end-to-end tests is not to test the behavior of each API endpoint, but to ensure the overall behavior of the system works. For this API, we perform the following steps:

1. Visit `/` and ensure it redirects to the GitHub project
2. Create a new user account and log in from that account
3. Get `/user/{id}` for the new account using the access token
4. Create an API key for the user with the `read-info` scope
5. Get `/user/{id}` for the new account using the API key

Here, (1) ensures that the app has launched successfully and is responding correctly to API requests. It also tests the `@Public()` decorator and shows that API endpoints may be available without any authentication requirements. (2) ensures that the database connection is working (new user added) and authentication endpoints are working. (3) and (4) show that authenticated routes work, and (5) tests that API key authentication works with scopes.

## See also

- [NestJS testing](https://docs.nestjs.com/fundamentals/testing)
