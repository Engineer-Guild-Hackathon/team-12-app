from flask import Flask
from src.routes.image_route import image_bp
from src.routes.img_analyze_route import img_analyze_bp
from src.routes.post_route import post_bp

app = Flask(__name__)

app.register_blueprint(post_bp)
app.register_blueprint(img_analyze_bp)
app.register_blueprint(image_bp)


@app.route("/")
def hello():
    return "Hello World"


if __name__ == "__main__":
    app.debug = True
    app.run(host="0.0.0.0", port=5000)
