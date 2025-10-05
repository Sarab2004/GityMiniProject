# HSE Backend (Django + DRF)

## Requirements
- Python 3.11+
- PostgreSQL 14+

## Setup
1. Create and activate a virtual environment:
   ```bash
   python -m venv .venv
   .venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy the environment template and adjust values as needed:
   ```bash
   copy .env.example .env
   ```
4. Apply migrations:
   ```bash
   python manage.py migrate
   ```
5. Create an admin user (used for login and seeding):
   ```bash
   python manage.py createsuperuser
   ```
6. (Optional) Seed demo data:
   ```bash
   python manage.py seed_demo
   ```

## Running
```bash
python manage.py runserver
```
The API is available under `http://localhost:8000/api/v1/` and requires session authentication.

- Swagger docs: `http://localhost:8000/api/v1/docs/`
- OpenAPI schema: `http://localhost:8000/api/v1/schema/`

## Testing
```bash
python manage.py test
```

## Frontend Integration Notes
- All API requests must send `credentials: 'include'` to leverage Django session auth.
- Retrieve CSRF token via `GET /api/v1/auth/me` before making POST/PUT/PATCH/DELETE requests.
- Login endpoint: `POST /api/v1/auth/login` (payload `{ "username": "...", "password": "..." }`).
- Logout endpoint: `POST /api/v1/auth/logout`.
- Authentication guard: `GET /api/v1/auth/me` returns `401` when the session is missing/expired.
