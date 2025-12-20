# Default Credentials

## Client Accounts

When a new client is created (either through the Create Client page or when creating a case), the default password is:

**Password: `client123`**

### First Login Process

1. Client logs in with their username and the default password `client123`
2. System detects that `passwordChanged` is `false`
3. User is prompted to change their password immediately
4. After password change, user is redirected to the dashboard
5. User cannot access the system until password is changed

### Username Format

Client usernames are auto-generated in the format:
- `client.{patient-name}` (lowercase, spaces replaced with dots)
- Example: `client.mohammed.ali`

### Notes

- All new clients start with `passwordChanged: false`
- Password change is mandatory on first login
- After password change, `passwordChanged` is set to `true`
- The default password is temporary and should be changed immediately

