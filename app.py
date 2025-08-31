import io
import os
import re
import zipfile
from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
from moviepy.editor import VideoFileClip, AudioFileClip

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

def parse_base_and_start(base_name: str):
    """
    If user enters something like 'sudo1', start at 1 and prefix 'sudo'.
    If user enters 'sudo', start at 1 and prefix 'sudo'.
    """
    base_name = base_name.strip()
    m = re.match(r'^(.*?)(\d+)$', base_name)
    if m:
        prefix = m.group(1)
        start = int(m.group(2))
    else:
        prefix = base_name
        start = 1
    return prefix, start

@app.route("/api/rename", methods=["POST"])
def rename_files():
    files = request.files.getlist("files")
    base_name = request.form.get("baseName", "").strip()
    keep_ext = request.form.get("keepExtension", "true").lower() == "true"

    if not files or not base_name:
        return jsonify({"error": "Missing files or baseName"}), 400

    prefix, start_num = parse_base_and_start(base_name)

    # Create in-memory zip
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for i, f in enumerate(files):
            # Read file bytes
            data = f.read()
            # Determine extension policy
            ext = os.path.splitext(f.filename)[1] if keep_ext else ""
            # e.g., prefix='sudo', start_num=1 -> sudo1, sudo2, ...
            new_name = f"{prefix}{start_num + i}{ext}"
            # Put into the zip at root
            zf.writestr(new_name, data)

    zip_buffer.seek(0)
    download_name = f"{secure_filename(prefix or 'renamed')}_renamed.zip"
    return send_file(
        zip_buffer,
        mimetype="application/zip",
        as_attachment=True,
        download_name=download_name
    )


@app.route("/api/replace-audio", methods=["POST"])
def replace_audio_bulk():
    videos = request.files.getlist("videos")
    audios = request.files.getlist("audios")

    if not videos or not audios:
        return jsonify({"error": "Missing videos or audios"}), 400

    if len(videos) != len(audios):
        return jsonify({"error": "Number of videos and audios must match"}), 400

    # create in-memory zip
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for idx, (vfile, afile) in enumerate(zip(videos, audios), start=1):
            # Save temporary files
            video_path = f"/tmp/video_{idx}.mp4"
            audio_path = f"/tmp/audio_{idx}.mp3"
            output_path = f"/tmp/output_{idx}.mp4"

            vfile.save(video_path)
            afile.save(audio_path)

            try:
                # Load video and mute
                video = VideoFileClip(video_path).without_audio()
                # Load audio
                audio = AudioFileClip(audio_path)
                # Set new audio
                final = video.set_audio(audio)
                # Write result
                final.write_videofile(output_path, codec="libx264", audio_codec="aac", logger=None)
                # Add to zip
                with open(output_path, "rb") as f:
                    zf.writestr(f"merged_{idx}.mp4", f.read())
            finally:
                # cleanup
                for p in (video_path, audio_path, output_path):
                    if os.path.exists(p):
                        os.remove(p)

    zip_buffer.seek(0)
    return send_file(
        zip_buffer,
        mimetype="application/zip",
        as_attachment=True,
        download_name="merged_videos.zip"
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
