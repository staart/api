import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
import { TokensService } from './tokens.service';

const tokensService = new TokensService(
  new ConfigService({ security: { jwtSecret: 'example' } }),
);

describe('TokensService', () => {
  describe('generateUuid', () => {
    it('generated UUID of length', async () => {
      const uuid = tokensService.generateUuid();
      expect(uuid.length).toBe(36);
    });
    it('generated valid UUID', async () => {
      const uuid = tokensService.generateUuid();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });
  });

  describe('signJwt', () => {
    it('signs a JWT of length', async () => {
      const jwt = tokensService.signJwt('SUBJECT', { ok: true }, '1d', {});
      expect(jwt.length).toBe(163);
    });
    it('signs a valid JWT', async () => {
      const jwt = tokensService.signJwt('SUBJECT', { ok: true }, '1d', {});
      expect(jwt).toMatch(
        /^([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_=]+)\.([a-zA-Z0-9_\-\+\/=]*)/,
      );
    });
  });

  describe('verify', () => {
    it('verifies a JWT', async () => {
      const jwt = tokensService.signJwt('SUBJECT', { ok: true }, '1d', {});
      const verified = tokensService.verify('SUBJECT', jwt);
      expect(verified).toBeDefined();
    });
    it('verifies a JWT and gets data', async () => {
      const jwt = tokensService.signJwt('SUBJECT', { ok: true }, '1d', {});
      const verified = tokensService.verify<{ ok: boolean }>('SUBJECT', jwt);
      expect(verified.ok).toBeTruthy();
    });
  });

  describe('decode', () => {
    it('decodes a JWT', async () => {
      const jwt = tokensService.signJwt('SUBJECT', { ok: true }, '1d', {});
      const verified = tokensService.decode(jwt);
      expect(verified).toBeDefined();
    });
    it('decodes a JWT and gets data', async () => {
      const jwt = tokensService.signJwt('SUBJECT', { ok: true }, '1d', {});
      const verified = tokensService.decode<{ ok: boolean }>(jwt);
      expect(verified.ok).toBeTruthy();
    });
    it('decodes a JWT and with a wrong secret', async () => {
      const jwt = sign({ ok: true }, 'another-secret');
      const verified = tokensService.decode<{ ok: boolean }>(jwt);
      expect(verified.ok).toBeTruthy();
    });
  });
});
