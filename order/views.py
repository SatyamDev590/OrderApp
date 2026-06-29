from django.shortcuts import get_object_or_404, render
from rest_framework import generics, mixins, status
from rest_framework.response import Response

from .models import Assignee, Customer, Job, JobStatus, Order
from .serializers import (
    AssigneeSerializer,
    CustomerSerializer,
    JobCreateSerializer,
    JobDetailSerializer,
    JobStatusSerializer,
    JobUpdateSerializer,
    OrderCreateSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    OrderUpdateSerializer,
)
from .whatsapp import notify_order_created


class OrderView(generics.ListCreateAPIView):
    """GET  /api/orders/  → dashboard list
       POST /api/orders/  → create order + jobs"""
    queryset = (
        Order.objects
        .prefetch_related('jobs__status', 'jobs__assignee')
        .order_by('-order_id')
    )

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return OrderCreateSerializer
        return OrderListSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        try:
            notify_order_created(order)
        except Exception as exc:
            import logging
            logging.getLogger(__name__).error("WhatsApp notification failed: %s", exc)
        detail = OrderDetailSerializer(order)
        return Response(detail.data, status=status.HTTP_201_CREATED)


class OrderDetailUpdateView(generics.RetrieveUpdateAPIView):
    """GET   /api/orders/<order_id>/  → single order detail
       PATCH /api/orders/<order_id>/  → update order fields"""
    queryset = Order.objects.prefetch_related('jobs__status', 'jobs__assignee')
    lookup_field = 'order_id'

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return OrderUpdateSerializer
        return OrderDetailSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = OrderUpdateSerializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(OrderDetailSerializer(order).data)
class JobUpdateView(mixins.DestroyModelMixin, generics.UpdateAPIView):
    """PATCH  /api/jobs/<job_id>/  → update job fields
       DELETE /api/jobs/<job_id>/  → delete a job"""
    queryset = Job.objects.select_related('status', 'assignee')
    lookup_field = 'job_id'
    serializer_class = JobUpdateSerializer

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        job = serializer.save()
        return Response(JobDetailSerializer(job).data)

    def delete(self, request, *args, **kwargs):
        return self.destroy(request, *args, **kwargs)


class JobCreateView(generics.CreateAPIView):
    """POST /api/orders/<order_id>/jobs/  → add a new job to an existing order"""
    serializer_class = JobCreateSerializer

    def create(self, request, *args, **kwargs):
        order = get_object_or_404(Order, order_id=self.kwargs['order_id'])
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = Job(order=order, **serializer.validated_data)
        job.save()
        return Response(JobDetailSerializer(job).data, status=status.HTTP_201_CREATED)


class AssigneeListView(generics.ListAPIView):
    queryset = Assignee.objects.all().order_by('name')
    serializer_class = AssigneeSerializer


class CustomerListView(generics.ListAPIView):
    queryset = Customer.objects.all().order_by('name')
    serializer_class = CustomerSerializer


class CustomerUpdateView(generics.UpdateAPIView):
    """PATCH /api/customers/<id>/ → update customer name / mobile"""
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    http_method_names = ['patch', 'put', 'head', 'options']


class JobStatusListView(generics.ListAPIView):
    queryset = JobStatus.objects.all().order_by('status_name')
    serializer_class = JobStatusSerializer


import json

from rest_framework import status, viewsets
from rest_framework.parsers import (
    MultiPartParser,
    FormParser,
)
from rest_framework.response import Response

from .models import CardStock, CardImage
from .serializers import CardStockSerializer

class CardStockViewSet(viewsets.ModelViewSet):

    queryset = CardStock.objects.prefetch_related(
        "prices", "images"
    )

    serializer_class = CardStockSerializer

    parser_classes = (
        MultiPartParser,
        FormParser,
    )

    def create(self, request, *args, **kwargs):
        # Build a plain dict so DRF never treats it as HTML form input.
        # QueryDict + html.parse_list would lose the pre-parsed prices list.
        data = {key: request.data[key] for key in request.data}
        if "prices" in data:
            data["prices"] = json.loads(data["prices"])

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        card = serializer.save()

        # Attach uploaded images; the first one is primary
        image_files = request.FILES.getlist("images")
        for idx, img_file in enumerate(image_files):
            CardImage.objects.create(
                card=card,
                image=img_file,
                is_primary=(idx == 0),
            )

        headers = self.get_success_headers(serializer.data)
        return Response(
            self.get_serializer(card).data,
            status=status.HTTP_201_CREATED,
            headers=headers,
        )