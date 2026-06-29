from django.urls import path
from .views import AssigneeListView, CustomerListView, CustomerUpdateView, JobCreateView, JobStatusListView, JobUpdateView, OrderDetailUpdateView, OrderView
from rest_framework.routers import DefaultRouter

from .views import CardStockViewSet

router = DefaultRouter()
urlpatterns = [
    path('orders/', OrderView.as_view(), name='orders'),
    path('orders/<str:order_id>/', OrderDetailUpdateView.as_view(), name='order-detail'),
    path('orders/<str:order_id>/jobs/', JobCreateView.as_view(), name='job-create'),
    path('jobs/<str:job_id>/', JobUpdateView.as_view(), name='job-update'),
    path('assignees/', AssigneeListView.as_view(), name='assignee-list'),
    path('job-statuses/', JobStatusListView.as_view(), name='jobstatus-list'),
    path('customers/', CustomerListView.as_view(), name='customer-list'),
    path('customers/<int:pk>/', CustomerUpdateView.as_view(), name='customer-update'),
]

router.register(
    "inventory",
    CardStockViewSet,
    basename="inventory"
)

urlpatterns = urlpatterns + router.urls