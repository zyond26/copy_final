const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mini EMR - ISO 27799 API',
      version: '1.0.0',
      description: 'RESTful API cho hệ thống quản lý bệnh án điện tử Mini EMR',
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Local Development Server' }
    ],
  },
  apis: [
    './src/routes/*.js',      // Quan trọng nhất
    './src/routes/**/*.js',
    './src/controllers/*.js'
  ],
};

const swaggerSpec = swaggerJSDoc(options);

const setupSwagger = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  console.log(' Swagger is running at http://localhost:3000/api-docs');
};

module.exports = setupSwagger;