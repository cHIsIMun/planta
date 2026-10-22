from fastapi import FastAPI

from .routers import clientes

app = FastAPI()
app.include_router(clientes.router, prefix="/api/v1")
