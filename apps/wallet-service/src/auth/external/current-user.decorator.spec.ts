import 'reflect-metadata';
import { ExecutionContext } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';

import { CurrentUser, type CurrentUserPayload } from './current-user.decorator';

type RouteArgsMetadataValue = {
  index: number;
  factory: (data: unknown, ctx: ExecutionContext) => unknown;
  data?: unknown;
  pipes?: unknown[];
};

type RouteArgsMetadata = Record<string, RouteArgsMetadataValue>;

describe('CurrentUser decorator', () => {
  class DummyController {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    handler(_user: CurrentUserPayload) {
      return;
    }
  }

  const getFactoryInvoker = () => {
    // Apply @CurrentUser() to param index 0
    const paramDecorator = CurrentUser();
    paramDecorator(DummyController.prototype, 'handler', 0);

    const meta = Reflect.getMetadata(ROUTE_ARGS_METADATA, DummyController, 'handler') as
      | RouteArgsMetadata
      | undefined;

    if (!meta) {
      throw new Error('ROUTE_ARGS_METADATA not found');
    }

    const firstKey = Object.keys(meta)[0];

    if (!firstKey) {
      throw new Error('No metadata entries found');
    }

    const entry = meta[firstKey];

    if (typeof entry.factory !== 'function') {
      throw new Error('Decorator factory not found');
    }

    return (ctx: ExecutionContext) => entry.factory(entry.data, ctx);
  };

  it('should return req.user from execution context', () => {
    const user: CurrentUserPayload = {
      sub: 'user-1',
      email: 'user@email.com',
      roles: ['user'],
    };

    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as ExecutionContext;

    const invoke = getFactoryInvoker();
    const result = invoke(ctx);

    expect(result).toEqual(user);
  });

  it('should return undefined if req.user is undefined', () => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    } as ExecutionContext;

    const invoke = getFactoryInvoker();
    const result = invoke(ctx);

    expect(result).toBeUndefined();
  });
});
