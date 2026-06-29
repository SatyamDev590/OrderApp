from rest_framework import serializers
from .models import Assignee, Customer, Job, JobStatus, Order


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ['id', 'name', 'mobile_number']


class AssigneeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assignee
        fields = ['assignee_id', 'name', 'mobile_number']


class JobStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = JobStatus
        fields = ['status_id', 'status_name']


class JobCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['job_name', 'status', 'assignee', 'delivery_date']


class OrderCreateSerializer(serializers.Serializer):
    """
    Accepts either:
      - customer_id (existing customer)
      - customer_name + customer_mobile (new customer — created on the fly)
    """
    customer_id = serializers.PrimaryKeyRelatedField(
        queryset=Customer.objects.all(), required=False, allow_null=True
    )
    customer_name = serializers.CharField(required=False, allow_blank=True)
    customer_mobile = serializers.CharField(required=False, allow_blank=True)
    description = serializers.CharField(required=False, allow_blank=True, default='')
    jobs = JobCreateSerializer(many=True)

    def validate(self, data):
        has_existing = bool(data.get('customer_id'))
        has_new = bool(data.get('customer_name')) and bool(data.get('customer_mobile'))
        if not has_existing and not has_new:
            raise serializers.ValidationError(
                'Provide either customer_id or both customer_name and customer_mobile.'
            )
        return data

    def create(self, validated_data):
        jobs_data = validated_data.pop('jobs')

        # Pop customer fields up-front so they never leak into Order(**validated_data)
        customer_obj  = validated_data.pop('customer_id', None)
        customer_name = validated_data.pop('customer_name', None)
        customer_mobile = validated_data.pop('customer_mobile', None)

        if customer_obj is None:
            # New customer path – name + mobile are required (enforced by validate())
            print(f"Creating new customer: {customer_name} ({customer_mobile})")
            customer_obj, _ = Customer.objects.update_or_create(
                name=customer_name,
                defaults={'mobile_number': customer_mobile},
            )

        order = Order(customer=customer_obj, **validated_data)
        order.save()
        for job_data in jobs_data:
            Job(order=order, **job_data).save()
        return order


class JobDetailSerializer(serializers.ModelSerializer):
    status = serializers.CharField(source='status.status_name')
    assignee = serializers.CharField(source='assignee.name')

    class Meta:
        model = Job
        fields = ['job_id', 'job_name', 'status', 'assignee', 'delivery_date']


class OrderDetailSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    jobs = JobDetailSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ['order_id', 'customer', 'description', 'order_date', 'jobs']


# Alias used for both list (dashboard) and post-create response
OrderListSerializer = OrderDetailSerializer


class OrderUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = ['description']


class JobUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = ['job_name', 'status', 'assignee', 'delivery_date']


# Inventory-related serializers
import json

from rest_framework import serializers

from .models import CardStock, CardImage, CardPrice


class CardPriceSerializer(serializers.ModelSerializer):

    class Meta:
        model = CardPrice
        fields = (
            "id",
            "min_quantity",
            "max_quantity",
            "price",
        )


class CardImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = CardImage
        fields = ("id", "image", "is_primary")

    def get_image(self, obj):
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url


class CardStockSerializer(serializers.ModelSerializer):

    prices = CardPriceSerializer(many=True)
    images = CardImageSerializer(many=True, read_only=True)

    class Meta:
        model = CardStock
        fields = (
            "id",
            "code",
            "images",
            "total_stock",
            "reserved_stock",
            "available_stock",
            "prices",
        )
        read_only_fields = (
            "reserved_stock",
            "available_stock",
        )

    def create(self, validated_data):

        prices = validated_data.pop("prices")

        card = CardStock.objects.create(**validated_data)

        CardPrice.objects.bulk_create([
            CardPrice(card=card, **price)
            for price in prices
        ])

        return card

    def update(self, instance, validated_data):

        prices = validated_data.pop("prices", None)

        for key, value in validated_data.items():
            setattr(instance, key, value)

        instance.save()

        if prices is not None:

            instance.prices.all().delete()

            CardPrice.objects.bulk_create([
                CardPrice(card=instance, **price)
                for price in prices
            ])

        return instance
