"""
villa_blender.py — Meshy model optimiser
Paste into Blender's Scripting tab and press Run Script.

Pipeline per mesh object
────────────────────────
  1. Merge by distance        — removes duplicate verts from AI meshing
  2. Delete loose geometry    — stray verts/edges not part of any face
  3. Limited dissolve         — collapses flat face runs into n-gons
                                (huge win on walls, floors, ceilings)
  4. Decimate modifier        — aggressive on organic objects (trees,
                                landscape), lighter on architecture
  5. Export Draco-compressed GLB → public/assets/model.glb

Tune SETTINGS before running.
"""

import bpy, math, os

# ── SETTINGS ──────────────────────────────────────────────────────────────────

OUTPUT = r"C:\Users\Admin\Desktop\secant\public\assets\model.glb"

# Objects with more faces than this are treated as "organic" (trees, terrain).
# Architecture is NOT decimated — decimate on flat surfaces creates jagged
# triangulations that produce ugly lines in EdgesGeometry sketch rendering.
# Limited dissolve handles architecture far better.
ORGANIC_THRESHOLD  = 15_000

DECIMATE_ORGANIC   = 0.35   # keep 35 % — trees / bushes / terrain only

MERGE_DIST         = 0.001  # metres  (1 mm)
DISSOLVE_ANGLE_DEG = 1.0    # dissolve edges between faces within 1° of coplanar

DRACO_LEVEL        = 6
DRACO_POS_Q        = 14
DRACO_NRM_Q        = 10
DRACO_UV_Q         = 12

# ──────────────────────────────────────────────────────────────────────────────

def face_count(obj):
    return len(obj.data.polygons)

def optimise(obj):
    n0 = face_count(obj)

    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')

    bpy.ops.mesh.remove_doubles(threshold=MERGE_DIST)
    bpy.ops.mesh.delete_loose(use_verts=True, use_edges=True, use_faces=False)
    bpy.ops.mesh.dissolve_limited(angle_limit=math.radians(DISSOLVE_ANGLE_DEG))

    bpy.ops.object.mode_set(mode='OBJECT')

    n1      = face_count(obj)
    organic = n0 > ORGANIC_THRESHOLD
    tag     = "organic" if organic else "arch   "

    if organic:
        mod = obj.modifiers.new("Dec", 'DECIMATE')
        mod.ratio                    = DECIMATE_ORGANIC
        mod.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=mod.name)

    n2  = face_count(obj)
    pct = 100 * (1 - n2 / n0) if n0 else 0
    print(f"  [{tag}] {obj.name[:40]:<40}  {n0:>8,} → {n1:>8,} → {n2:>8,}  ({pct:.0f}% off)")

# ── Run ───────────────────────────────────────────────────────────────────────

visible = [o for o in bpy.data.objects if o.type == 'MESH' and not o.hide_viewport]
total_before = sum(face_count(o) for o in visible)

print(f"\nOptimising {len(visible)} mesh objects  ({total_before:,} faces total) …\n")

bpy.ops.object.select_all(action='DESELECT')

for obj in visible:
    try:
        obj.select_set(True)
        optimise(obj)
        obj.select_set(False)
    except Exception as exc:
        print(f"  WARNING: skipped {obj.name} — {exc}")
        try: bpy.ops.object.mode_set(mode='OBJECT')
        except: pass

total_after = sum(face_count(o) for o in visible)
print(f"\nTotal: {total_before:,} → {total_after:,} faces  ({100*(1-total_after/total_before):.0f}% reduction)")

# ── Export ────────────────────────────────────────────────────────────────────

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath                             = OUTPUT,
    export_format                        = 'GLB',
    export_apply                         = True,
    export_materials                     = 'NONE',   # Three.js applies its own
    export_normals                       = True,
    export_draco_mesh_compression_enable = True,
    export_draco_mesh_compression_level  = DRACO_LEVEL,
    export_draco_position_quantization   = DRACO_POS_Q,
    export_draco_normal_quantization     = DRACO_NRM_Q,
    export_draco_texcoord_quantization   = DRACO_UV_Q,
    export_draco_color_quantization      = 8,
    export_draco_generic_quantization    = 12,
    use_selection                        = False,
)

mb = os.path.getsize(OUTPUT) / 1_048_576
print(f"\nExported → {OUTPUT}  ({mb:.2f} MB)")
