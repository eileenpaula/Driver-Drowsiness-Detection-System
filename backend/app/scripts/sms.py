import smtplib
from email.message import EmailMessage
from datetime import datetime 

def rotate_providers(emg_name, emg_number, user_name): 
    phone_service_ext = ["tmomail.net", "txt.att.net", " vtext.com","messaging.sprintpcs.com"]
    for service in phone_service_ext:
        sms_emg(emg_name, emg_number, user_name, service)



# from emailToSMSConfig import senderEmail, gatewayAddress, appKey
def sms_emg(emg_name, emg_number, user_name, ext):
    
    msg = EmailMessage()
    msg.set_content(f"Urgent: {emg_name},\n{user_name} may be drowsy and is experiencing fatigue. Please contact them ASAP.")

    senderEmail = "roarymiami@gmail.com"
    appKey = "drac oube qwri twla"

    name = "Drowsy Driver"
    msg['From'] = f"{name}<{senderEmail}>" # 'email@address.com'
    msg['To'] = "+1" + emg_number + "@" + ext # '1112223333@vmobl.com'
    # msg['Subject'] = str(datetime.now())

    server = smtplib.SMTP('smtp.gmail.com', 587)
    server.starttls()
    server.login(senderEmail, appKey)

    server.send_message(msg)
    server.quit()

if __name__ == "__main__":
    number = "<yourphonenumber>"
    name = "Ronny"
    user_name = "test_user"
    sms_emg(name, number, user_name, "tmomail.net")
