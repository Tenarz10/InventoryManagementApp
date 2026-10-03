# Auth API

Base path: `/api/auth`

Passwords are hashed with bcrypt before they are stored. Login and registration return a JWT
that must be sent on protected routes:

```
Authorization: Bearer <token>
```

Tokens are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default `1d`).

## Endpoints

| Method | Path                 | Auth | Description                      |
| ------ | -------------------- | ---- | -------------------------------- |
| POST   | `/api/auth/register` | No   | Create an account, returns token |
| POST   | `/api/auth/login`    | No   | Log in, returns token            |
| GET    | `/api/auth/me`       | Yes  | The logged-in user               |

## Request bodies

**Register** `POST /api/auth/register`

```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "at-least-8-chars" }
```

New accounts always get the `staff` role; `role` in the request body is ignored.
Roles are `admin`, `manager` and `staff`.

**Login** `POST /api/auth/login`

```json
{ "email": "ada@example.com", "password": "at-least-8-chars" }
```

## Responses

```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJhbGciOi...",
  "data": { "_id": "...", "name": "Ada Lovelace", "email": "ada@example.com", "role": "staff" }
}
```

| Status | When                                                |
| ------ | --------------------------------------------------- |
| 400    | Invalid input                                       |
| 401    | Wrong email/password, or missing/invalid/expired token |
| 403    | Logged in but the role is not allowed (`authorize`) |
| 409    | Email already registered                            |
