from flask import Flask, send_from_directory

app = Flask(__name__, static_folder="frontend", static_url_path="")

@app.route("/")
def serve_index():
    return send_from_directory("frontend", "index.html")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
