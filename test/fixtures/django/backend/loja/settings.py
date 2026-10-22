from celery.schedules import crontab

ROOT_URLCONF = "loja.urls"
INSTALLED_APPS = ["rest_framework", "vendas"]

CELERY_BEAT_SCHEDULE = {
    "reenviar-emails": {
        "task": "vendas.tasks.reenviar_pendentes",
        "schedule": crontab(minute=0, hour=3),
    },
}
