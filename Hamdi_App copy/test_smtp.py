import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Test email configuration
sender_email = "hamdi.ai.bot@gmail.com"
sender_password = "yfdpxdabkwlbnnvk"
receiver_email = "test@example.com"  # Replace with your email to test

try:
    print("Testing SMTP connection...")
    
    message = MIMEMultipart("alternative")
    message["Subject"] = "HAMDI - Email Test"
    message["From"] = sender_email
    message["To"] = receiver_email
    
    text = "This is a test email from HAMDI app."
    html = "<html><body><p>This is a test email from HAMDI app.</p></body></html>"
    
    part1 = MIMEText(text, "plain")
    part2 = MIMEText(html, "html")
    
    message.attach(part1)
    message.attach(part2)
    
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        print("Connecting to Gmail SMTP server...")
        server.login(sender_email, sender_password)
        print("Login successful!")
        server.sendmail(sender_email, receiver_email, message.as_string())
        print(f"Email sent successfully to {receiver_email}!")
        
except Exception as e:
    print(f"Error: {e}")
    print("\nPossible issues:")
    print("1. Gmail App Password might be invalid or expired")
    print("2. 2-Factor Authentication needs to be enabled on the Gmail account")
    print("3. Need to generate a new App Password from Google Account settings")
