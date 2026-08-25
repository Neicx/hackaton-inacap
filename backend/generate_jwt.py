import os
import binascii

JWT_SECRET_KEY = binascii.hexlify(os.urandom(32)).decode()

print(JWT_SECRET_KEY)