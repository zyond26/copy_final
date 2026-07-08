const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini EMR - ISO 27799 API',
      version: '1.0.0',
      description:
        'RESTful API cho hệ thống quản lý bệnh án điện tử Mini EMR, tuân thủ ISO 27799.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Nhập JWT token (không cần prefix "Bearer")',
        },
      },
    },
  },
  apis: [__dirname.replace(/\\/g, '/') + '/../routes/*.js'],
};

const swaggerSpec = swaggerJSDoc(options);

/**
 * Mount Swagger UI middleware onto the Express app.
 * @param {import('express').Application} app
 */
const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(
    `[Swagger] Docs available at http://localhost:${process.env.PORT || 3000}/api-docs`,
  );
};

module.exports = setupSwagger;
