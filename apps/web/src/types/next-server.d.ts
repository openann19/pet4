/**
 * Next.js Server Type Shim
 *
 * Minimal type definitions for NextRequest and NextResponse to support
 * rate-limiting middleware in a Vite application.
 *
 * This is a compatibility layer - these types match the Next.js API
 * surface used by the middleware files.
 */

/**
 * NextRequest - compatible with Next.js App Router Request
 */
export interface NextRequest extends Request {
  readonly ip?: string;
  readonly headers: Headers;
  readonly url: string;
  readonly method: string;
  readonly body: ReadableStream<Uint8Array> | null;
  readonly cache: RequestCache;
  readonly credentials: RequestCredentials;
  readonly destination: RequestDestination;
  readonly integrity: string;
  readonly keepalive: boolean;
  readonly mode: RequestMode;
  readonly redirect: RequestRedirect;
  readonly referrer: string;
  readonly referrerPolicy: ReferrerPolicy;
  readonly signal: AbortSignal;
}

/**
 * NextResponse - compatible with Next.js App Router Response
 */
export class NextResponse extends Response {
  readonly headers: Headers;
  readonly status: number;
  readonly statusText: string;
  readonly ok: boolean;
  readonly redirected: boolean;
  readonly type: ResponseType;
  readonly url: string;

  constructor(body?: BodyInit | null, init?: ResponseInit) {
    super(body, init);
    this.headers = new Headers(init?.headers);
  }

  static json(data: unknown, init?: ResponseInit): NextResponse {
    return new NextResponse(JSON.stringify(data), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });
  }

  static redirect(url: string | URL, init?: number | ResponseInit): NextResponse {
    const status = typeof init === 'number' ? init : init?.status ?? 307;
    return new NextResponse(null, {
      ...(typeof init === 'object' ? init : {}),
      status,
      headers: {
        Location: typeof url === 'string' ? url : url.toString(),
        ...(typeof init === 'object' ? init.headers : {}),
      },
    });
  }

  static next(init?: ResponseInit): NextResponse {
    return new NextResponse(null, {
      ...init,
      status: init?.status ?? 200,
    });
  }
}

declare module 'next/server' {
  export type { NextRequest, NextResponse };
  export { NextResponse };
}
