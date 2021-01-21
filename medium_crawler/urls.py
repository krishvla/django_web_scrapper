from django.urls import path, include
from medium_crawler import views

urlpatterns = [
    path('', views.HomePage.as_view(), name="home"),
]

