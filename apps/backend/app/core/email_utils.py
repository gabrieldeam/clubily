# backend/app/core/email_utils.py

import smtplib, ssl
from email.message import EmailMessage
from ..core.config import settings
from .email_templates import render_template

def send_email(to: str, subject: str, html: str):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to
    msg.set_content(html, subtype="html")

    context = ssl.create_default_context()
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
        server.starttls(context=context)
        server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(msg)

# ---------- helper para templates ----------
def send_templated_email(
    to: str,
    template_name: str,
    subject: str,
    **context,
):
    """
    Renderiza o HTML via Jinja2 e dispara o e-mail.
    """
    html = render_template(template_name, **context)
    send_email(to=to, subject=subject, html=html)