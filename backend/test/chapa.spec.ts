import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { ConfigService } from '../src/common/config/config.service';
import { ServiceUnavailableException } from '../src/common/exceptions/http.exceptions';
import { ChapaService } from '../src/payments/chapa.service';

function createUnconfiguredService(secretKey = ''): ChapaService {
  return new ChapaService(
    new ConfigService({
      chapa: {
        secretKey,
        baseUrl: 'https://api.chapa.co/v1',
        webhookSecret: '',
      },
    }),
  );
}

describe('Chapa payment configuration', () => {
  it('does not initialize or verify payments without a real API key', async () => {
    const chapa = createUnconfiguredService();
    const isUnavailable = (error: unknown) =>
      error instanceof ServiceUnavailableException && error.getStatus() === 503;

    await assert.rejects(
      chapa.initialize({
        amount: 100,
        firstName: 'Patient',
        lastName: 'Example',
        phone: '+251911000000',
        txRef: 'cf-test-reference',
      }),
      isUnavailable,
    );
    await assert.rejects(chapa.verify('cf-test-reference'), isUnavailable);
  });

  it('rejects the sample placeholder key while accepting a configured test key', () => {
    assert.strictEqual(
      createUnconfiguredService('CHASECK_TEST-your-chapa-test-secret-key-here').isConfigured(),
      false,
    );
    assert.strictEqual(createUnconfiguredService('CHASECK_TEST-configured').isConfigured(), true);
  });
});
