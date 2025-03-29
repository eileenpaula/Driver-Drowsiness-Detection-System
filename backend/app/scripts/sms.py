from twilio.rest import Client

def send_sms():
    # Your Twilio account SID and Auth Token (found in your Twilio console)
    account_sid = ''
    auth_token = ''

    # Initialize the Twilio client
    client = Client(account_sid, auth_token)

    # Define the message parameters
    to_phone_number = ''  # Replace with the phone number you want to send the SMS to
    from_phone_number = ''  # Replace with your Twilio phone number
    message_body = 'TEST TEST TEST  TEST '

    # Send the SMS
    message = client.messages.create(
        body=message_body,  # Message content
        from_=from_phone_number,  # Twilio phone number
        to=to_phone_number  # Recipient's phone number
    )

# Print the SID of the sent message (optional, for logging purposes)
    return f"Message sent with SID: {message.sid}"
