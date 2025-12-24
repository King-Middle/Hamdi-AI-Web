import smtplib
from email.mime.text import MIMEText

def test_email():
    sender_email = "hamdi.ai.bot@gmail.com"
    # I've put the password you gave me here, ensuring no spaces
    sender_password = "yfdpxdabkwlbnnvk".replace(" ", "").strip()
    receiver_email = "hamdi.ai.bot@gmail.com" # Send to self for testing

    print(f"Attempting to connect to Gmail SMTP...")
    print(f"Sender: {sender_email}")
    print(f"Password length: {len(sender_password)}")

    try:
        msg = MIMEText("This is a test email from the Hamdi App debugger.")
        msg['Subject'] = "Hamdi App SMTP Test"
        msg['From'] = sender_email
        msg['To'] = receiver_email

        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            print("Connected to smtp.gmail.com:465")
            print("Attempting login...")
            server.login(sender_email, sender_password)
            print("Login successful!")
            server.sendmail(sender_email, receiver_email, msg.as_string())
            print("Email sent successfully!")

    except Exception as e:
        print("\n❌ FAILED")
        print(f"Error: {e}")
        print("\nTroubleshooting tips:")
        print("1. Check if 'hamdi.ai.bot@gmail.com' is 100% correct.")
        print("2. Ensure 2-Step Verification is ON for this account.")
        print("3. Generate a new App Password and replace it in the script.")

if __name__ == "__main__":
    test_email()
