# Users API

Base path: `/api/users`

Every endpoint requires `Authorization: Bearer <token>` (see [auth-api.md](auth-api.md)).
Managers can view accounts; only admins can change them.

## Endpoints

| Method | Path                           | Roles          | Description                                    |
| ------ | ------------------------------ | -------------- | ---------------------------------------------- |
| GET    | `/api/users`                   | manager, admin | List users                                     |
| POST   | `/api/users`                   | admin          | Create a user with any role                    |
| GET    | `/api/users/:userId`           | manager, admin | One user                                       |
| PATCH  | `/api/users/:userId`           | admin          | Change name, email, role or active status      |
| PATCH  | `/api/users/:userId/password`  | admin          | Set a new password and sign the user out       |
| DELETE | `/api/users/:userId`           | admin          | Delete a user                                  |

### Query parameters

- `GET /api/users`: `role` (`admin`, `manager`, `staff`), `isActive` (`true`/`false`), `page`, `limit` (max 100)

## Request bodies

**Create user** `POST /api/users`

```json
{ "name": "Grace Hopper", "email": "grace@example.com", "password": "at-least-8-chars", "role": "manager" }
```

`role` defaults to `staff`.

**Update user** `PATCH /api/users/:userId`

```json
{ "role": "manager", "isActive": false }
```

Any of `name`, `email`, `role`, `isActive`. A deactivated user cannot log in and their existing
tokens stop working straight away. Prefer deactivating over deleting: deleted users show up as
`null` in the `performedBy` field of their past stock movements.

**Reset password** `PATCH /api/users/:userId/password`

```json
{ "newPassword": "at-least-8-chars" }
```

## Safety rules

- Admins cannot remove their own admin role, deactivate themselves, or delete themselves.
- The last active admin cannot be demoted, deactivated or deleted; promote another admin first.

| Status | When                                                         |
| ------ | ------------------------------------------------------------ |
| 400    | Invalid input, or the change would break a safety rule       |
| 401    | Missing, invalid, expired or revoked token                   |
| 403    | Your role is not allowed to do this                          |
| 404    | No user with that id                                         |
| 409    | Email already in use                                         |
