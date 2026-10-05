# Auth API

Base path: `/api/auth`

Passwords are hashed with bcrypt before they are stored. Login and registration return a JWT
that must be sent on protected routes:

```
Authorization: Bearer <token>
```

Tokens are signed with `JWT_SECRET` and expire after `JWT_EXPIRES_IN` (default `1d`).
On every request the user is loaded from the database, so a role change, deactivation or
deletion takes effect immediately, even for tokens that have not expired yet.

## Endpoints

| Method | Path                 | Auth | Description                                         |
| ------ | -------------------- | ---- | --------------------------------------------------- |
| POST   | `/api/auth/register` | No   | Create a `staff` account, returns token             |
| POST   | `/api/auth/login`    | No   | Log in, returns token                               |
| GET    | `/api/auth/me`       | Yes  | The logged-in user                                  |
| PATCH  | `/api/auth/me`       | Yes  | Update your own name or email                       |
| PATCH  | `/api/auth/password` | Yes  | Change your password, returns a new token           |
| POST   | `/api/auth/logout`   | Yes  | Sign out of every device (revokes all your tokens)  |

User accounts are managed by admins through [users-api.md](users-api.md).

## Roles and permissions

New accounts always get the `staff` role; `role` in the registration body is ignored. Only an admin
can change a role. The rules live in `PERMISSIONS` in `Utils/authConstants.js`.

| Action                                                   | staff | manager | admin |
| -------------------------------------------------------- | :---: | :-----: | :---: |
| View stock, summaries, low stock and movement history    |  ✅   |   ✅    |  ✅   |
| Stock in / stock out                                     |  ✅   |   ✅    |  ✅   |
| Create stock records, update settings, adjust quantities |       |   ✅    |  ✅   |
| Delete stock records                                     |       |         |  ✅   |
| View user accounts                                       |       |   ✅    |  ✅   |
| Create, edit, deactivate, delete users; reset passwords  |       |         |  ✅   |

Every route except register and login requires a logged-in, active account.

## Request bodies

**Register** `POST /api/auth/register`

```json
{ "name": "Ada Lovelace", "email": "ada@example.com", "password": "at-least-8-chars" }
```

Set `ALLOW_REGISTRATION=false` to turn off public sign-up; admins then create accounts with
`POST /api/users`.

**Login** `POST /api/auth/login`

```json
{ "email": "ada@example.com", "password": "at-least-8-chars" }
```

**Update profile** `PATCH /api/auth/me`

```json
{ "name": "Ada King", "email": "ada.king@example.com" }
```

`role`, `isActive` and `password` cannot be changed here.

**Change password** `PATCH /api/auth/password`

```json
{ "currentPassword": "old-password", "newPassword": "new-password" }
```

All existing tokens are revoked; use the `token` in the response from now on.

## Responses

```json
{
  "success": true,
  "message": "Logged in successfully",
  "token": "eyJhbGciOi...",
  "data": {
    "_id": "...",
    "name": "Ada Lovelace",
    "email": "ada@example.com",
    "role": "staff",
    "isActive": true,
    "lastLoginAt": "2026-10-04T09:00:00.000Z"
  }
}
```

| Status | When                                                              |
| ------ | ----------------------------------------------------------------- |
| 400    | Invalid input                                                     |
| 401    | Wrong email/password, or missing/invalid/expired/revoked token    |
| 403    | Account deactivated, role not allowed, or registration disabled   |
| 409    | Email already registered                                          |
| 429    | Too many attempts (see rate limits)                               |

## Rate limits

Per IP address. Set `TRUST_PROXY` to the number of proxies in front of the app so the real client IP is used.

| Route                      | Limit                                  |
| -------------------------- | -------------------------------------- |
| `POST /api/auth/login`     | 10 failed attempts per 15 minutes      |
| `POST /api/auth/register`  | 5 accounts per hour                    |
| `PATCH /api/auth/password` | 5 failed attempts per 15 minutes       |

## First admin

Set `ADMIN_NAME`, `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`, then run:

```bash
npm run create-admin
```

If an account with that email already exists it is promoted to admin and its password is left unchanged.
