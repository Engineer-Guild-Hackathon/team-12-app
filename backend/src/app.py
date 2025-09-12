from flask import Flask
from src.routes.img_analyze_route import img_analyze_bp

app = Flask(__name__)

app.register_blueprint(img_analyze_bp)


@app.route("/")
def hello():
    return "Hello World"


if __name__ == "__main__":
    app.debug = True
    app.run(host="0.0.0.0", port=5000)
