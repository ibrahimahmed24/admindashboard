import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',   // مسار schema
  datasource: {
    url: process.env.DATABASE_URL!, // بيجيب الـ URL من .env
  },
});
