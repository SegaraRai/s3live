/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    readonly SECRET_REDIS_URI: string;
    /** `'<cluster>:<appId>:<key>:<secret>'` */
    readonly SECRET_PUSHER_CONFIG: string;
    readonly SECRET_JWT_SECRET: string;
    readonly SECRET_FRAGMENT_HMAC_SECRET: string;

    readonly SECRET_S3_ACCESS_KEY_ID: string;
    readonly SECRET_S3_SECRET_ACCESS_KEY: string;
    readonly S3_ENDPOINT_URL: string;
    readonly S3_REGION: string;
    readonly S3_BUCKET: string;

    /** `'https://www.example.org'` */
    readonly FRAGMENT_BASE_URI: string;

    readonly FRONTEND_ORIGIN: string;
  }
}
