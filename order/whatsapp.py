import json
import logging
from collections import defaultdict

from django.conf import settings
from twilio.rest import Client

logger = logging.getLogger(__name__)


def _e164(number):
    """Convert any local 10-digit number to E.164 format (+91XXXXXXXXXX)."""
    cleaned = number.strip().replace(" ", "").replace("-", "")
    # Already has a + prefix — return as-is
    if cleaned.startswith("+"):
        return cleaned
    # Strip leading country digits without +
    for prefix in ("0091", "91"):
        if cleaned.startswith(prefix) and len(cleaned) > 10:
            cleaned = cleaned[len(prefix):]
            break
    country_code = getattr(settings, "WHATSAPP_COUNTRY_CODE", "+91")
    return f"{country_code}{cleaned}"


def _client():
    return Client(
        getattr(settings, "TWILIO_ACCOUNT_SID", ""),
        getattr(settings, "TWILIO_AUTH_TOKEN", ""),
    )


def _send(phone, content_sid, content_variables):
    print(f"Sending WhatsApp to {phone} (template: {content_sid}) with variables: {content_variables}")
    from_number = getattr(settings, "TWILIO_WHATSAPP_FROM", "")
    to_number = f"whatsapp:{_e164(phone)}"
    try:
        message = _client().messages.create(
            from_=from_number,
            content_sid=content_sid,
            content_variables=json.dumps(content_variables),
            to=to_number,
        )
        logger.info("WhatsApp sent to %s. SID: %s", to_number, message.sid)
    except Exception as exc:
        logger.error("WhatsApp failed for %s: %s", to_number, exc)


def notify_order_created(order):
    print("inside notify order created")
    jobs = list(order.jobs.select_related("assignee", "status").all())
    job_names = "\n ".join(j.job_name for j in jobs) or "—"
    max_delivery_date = str(max((j.delivery_date for j in jobs if j.delivery_date), default=None))
    # 1. Customer confirmation
    _send(
        phone=order.customer.mobile_number,
        content_sid=getattr(settings, "TWILIO_CUSTOMER_CONTENT_SID", ""),
        content_variables={
            "1": order.order_id,
            "2": max_delivery_date,
            "3": job_names,
        },
    )

    # 2. One message per assignee
    by_assignee = defaultdict(list)
    for job in jobs:
        by_assignee[job.assignee].append(job)

    for assignee, assignee_jobs in by_assignee.items():
        if not assignee.mobile_number:
            logger.warning("Assignee '%s' has no mobile - skipping", assignee.name)
            continue
        assignee_job_names = "\n ".join(j.job_name for j in assignee_jobs)
        _send(
            phone=assignee.mobile_number,
            content_sid=getattr(settings, "TWILIO_ASSIGNEE_CONTENT_SID", ""),
            content_variables={
                "1": order.order_id,
                "2": max_delivery_date,
                "3": assignee_job_names,
            },
        )

