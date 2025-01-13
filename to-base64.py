import base64
import sys


f = open(sys.argv[1], "rb")
result = base64.b64encode(f.read()).decode('ascii')

if len(sys.argv) == 3 or sys.argv[3] == "array":
    print(f"const {sys.argv[2]} = Uint8Array.fromBase64(\"{str(result)}\");")
elif sys.argv[3] == "string":
    print(f"const {sys.argv[2]} = \"data:application/octet-stream;base64,{str(result)}\";")
else:
    raise Exception("Bad usage!")
