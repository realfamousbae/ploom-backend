import { MulterError } from 'multer';
import { handleMiddlewareErrors } from '../src/types/errors.ts';
import { Code } from '../src/types/types.ts';
import { trace } from './testhub.ts';

/**
 * Mocking Express Response
 */
class MockResponse {
  public statusCode: number = 200;
  public jsonData: any = null;

  public status(code: number): this {
    this.statusCode = code;
    return this;
  }

  public json(data: any): this {
    this.jsonData = data;
    return this;
  }
}

export function runTest(): void {
  // Test case 1: MulterError
  {
    const error = new MulterError('LIMIT_FILE_SIZE', 'image');
    const req = {} as any;
    const res = new MockResponse();
    const next = () => {};

    handleMiddlewareErrors(error, req, res as any, next);

    const success = res.statusCode === Code.BadRequest &&
                    res.jsonData?.message?.includes('Multer error:');

    trace('errors', 34, 'MulterError handled correctly:', success);
    if (!success) {
        throw new Error(`MulterError test failed: status=${res.statusCode}, json=${JSON.stringify(res.jsonData)}`);
    }
  }

  // Test case 2: Generic Error
  {
    const error = new Error('Generic error');
    const req = {} as any;
    const res = new MockResponse();
    let nextCalledWithError: any = null;
    const next = (err: any) => {
      nextCalledWithError = err;
    };

    handleMiddlewareErrors(error, req, res as any, next);

    const success = nextCalledWithError === error && res.jsonData === null;
    trace('errors', 53, 'Generic error passed to next():', success);
    if (!success) {
        throw new Error(`Generic error test failed: nextCalledWithError=${nextCalledWithError}, res.jsonData=${JSON.stringify(res.jsonData)}`);
    }
  }
}
