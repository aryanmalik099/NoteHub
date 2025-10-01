import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_password_reset_email(user, token):
    sender_email = os.getenv('MAIL_USERNAME')
    receiver_email = user.email
    password = os.getenv('MAIL_PASSWORD')

    # The URL the user will click in the email
    # NOTE: In production, you'll change 'localhost:3000' to your live frontend URL
    reset_url = f"http://localhost:3000/reset-password/{token}"

    message = MIMEMultipart("alternative")
    message["Subject"] = "Reset Your NoteHub Password"
    message["From"] = sender_email
    message["To"] = receiver_email

    # Email body
    text = f"""Hi {user.username},
    To reset your password, visit the following link:
    {reset_url}
    If you did not make this request then simply ignore this email and no changes will be made.
    """
    html = f"""\
    <html>
    <body>
        <p>Hi {user.username},<br>
        To reset your password, click the link below:<br>
        <a href="{reset_url}">Reset Your Password</a><br>
        If you did not make this request then simply ignore this email and no changes will be made.
        </p>
    </body>
    </html>
    """

    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")
    message.attach(part1)
    message.attach(part2)

    # Send the email
    try:
        with smtplib.SMTP(os.getenv('MAIL_SERVER'), int(os.getenv('MAIL_PORT'))) as server:
            server.starttls()
            server.login(sender_email, password)
            server.sendmail(sender_email, receiver_email, message.as_string())
        print("Password reset email sent successfully!")
    except Exception as e:
        print(f"Error sending email: {e}")