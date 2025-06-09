from flask import Flask

app = Flask(__name__)

@app.route('/')
def index():
    return "Auth Service is running!"  # Ganti sesuai service

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
