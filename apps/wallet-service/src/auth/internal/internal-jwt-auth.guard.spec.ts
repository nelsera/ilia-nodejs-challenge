import { InternalJwtAuthGuard } from './internal-jwt-auth.guard';

describe('InternalJwtAuthGuard', () => {
  it('should be defined', () => {
    const guard = new InternalJwtAuthGuard();

    expect(guard).toBeDefined();
  });

  it('should have canActivate function (inherited from AuthGuard)', () => {
    const guard = new InternalJwtAuthGuard();

    expect(typeof (guard as unknown as { canActivate: unknown }).canActivate).toBe('function');
  });
});
