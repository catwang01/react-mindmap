FROM python:latest

WORKDIR /app
COPY requirements.txt .
RUN pip install -i https://pypi.doubanio.com/simple/  -r requirements.txt
COPY . .
CMD python evernoteClient.py
