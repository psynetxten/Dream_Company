import httpx
import asyncio

async def test():
    r = await httpx.AsyncClient().post(
        'https://dream-newspaper-phi.vercel.app/api/v1/auth/register-debug',
        json={'email': 'cto_debug_test@gmail.com', 'password': 'TestPass123!', 'full_name': 'CTO Test'}
    )
    print(r.status_code)
    print(r.text)

asyncio.run(test())
