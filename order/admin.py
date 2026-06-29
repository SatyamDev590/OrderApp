from django.contrib import admin

from order.models import Assignee, CardImage, CardStock, Customer, Job, JobStatus, Order

# Register your models here.
class JobInline(admin.TabularInline):
    model = Job
    extra = 1
    fields = ('job_id', 'job_name', 'status', 'assignee')
    readonly_fields = ('job_id',)

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        # Users with only can_change_status may edit status only
        if not request.user.has_perm('order.change_job'):
            for field in ('job_name', 'assignee'):
                if field not in readonly:
                    readonly.append(field)
        return readonly

    def has_delete_permission(self, request, obj=None):
        return request.user.has_perm('order.delete_job')
        

@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'mobile_number')
    search_fields = ('name', 'mobile_number')


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_id', 'customer', 'description')
    search_fields = ('customer__name', 'customer__mobile_number', 'order_id', 'description')
    inlines = [JobInline]

@admin.register(Assignee)
class AssigneeAdmin(admin.ModelAdmin):  
    list_display = ('assignee_id', 'name', 'mobile_number')
    search_fields = ('name', 'mobile_number', 'assignee_id')

@admin.register(JobStatus)
class JobStatusAdmin(admin.ModelAdmin):
    list_display = ('status_id', 'status_name')
    search_fields = ('status_name', 'status_id')

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('job_id', 'order', 'job_name', 'status', 'assignee')
    search_fields = ('job_name',
                     'order__customer__name',
                     'status__status_name',
                     'assignee__name',
                     'job_id',
                     'order__order_id',
                     'order__customer__mobile_number',
                     'order__description',
                     )
    list_filter = ('status', 'assignee', 'order__customer__name')


@admin.register(CardImage)
class CardImageAdmin(admin.ModelAdmin):
    list_display = ('id', 'image')
    search_fields = ('card__code',)


@admin.register(CardStock)
class CardStockAdmin(admin.ModelAdmin):
    list_display = ('code', 'total_stock', 'reserved_stock', 'available_stock')
    search_fields = ('code',)

