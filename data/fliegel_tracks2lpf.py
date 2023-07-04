import os
import json

folder_path = "data/fliegel_tracks"
output_folder = "data/fliegel_tracks_lpf"

feat_coll = {
    "type": "FeatureCollection",
    "crs": {
        "type": "name",
        "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"},
    },
    "features": [],
}
for filename in os.listdir(folder_path):
    if filename.endswith(".geojson"):
        file_path = os.path.join(folder_path, filename)
        with open(file_path, mode="r", encoding="utf-8") as file:
            data = json.load(file)
        track = {
            "@id": filename,
            "type": "Feature",
            "properties": {"title": filename.split(".")[0]},
        }
        geometries = []
        for feature in data["features"]:
            geometries.append(feature["geometry"])
            timespans = {
                "start": {"in": feature["properties"]["year"]},
            }
            feature["geometry"]["when"] = {"timespans": timespans}
        track["geometry"] = {"type": "GeometryCollection", "geometries": geometries}
        feat_coll["features"].append(track)
output_file = os.path.join(output_folder, "tracks.json")
with open(output_file, "w", encoding="utf-8") as file:
    json.dump(feat_coll, file)
