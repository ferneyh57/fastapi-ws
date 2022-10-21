from tortoise import fields, models
from tortoise.contrib.pydantic.creator import pydantic_model_creator


class Messages(models.Model):
    """
    The User model
    """

    id = fields.IntField(pk=True)
    #: This is a username
    message = fields.CharField(max_length=500)
    sender = fields.CharField(max_length=240)
    receiver = fields.CharField(max_length=240)
    date = fields.IntField()


Message_Pydantic = pydantic_model_creator(Messages, name="Message")
MessageIn_Pydantic = pydantic_model_creator(
    Messages, name="MessageIn", exclude_readonly=True)
