import json

A = (-74.43719996659475, 40.521151352641596)
B = (-74.43711279259293, 40.521238677472184)
C = (-74.4377186536139, 40.52156518412775)
D = (-74.4378010719952, 40.52148389856935)

rows = 24
cols = 2

def lerp(p1, p2, t):
    return (
        p1[0] + (p2[0] - p1[0]) * t,
        p1[1] + (p2[1] - p1[1]) * t
    )

features = []

for r in range(rows):
    for c in range(cols):
        v0 = r / rows
        v1 = (r + 1) / rows
        u0 = c / cols
        u1 = (c + 1) / cols

        p00 = lerp(lerp(A, B, u0), lerp(D, C, u0), v0)
        p10 = lerp(lerp(A, B, u1), lerp(D, C, u1), v0)
        p11 = lerp(lerp(A, B, u1), lerp(D, C, u1), v1)
        p01 = lerp(lerp(A, B, u0), lerp(D, C, u0), v1)

        polygon = [p00, p10, p11, p01, p00]

        features.append({
            "type": "Feature",
            "properties": {
                "row": r,
                "col": c
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [[list(p) for p in polygon]]
            }
        })

geojson = {
    "type": "FeatureCollection",
    "features": features
}

print(json.dumps(geojson, indent=2))
