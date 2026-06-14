# MongoDB Atlas Setup

Memora AI uses MongoDB Atlas for users, documents, refresh tokens, collections, and vector search metadata.

## 1. Create a cluster

1. Sign in at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a **free tier (M0)** or paid cluster in a region close to your backend.
3. Choose **MongoDB 7.x** (or latest supported).
4. Name the cluster (e.g. `memora-prod`).

Wait until the cluster status is **Active**.

## 2. Create a database user

1. **Database Access** → **Add New Database User**.
2. Authentication: **Password**.
3. Username: e.g. `memora-api`.
4. Generate a strong password and store it in your secret manager.
5. Privileges: **Read and write to any database** (or restrict to database `memora`).

## 3. Network access (IP allowlist)

1. **Network Access** → **Add IP Address**.
2. For development: add your current IP (**Add Current IP Address**).
3. For production backend on a fixed IP or NAT gateway: add that IP.
4. For Docker on a cloud VM: add the VM’s egress IP.
5. **Avoid** `0.0.0.0/0` in production unless your platform requires it and you accept the risk.

Atlas blocks connections from non-whitelisted IPs.

## 4. Connection string

1. **Database** → **Connect** → **Drivers**.
2. Copy the connection string, e.g.:

```
mongodb+srv://memora-api:<password>@memora-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

3. Replace `<password>` with the database user password (URL-encode special characters).
4. Add the database name before the query string:

```
mongodb+srv://memora-api:PASSWORD@memora-prod.xxxxx.mongodb.net/memora?retryWrites=true&w=majority
```

5. Set as `MONGODB_URI` in `backend/.env` or your deployment secrets.

## 5. Verify connectivity

From the backend directory with `.env` configured:

```bash
npm run startup-check
```

You should see `✓ MongoDB connection successful`.

## 6. Create an admin user (post-deploy)

New registrations get `role: "user"`. To access admin health endpoints, promote a user:

```javascript
// MongoDB shell or Compass — database: memora, collection: users
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Log in again to receive a new JWT with `role: "admin"`.

## 7. Next steps

- Create the Vector Search index: [ATLAS_VECTOR_SEARCH_SETUP.md](./ATLAS_VECTOR_SEARCH_SETUP.md)
- Configure backend env vars: [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- Deploy: [DEPLOYMENT.md](./DEPLOYMENT.md)

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| `Server selection timed out` | IP not allowlisted or wrong URI |
| `Authentication failed` | Wrong username/password or user not created |
| `bad auth : authentication failed` | Password not URL-encoded in connection string |
