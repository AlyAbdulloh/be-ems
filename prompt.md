Create a modern NestJS REST API boilerplate from
scratch.
Requirements:

* Use the latest stable NestJs setup with
TypeScript.
* Use REST API architecture, not GraphgL.
* Use MySQL as the database.
* Use Prisma ORM.
* Add environment configuration using '.env*.
* Add validation using `class-validator' and
~class-transformer`.
* Add global validation pipe.
* Add Swagger/0penAPI documentation.
* Add basic health check endpoint.
* Add authentication module with JWT.
* Add users module with CRUD endpoints.
* Add password hashing using bcrypt.
* Add role-based access control with roles:
"admin` and `user`.
* Add pagination support for list endpoints.
* Add consistent API response format.
* Add centralized error handling.
* Add request logging middleware or interceptor.
* Add CORS configuration.
* Add proper project structure using modules,
controllers, services, DTOs, guards, decorators.
and pipes where appropriate.
* Add seed script for creating an admin user.
* Add unit tests for at least one service.
* Add README.md with setup instructions.

Expected endpoints:
* `GET /health`
* `POST /auth/register`
* `POST /auth/login`
* `GET /users`
* `GET /users/:id`
* `POST /users`
* `PATCH /users/:id`
* `DELETE /users/:id`
