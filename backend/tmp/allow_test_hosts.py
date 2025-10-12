from django.conf import settings
need = {"testserver","localhost","127.0.0.1"}
current = set(settings.ALLOWED_HOSTS or [])
missing = list(need - current)
for h in missing:
    settings.ALLOWED_HOSTS.append(h)
print("ALLOWED_HOSTS ->", settings.ALLOWED_HOSTS)
