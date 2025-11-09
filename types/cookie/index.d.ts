declare namespace Cookie {
  interface SerializeOptions {
    domain?: string;
    encode?(value: string): string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    secure?: boolean;
    sameSite?: true | false | 'lax' | 'strict' | 'none';
    priority?: 'low' | 'medium' | 'high';
    partitioned?: boolean;
  }
}

declare module 'cookie' {
  export type CookieSerializeOptions = Cookie.SerializeOptions;
}
