from django.db import models, transaction
from django.db.models import F

# Create your models here.

class Sequence(models.Model):
    """
    A simple named counter that only ever increases.
    Used to generate ORD-XXX / JOB-XXX IDs that survive record deletion.
    """
    name = models.CharField(max_length=50, primary_key=True)
    value = models.PositiveIntegerField(default=0)

    @classmethod
    def next(cls, name):
        """Atomically increment and return the next value for the given name."""
        with transaction.atomic():
            cls.objects.get_or_create(pk=name)
            cls.objects.filter(pk=name).update(value=F('value') + 1)
            return cls.objects.values_list('value', flat=True).get(pk=name)

class Customer(models.Model):
    name = models.CharField(max_length=100)
    mobile_number = models.CharField(max_length=15)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.mobile_number})"


class Order(models.Model):
    order_id = models.CharField(primary_key=True, max_length=20, editable=False)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name='orders', null=True)
    description = models.TextField(blank=True, null=True)
    order_date = models.DateTimeField(auto_now_add=True)
    

    def save(self, *args, **kwargs):
        if not self.order_id:
            self.order_id = f"ORD-{Sequence.next('order'):03d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_id} - {self.customer.name}"
    
class Assignee(models.Model):
    assignee_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, blank=False, null=False)
    mobile_number = models.CharField(max_length=15, blank=False, null=False)

    def __str__(self):
        return self.name

class JobStatus(models.Model):
    status_id = models.AutoField(primary_key=True)
    status_name = models.CharField(max_length=50, blank=False, null=False)

    def __str__(self):
        return self.status_name

class Job(models.Model):
    def default_status():
        return JobStatus.objects.get_or_create(status_name='Not Started')[0]
    job_id = models.CharField(primary_key=True, max_length=20, editable=False)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='jobs')
    job_name = models.CharField(max_length=100, blank=False, null=False)
    status = models.ForeignKey(JobStatus, 
                               on_delete=models.PROTECT, 
                               null=False, blank=False, 
                               related_name='jobs',
                               default=default_status)
    assignee = models.ForeignKey(Assignee, on_delete=models.PROTECT, null=False, blank=False, related_name='jobs')
    delivery_date = models.DateField(blank=True, null=True)

    def save(self, *args, **kwargs):
        if not self.job_id:
            self.job_id = f"JOB-{Sequence.next('job'):03d}"
        super().save(*args, **kwargs)

    class Meta:
        permissions = [
            ('can_change_status', 'Can change status on a job'),
        ]

    def __str__(self):
        return f"Job {self.job_id} for Order {self.order.order_id}"
    

# Wedding Cards Inventory

class CardStock(models.Model):
    code = models.CharField(max_length=30, unique=True)
    total_stock = models.PositiveIntegerField(default=0)
    reserved_stock = models.PositiveIntegerField(default=0)

    @property
    def available_stock(self):
        return self.total_stock - self.reserved_stock

    def __str__(self):
        return self.code

class CardImage(models.Model):
    card = models.ForeignKey(
        CardStock,
        on_delete=models.CASCADE,
        related_name="images"
    )
    image = models.ImageField(upload_to="cards/")
    is_primary = models.BooleanField(default=False)

class CardPrice(models.Model):
    card = models.ForeignKey(
        CardStock,
        on_delete=models.CASCADE,
        related_name="prices"
    )

    min_quantity = models.PositiveIntegerField()
    max_quantity = models.PositiveIntegerField(
        null=True,
        blank=True
    )
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2
    )

    class Meta:
        ordering = ["min_quantity"]

class StockTransaction(models.Model):

    STOCK_IN = "IN"
    STOCK_OUT = "OUT"
    RESERVED = "RESERVED"
    RELEASED = "RELEASED"
    
    TYPES = (
        (STOCK_IN, "Stock In"),
        (STOCK_OUT, "Stock Out"),
        (RESERVED, "Reserved"),
        (RELEASED, "Released"),
    )
    card = models.ForeignKey(
        CardStock,
        on_delete=models.PROTECT,
        related_name="transactions"
    )
    transaction_type = models.CharField(
        max_length=20,
        choices=TYPES
    )
    quantity = models.PositiveIntegerField()
    remarks = models.CharField(
        max_length=255,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

