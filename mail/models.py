from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    pass


class Email(models.Model):
    user = models.ForeignKey("User", on_delete=models.CASCADE, related_name="emails")
    sender = models.ForeignKey("User", on_delete=models.PROTECT, related_name="emails_sent")
    recipients = models.ManyToManyField("User", related_name="emails_received")
    subject = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    read = models.BooleanField(default=False)
    archived = models.BooleanField(default=False)
    starred = models.BooleanField(default=False,blank=True)
    deleted = models.BooleanField(default=False,blank=True)

    def serialize(self):
        return {
            "id": self.id,
            "username": self.sender.first_name +" "+self.sender.last_name,
            "sender": self.sender.email,
            "recipients": [user.first_name +" "+user.last_name for user in self.recipients.all()],
            "subject": self.subject,
            "body": self.body,
            "timestamp": self.timestamp.strftime("%b %d-%Y-%H:%M %p" ),
            "read": self.read,
            "archived": self.archived,
            "starred": self.starred,
            "deleted": self.deleted,

        }
