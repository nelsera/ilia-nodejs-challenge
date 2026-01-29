import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';

import { UserEventsPublisher, type UserCreatedEvent } from './user-events.publisher';
import { InternalTokenService } from '../auth/internal/internal-token.service';

describe('UserEventsPublisher', () => {
  let publisher: UserEventsPublisher;

  const clientMock = {
    emit: jest.fn(),
  };

  const internalTokenServiceMock = {
    signUsersServiceToken: jest.fn(),
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserEventsPublisher,
        { provide: 'RABBIT_CLIENT', useValue: clientMock },
        { provide: InternalTokenService, useValue: internalTokenServiceMock },
      ],
    }).compile();

    publisher = module.get(UserEventsPublisher);
  });

  it('should emit user.created with internal token', async () => {
    const fixedDate = new Date('2026-01-29T22:00:00.000Z');

    const dateSpy = jest
      .spyOn(global, 'Date')
      .mockImplementation(() => fixedDate as unknown as Date);

    internalTokenServiceMock.signUsersServiceToken.mockReturnValue('internal-token');

    clientMock.emit.mockReturnValue(of(undefined));

    await publisher.userCreated({ userId: 'u1', email: 'a@b.com' });

    const expectedEvent: UserCreatedEvent = {
      event: 'user.created',
      userId: 'u1',
      email: 'a@b.com',
      internalToken: 'internal-token',
      occurredAt: fixedDate.toISOString(),
    };

    expect(clientMock.emit).toHaveBeenCalledWith('user.created', expectedEvent);

    dateSpy.mockRestore();
  });

  it('should reject if emit observable errors', async () => {
    internalTokenServiceMock.signUsersServiceToken.mockReturnValue('internal-token');

    clientMock.emit.mockReturnValue(throwError(() => new Error('rmq failed')));

    await expect(publisher.userCreated({ userId: 'u1', email: 'a@b.com' })).rejects.toThrow(
      'rmq failed',
    );
  });
});
