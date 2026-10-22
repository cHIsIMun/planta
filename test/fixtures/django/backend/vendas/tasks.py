from celery import shared_task


@shared_task
def reenviar_pendentes():
    pendentes = []
    for email in pendentes:
        print(email)
