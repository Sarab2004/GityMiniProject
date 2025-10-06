# Railway Environment Variables

## Required Variables:

```bash
DEBUG=False
SECRET_KEY=<<your-secret-key-here>>
ALLOWED_HOSTS=gityminiproject-production.up.railway.app,localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app
CSRF_TRUSTED_ORIGINS=https://phenomenal-lebkuchen-289df9.netlify.app,https://gityminiproject-production.up.railway.app
```

## Note:
- Replace `<<your-secret-key-here>>` with actual Django secret key
- `DATABASE_URL` is automatically provided by Railway PostgreSQL
- Update `ALLOWED_HOSTS` with your actual Railway domain

