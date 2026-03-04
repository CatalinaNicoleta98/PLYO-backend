import swaggerUi from "swagger-ui-express";
import swaggerJSDoc from "swagger-jsdoc";
import { Application } from "express";
import path from "path";

// Swagger definition
export function setupDocs(app: Application) {

  const swaggerDefinition = {
    openapi: "3.0.0",

    info: {
      title: "PLYO API",
      version: "1.0.0",
      description:
        "PLYO API documentation for the job application tracking system.",
    },

    servers: [
      {
        url: "http://localhost:4000/api/",
        description: "Local development server",
      },
    ],

    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "auth-token",
        },
      },

      schemas: {

        User: {
          type: "object",
          properties: {
            _id: { type: "string" },

            email: {
              type: "string",
              format: "email",
            },

            password: {
              type: "string",
              description: "Hashed password",
            },

            createdAt: {
              type: "string",
              format: "date-time",
            },

            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },

          required: ["email", "password"],
        },

        Application: {
          type: "object",
          properties: {
            _id: { type: "string" },

            // Required fields
            companyName: { type: "string" },
            roleTitle: { type: "string" },

            status: {
              type: "string",
              enum: [
                "draft",
                "planned",
                "applied",
                "interview",
                "assignment",
                "offer",
                "rejected",
                "withdrawn",
              ],
            },

            // Optional details
            companyWebsite: { type: "string" },
            jobPostUrl: { type: "string" },
            applicationUrl: { type: "string" },

            location: { type: "string" },

            workType: {
              type: "string",
              enum: ["onsite", "hybrid", "remote"],
            },

            priority: {
              type: "string",
              enum: ["low", "medium", "high"],
            },

            dateApplied: {
              type: "string",
              format: "date-time",
            },

            deadline: {
              type: "string",
              format: "date-time",
            },

            nextFollowUpAt: {
              type: "string",
              format: "date-time",
            },

            notes: { type: "string" },

            tags: {
              type: "array",
              items: { type: "string" },
            },

            // Documents
            cvUrl: { type: "string" },
            coverLetterUrl: { type: "string" },

            otherDocUrls: {
              type: "array",
              items: { type: "string" },
            },

            // Ownership
            createdBy: { type: "string" },

            createdAt: {
              type: "string",
              format: "date-time",
            },

            updatedAt: {
              type: "string",
              format: "date-time",
            },
          },

          required: ["companyName", "roleTitle", "status", "createdBy"],
        },
      },
    },
  };

  // Swagger options
  const options = {
    swaggerDefinition,
    apis: [path.join(__dirname, 'swaggerRoutes.ts')], // paths to files containing OpenAPI definitions
  };

  // Swagger specification
  const swaggerSpec = swaggerJSDoc(options);

  // Create docs route
  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}