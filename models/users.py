from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class Users(models.Model):
    """
    The User model
    """

    id = fields.IntField(pk=True)
    #: This is a username
    nickname = fields.CharField(max_length=50, unique=True)
    password = fields.CharField(max_length=128)
    status = fields.BooleanField()


User_Pydantic = pydantic_model_creator(Users, name="User")
UserIn_Pydantic = pydantic_model_creator(Users, name="UserIn")
