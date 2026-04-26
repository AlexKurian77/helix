import asyncio
import traceback
from models.schemas import GenerateRequest
from routers.generate import generate

async def main():
    req = GenerateRequest(query='What is the role of TFEB in autophagy?')
    try:
        res = await generate(req)
        print("Success!")
    except Exception as e:
        traceback.print_exc()

asyncio.run(main())
