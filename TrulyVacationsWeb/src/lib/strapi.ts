import { strapi } from '@strapi/client';

const client = strapi({
  baseURL: `${import.meta.env.STRAPI_URL}/api`,
  auth: import.meta.env.STRAPI_TOKEN,
});

export default client;
