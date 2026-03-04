/**
 * @swagger
 * /:
 *  get:
 *   tags:
 *    - App Routes
 *   summary: Welcome to PLYO
 *   description: This endpoint returns a welcome message to the PLYO API.
 *   responses:
 *    200:
 *     description: A welcome message to the PLYO API.
 */

/**
 * @swagger
 * /auth/register:
 *  post:
 *   tags:
 *    - Auth
 *   summary: Register a new user
 *   description: Creates a new user account.
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        email:
 *         type: string
 *         format: email
 *        password:
 *         type: string
 *       required:
 *        - email
 *        - password
 *      example:
 *       email: "kate@example.com"
 *       password: "secret123"
 *   responses:
 *    201:
 *     description: User registered successfully
 *    400:
 *     description: Validation error
 *    500:
 *     description: Server error
 */

/**
 * @swagger
 * /auth/login:
 *  post:
 *   tags:
 *    - Auth
 *   summary: Login
 *   description: Logs a user in and returns a JWT token.
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        email:
 *         type: string
 *         format: email
 *        password:
 *         type: string
 *       required:
 *        - email
 *        - password
 *      example:
 *       email: "kate@example.com"
 *       password: "secret123"
 *   responses:
 *    200:
 *     description: Login successful
 *    400:
 *     description: Validation error
 *    401:
 *     description: Invalid credentials
 *    500:
 *     description: Server error
 */

/**
 * @swagger
 * /applications:
 *  post:
 *   tags:
 *    - Applications
 *   summary: Create an application
 *   description: Creates a new job application entry. Requires a valid JWT token (auth-token header).
 *   security:
 *    - ApiKeyAuth: []
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       $ref: '#/components/schemas/Application'
 *      example:
 *       companyName: "Salling Group"
 *       roleTitle: "API Management Intern"
 *       status: "applied"
 *       location: "Aarhus"
 *       workType: "hybrid"
 *       priority: "high"
 *       notes: "Follow up next week"
 *       tags: ["internship", "denmark"]
 *       createdBy: "USER_ID_HERE"
 *   responses:
 *    201:
 *     description: Application created successfully
 *    400:
 *     description: Validation error
 *    401:
 *     description: Unauthorized
 *    500:
 *     description: Server error
 */

/**
 * @swagger
 * /applications:
 *  get:
 *   tags:
 *    - Applications
 *   summary: Get all applications
 *   description: Returns a list of all applications.
 *   responses:
 *    200:
 *     description: List of applications
 *    500:
 *     description: Server error
 */

/**
 * @swagger
 * /applications/{id}:
 *  get:
 *   tags:
 *    - Applications
 *   summary: Get an application by ID
 *   description: Returns a single application by its ID.
 *   parameters:
 *    - in: path
 *      name: id
 *      required: true
 *      schema:
 *       type: string
 *   responses:
 *    200:
 *     description: Application found
 *    404:
 *     description: Application not found
 *    500:
 *     description: Server error
 */

/**
 * @swagger
 * /applications/{id}:
 *  patch:
 *   tags:
 *    - Applications
 *   summary: Update an application by ID
 *   description: Updates an existing application by its ID. Requires a valid JWT token (auth-token header).
 *   security:
 *    - ApiKeyAuth: []
 *   parameters:
 *    - in: path
 *      name: id
 *      required: true
 *      schema:
 *       type: string
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        companyName:
 *         type: string
 *        roleTitle:
 *         type: string
 *        status:
 *         type: string
 *         enum: ["draft","planned","applied","interview","assignment","offer","rejected","withdrawn"]
 *        companyWebsite:
 *         type: string
 *        jobPostUrl:
 *         type: string
 *        applicationUrl:
 *         type: string
 *        location:
 *         type: string
 *        workType:
 *         type: string
 *         enum: ["onsite","hybrid","remote"]
 *        priority:
 *         type: string
 *         enum: ["low","medium","high"]
 *        dateApplied:
 *         type: string
 *         format: date-time
 *        deadline:
 *         type: string
 *         format: date-time
 *        nextFollowUpAt:
 *         type: string
 *         format: date-time
 *        notes:
 *         type: string
 *        tags:
 *         type: array
 *         items:
 *          type: string
 *        cvUrl:
 *         type: string
 *        coverLetterUrl:
 *         type: string
 *        otherDocUrls:
 *         type: array
 *         items:
 *          type: string
 *   responses:
 *    200:
 *     description: Application updated successfully
 *    400:
 *     description: Validation error
 *    401:
 *     description: Unauthorized
 *    404:
 *     description: Application not found
 *    500:
 *     description: Server error
 */

/**
 * @swagger
 * /applications/{id}:
 *  delete:
 *   tags:
 *    - Applications
 *   summary: Delete an application by ID
 *   description: Deletes an existing application by its ID. Requires a valid JWT token (auth-token header).
 *   security:
 *    - ApiKeyAuth: []
 *   parameters:
 *    - in: path
 *      name: id
 *      required: true
 *      schema:
 *       type: string
 *   responses:
 *    200:
 *     description: Application deleted successfully
 *    401:
 *     description: Unauthorized
 *    404:
 *     description: Application not found
 *    500:
 *     description: Server error
 */