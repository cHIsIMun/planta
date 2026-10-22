from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views
from .views import ClienteViewSet

router = DefaultRouter()
router.register(r"clientes", ClienteViewSet)

urlpatterns = [
    path("resumo/", views.resumo),
    path("", include(router.urls)),
]
