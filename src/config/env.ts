import dotenv from "dotenv"

dotenv.config({path: "././.env.local"})

export const env = {
    MONGODB_URI: process.env.MONGODB_URI as string,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER as string,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID as string,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN as string,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
    NODE_ENV: process.env.NODE_ENV || "development",
    PEXELS_API_KEY: process.env.PEXELS_API_KEY as string,
    PORT: process.env.PORT || 5000,
    NEXT_BASE_URL: process.env.NEXT_BASE_URL,
    GOOGLE_CUSTOM_SEARCH_API: process.env.GOOGLE_CUSTOM_SEARCH_API as string,
    SEARCH_ENGINE_ID: process.env.SEARCH_ENGINE_ID as string,
    FAST2SMS_API_KEY: process.env.FAST2SMS_API_KEY as string,
    FAST2SMS_API_KEY_SMS: process.env.FAST2SMS_API_KEY_SMS as string,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL as string,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN as string,
}