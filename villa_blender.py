"""
SECANT Architects LLP — L-shaped Institutional Building (v3)
=============================================================
Sketch-accurate plan: Wing is NOT deep — it has the SAME depth as the
main block, just its front face is set back 2 m. Both share the same
back wall. The L-shape is a subtle front-face step, not a deep extension.

PLAN (top view):
  +────────────50 m──────────────+──14 m──+
  │          Main Block front    │        │
  │          Y = 0 (datum)       │  Wing  │
  │                              │ front  │
  +──────────────────────────────+ Y=2.0  │
  back wall ≈ Y = 13.3           │        │
                                 + Y=15.3 +  ← wing back extends 2 m more

ROOF ELEMENTS (both visible in sketch):
  · Stair/services tower on main block (~1/4 from left), vertical fins
  · Smaller stair/lift box on wing roof, vertical fins

Z-FIGHT PREVENTION:
  · Main body front at  Y = +0.30
  · Piers front at      Y = -0.22   (offset 0.52 m clear of body)
  · Glass front at      Y = -0.10   (offset 0.40 m clear of body)
  · No two surfaces share a plane

THREE.JS MATERIAL NAMES:
  · "glass" → glassMat (opaque sketch-blue)
  · "dark"  → darkMat  (charcoal ink)
  · else    → toonMat  (off-white)
"""

import bpy, math, mathutils

# ── Clear ─────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for col in [bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights]:
    for item in list(col): col.remove(item)

# ── Materials ─────────────────────────────────────────────────────────────────
def mat(name, rgb):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nn, lk = m.node_tree.nodes, m.node_tree.links
    nn.clear()
    out  = nn.new('ShaderNodeOutputMaterial')
    diff = nn.new('ShaderNodeBsdfDiffuse')
    lk.new(diff.outputs[0], out.inputs[0])
    diff.inputs['Color'].default_value     = (*rgb, 1.0)
    diff.inputs['Roughness'].default_value = 0.92
    return m

PLASTER = mat('Plaster',  (0.96, 0.94, 0.90))   # off-white body
CONC    = mat('Concrete', (0.76, 0.74, 0.70))   # medium grey slab
DARK    = mat('dark',     (0.18, 0.16, 0.14))   # piers / spandrels / fascia
GLASS   = mat('glass',    (0.72, 0.84, 0.93))   # opaque sketch-blue
GROUND  = mat('Ground',   (0.84, 0.82, 0.78))   # pale site

# ── Box helper ────────────────────────────────────────────────────────────────
def box(name, cx, cy, zb, w, d, h, m):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, zb + h * 0.5))
    o = bpy.context.active_object
    o.name = name; o.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.clear(); o.data.materials.append(m)
    return o

# ══════════════════════════════════════════════════════════════════════════════
# DIMENSIONS
# ══════════════════════════════════════════════════════════════════════════════
FL      = 3.40          # floor height
NFLOORS = 5             # 5 storeys
BH      = FL * NFLOORS  # 17.0 m

# ── Main block ────────────────────────────────────────────────────────────────
MW      = 50.0           # main block width (X)
MD      = 13.0           # main block depth (Y)
MCX     = 0.0
BODY_Y0 = 0.30           # body front face pulled 0.30 m behind facade datum
BODY_Y1 = BODY_Y0 + MD  # = 13.30 (back wall)

# ── Right wing ────────────────────────────────────────────────────────────────
WW      = 14.0           # wing width (X)
WD      = 13.0           # SAME depth as main block
WCX     = MCX + MW / 2 + WW / 2   # = 32.0

WING_FAD    = -2.00      # wing facade datum: 2 m IN FRONT of main facade
WING_BODY_Y0 = WING_FAD + 0.30    # = -1.70
WING_BODY_Y1 = WING_BODY_Y0 + WD  # = 11.30  (wing back, 2 m short of main back)

# ── Facade geometry ───────────────────────────────────────────────────────────
FAD      = 0.0    # main facade datum
PIER_W   = 0.46   # vertical pier face width
PIER_D   = 0.22   # pier protrudes 0.22 m in front of datum (front at -0.22)
GLASS_D  = 0.10   # glass panel thickness (front at -0.10)
BAY_W    = 3.10   # pier centre-to-centre spacing
GWIN_W   = BAY_W - PIER_W   # glass panel width ≈ 2.64
SPAN_H   = 0.28   # spandrel height per floor
GWIN_H   = FL - SPAN_H      # glass height per floor ≈ 3.12

# ── Roof overhang ─────────────────────────────────────────────────────────────
OH_PROJ  = 2.60   # projection forward of facade datum
OH_T     = 0.48   # slab thickness

# ══════════════════════════════════════════════════════════════════════════════
# 1. GROUND
# ══════════════════════════════════════════════════════════════════════════════
box('Ground', MCX, 8.0, -0.06, 130.0, 80.0, 0.06, GROUND)

# ══════════════════════════════════════════════════════════════════════════════
# 2. MAIN BLOCK
# ══════════════════════════════════════════════════════════════════════════════
box('Body_Main', MCX, BODY_Y0 + MD / 2, 0, MW, MD, BH, PLASTER)

n_bays   = int(MW / BAY_W)
bay_span = MW / n_bays

# ── Spandrels + glass per floor ───────────────────────────────────────────────
for fl in range(NFLOORS):
    zb = fl * FL
    box(f'dark_SpMain_F{fl}', MCX, FAD - 0.07, zb, MW, 0.14, SPAN_H, DARK)
    for bi in range(n_bays):
        gx = MCX - MW / 2 + (bi + 0.5) * bay_span
        box(f'glass_MW_F{fl}_B{bi}', gx, FAD - GLASS_D / 2,
            zb + SPAN_H, GWIN_W, GLASS_D, GWIN_H, GLASS)

# Top spandrel
box('dark_SpMain_Top', MCX, FAD - 0.07, BH, MW, 0.14, SPAN_H, DARK)

# ── Vertical piers (full height) ──────────────────────────────────────────────
for bi in range(n_bays + 1):
    px = MCX - MW / 2 + bi * bay_span
    box(f'dark_PM_{bi:02d}', px, FAD - PIER_D / 2, 0, PIER_W, PIER_D, BH, DARK)

# ── Side & back faces ─────────────────────────────────────────────────────────
box('Conc_MainSideL', MCX - MW / 2 - 0.18, BODY_Y0 + MD / 2, 0, 0.36, MD, BH, CONC)
box('Conc_MainBack',  MCX, BODY_Y1 + 0.18, 0, MW, 0.36, BH, CONC)

# ── Parapet ───────────────────────────────────────────────────────────────────
box('dark_ParMainF', MCX, FAD - 0.13, BH, MW + 0.30, 0.26, 0.55, DARK)
box('dark_ParMainB', MCX, BODY_Y1 + 0.13, BH, MW + 0.30, 0.26, 0.55, DARK)
box('dark_ParMainL', MCX - MW / 2 - 0.13, BODY_Y0 + MD / 2, BH, 0.26, MD + 0.50, 0.55, DARK)

# ══════════════════════════════════════════════════════════════════════════════
# 3. MAIN BLOCK ROOF OVERHANG
#    Slab runs from back wall to 2.60 m in front of facade datum
# ══════════════════════════════════════════════════════════════════════════════
OH_FRONT = FAD - OH_PROJ          # = -2.60
OH_BACK  = BODY_Y1                # = 13.30
OH_D     = OH_BACK - OH_FRONT     # = 15.90
OH_CY    = (OH_FRONT + OH_BACK) / 2
OH_W     = MW + 0.70              # slightly wider

box('Conc_RoofSlab', MCX, OH_CY, BH, OH_W, OH_D, OH_T, CONC)
# Fascia edges
box('dark_FasciaF', MCX, OH_FRONT + 0.13, BH, OH_W, 0.26, OH_T + 0.10, DARK)
box('dark_FasciaL', MCX - OH_W / 2 + 0.13, OH_CY, BH, 0.26, OH_D, OH_T + 0.10, DARK)
# Soffit visible under projecting portion
box('dark_Soffit', MCX, (OH_FRONT + FAD) / 2, BH - 0.03,
    OH_W, OH_PROJ, 0.05, DARK)

# ══════════════════════════════════════════════════════════════════════════════
# 4. STAIR / SERVICES TOWER — main block roof
#    Visible in sketch ~1/4 from left, vertical fin louvers
# ══════════════════════════════════════════════════════════════════════════════
T1_CX = MCX - MW / 2 + MW * 0.27   # ~1/4 from left = x ≈ -11.5
T1_CY = BODY_Y0 + MD / 2
T1_W  = 5.20
T1_D  = MD * 0.48
T1_H  = 4.00

box('Plaster_Tower1', T1_CX, T1_CY, BH + OH_T, T1_W, T1_D, T1_H, PLASTER)
# Vertical fins on front face
n_fins1 = 11
for fi in range(n_fins1 + 1):
    fx = T1_CX - T1_W / 2 + fi * (T1_W / n_fins1)
    box(f'dark_T1Fin_{fi:02d}', fx, T1_CY - T1_D / 2 - 0.08,
        BH + OH_T, 0.08, 0.20, T1_H, DARK)
# Tower top cap
box('dark_Tower1Top', T1_CX, T1_CY, BH + OH_T + T1_H, T1_W + 0.36, T1_D + 0.36, 0.24, DARK)

# ══════════════════════════════════════════════════════════════════════════════
# 5. RIGHT WING
#    Same depth as main block, front set back 2 m, back extends 2 m further
# ══════════════════════════════════════════════════════════════════════════════
WING_CY = WING_BODY_Y0 + WD / 2   # = 8.80

box('Body_Wing', WCX, WING_CY, 0, WW, WD, BH, PLASTER)

n_wbays   = int(WW / BAY_W)
wbay_span = WW / n_wbays

for fl in range(NFLOORS):
    zb = fl * FL
    box(f'dark_SpWing_F{fl}', WCX, WING_FAD - 0.07, zb, WW, 0.14, SPAN_H, DARK)
    for bi in range(n_wbays):
        gx = WCX - WW / 2 + (bi + 0.5) * wbay_span
        box(f'glass_WW_F{fl}_B{bi}', gx, WING_FAD - GLASS_D / 2,
            zb + SPAN_H, WW / n_wbays - PIER_W, GLASS_D, GWIN_H, GLASS)

box('dark_SpWing_Top', WCX, WING_FAD - 0.07, BH, WW, 0.14, SPAN_H, DARK)

for bi in range(n_wbays + 1):
    px = WCX - WW / 2 + bi * wbay_span
    box(f'dark_PW_{bi:02d}', px, WING_FAD - PIER_D / 2, 0, PIER_W, PIER_D, BH, DARK)

box('Conc_WingSideR', WCX + WW / 2 + 0.18, WING_CY, 0, 0.36, WD, BH, CONC)
box('Conc_WingBack',  WCX, WING_BODY_Y1 + 0.18, 0, WW, 0.36, BH, CONC)

box('dark_ParWingF', WCX, WING_FAD - 0.13, BH, WW + 0.30, 0.26, 0.55, DARK)
box('dark_ParWingR', WCX + WW / 2 + 0.13, WING_CY, BH, 0.26, WD + 0.50, 0.55, DARK)
box('dark_ParWingB', WCX, WING_BODY_Y1 + 0.13, BH, WW + 0.30, 0.26, 0.55, DARK)

# ── Wing roof overhang ────────────────────────────────────────────────────────
W_OH_FRONT = WING_FAD - OH_PROJ   # = -0.60
W_OH_BACK  = WING_BODY_Y1         # = 15.30
W_OH_D     = W_OH_BACK - W_OH_FRONT
W_OH_CY    = (W_OH_FRONT + W_OH_BACK) / 2

box('Conc_WingRoofSlab', WCX, W_OH_CY, BH, WW + 0.50, W_OH_D, OH_T, CONC)
box('dark_WFasciaF', WCX, W_OH_FRONT + 0.13, BH, WW + 0.50, 0.26, OH_T + 0.10, DARK)
box('dark_WFasciaR', WCX + WW / 2 + 0.20, W_OH_CY, BH, 0.26, W_OH_D, OH_T + 0.10, DARK)
box('dark_WSoffit', WCX, (W_OH_FRONT + WING_FAD) / 2, BH - 0.03,
    WW + 0.50, OH_PROJ, 0.05, DARK)

# ══════════════════════════════════════════════════════════════════════════════
# 6. STAIR / LIFT TOWER — wing roof  (smaller, same language)
# ══════════════════════════════════════════════════════════════════════════════
T2_CX = WCX
T2_CY = WING_CY
T2_W  = 3.60
T2_D  = WD * 0.38
T2_H  = 3.20

box('Plaster_Tower2', T2_CX, T2_CY, BH + OH_T, T2_W, T2_D, T2_H, PLASTER)
n_fins2 = 8
for fi in range(n_fins2 + 1):
    fx = T2_CX - T2_W / 2 + fi * (T2_W / n_fins2)
    box(f'dark_T2Fin_{fi:02d}', fx, T2_CY - T2_D / 2 - 0.08,
        BH + OH_T, 0.07, 0.18, T2_H, DARK)
box('dark_Tower2Top', T2_CX, T2_CY, BH + OH_T + T2_H, T2_W + 0.28, T2_D + 0.28, 0.20, DARK)

# ══════════════════════════════════════════════════════════════════════════════
# 7. JUNCTION STRIP — thin concrete band bridging the step between blocks
# ══════════════════════════════════════════════════════════════════════════════
# Vertical connection at X = MCX + MW/2 = +25
JX  = MCX + MW / 2
JCY = (FAD + WING_FAD) / 2   # midpoint of the 2m step = 1.0
JD  = WING_FAD - FAD + 0.60  # = 2.60

box('Conc_Junction', JX, JCY + BODY_Y0, 0, 1.20, JD, BH, CONC)
box('dark_JuncFront', JX, FAD - 0.14, 0, 1.20, 0.28, BH, DARK)

# ══════════════════════════════════════════════════════════════════════════════
# 8. LIGHTING
# ══════════════════════════════════════════════════════════════════════════════
bpy.ops.object.light_add(type='AREA', location=(-35.0, -42.0, 30.0))
key = bpy.context.active_object; key.name = 'Key'
key.rotation_euler = (math.radians(-22), 0, math.radians(-18))
key.data.energy = 320.0; key.data.color = (1.00, 0.98, 0.94); key.data.size = 42.0

bpy.ops.object.light_add(type='AREA', location=(65.0, 8.0, 20.0))
fill = bpy.context.active_object; fill.name = 'Fill'
fill.rotation_euler = (math.radians(-15), 0, math.radians(68))
fill.data.energy = 150.0; fill.data.color = (0.94, 0.96, 1.00); fill.data.size = 34.0

bpy.ops.object.light_add(type='AREA', location=(MCX, MD + 22.0, 20.0))
rim = bpy.context.active_object; rim.name = 'Rim'
rim.rotation_euler = (math.radians(44), 0, 0)
rim.data.energy = 75.0; rim.data.color = (0.90, 0.92, 0.96); rim.data.size = 28.0

# ══════════════════════════════════════════════════════════════════════════════
# 9. WORLD
# ══════════════════════════════════════════════════════════════════════════════
world = bpy.data.worlds.new('World')
bpy.context.scene.world = world
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
wn.clear()
bg = wn.new('ShaderNodeBackground'); wo = wn.new('ShaderNodeOutputWorld')
wl.new(bg.outputs[0], wo.inputs[0])
bg.inputs['Color'].default_value    = (0.96, 0.95, 0.92, 1.0)
bg.inputs['Strength'].default_value = 0.55

# ══════════════════════════════════════════════════════════════════════════════
# 10. CAMERA — front-left three-quarter, matches sketch viewpoint
# ══════════════════════════════════════════════════════════════════════════════
CAM_POS = mathutils.Vector((-58.0, -40.0, 17.0))
CAM_TGT = mathutils.Vector((WCX * 0.25, MD * 0.35, BH * 0.40))
bpy.ops.object.camera_add(location=CAM_POS)
cam = bpy.context.active_object; cam.name = 'Camera'
cam.data.lens = 38
cam.rotation_euler = (CAM_TGT - CAM_POS).normalized().to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam

# ══════════════════════════════════════════════════════════════════════════════
# 11. RENDER + FREESTYLE
# ══════════════════════════════════════════════════════════════════════════════
sc = bpy.context.scene
sc.render.engine        = 'CYCLES'
sc.cycles.samples       = 64
sc.cycles.use_denoising = True
sc.render.resolution_x  = 1920
sc.render.resolution_y  = 1080
sc.view_settings.view_transform = 'Standard'
try:   sc.view_settings.look = 'None'
except: pass
sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
try:   sc.cycles.denoiser = 'OPENIMAGEDENOISE'
except: pass

sc.render.use_freestyle = True
vl = sc.view_layers[0]; vl.use_freestyle = True
fl = vl.freestyle_settings
try:   fl.crease_angle = math.radians(28)
except: pass

ls1 = fl.linesets[0] if fl.linesets else fl.linesets.new('Silhouette')
ls1.name = 'Silhouette'
ls1.select_silhouette = True;  ls1.select_crease = False
ls1.select_border = True;      ls1.select_edge_mark = True
ls1.select_external_contour = True; ls1.select_material_boundary = False
try:
    ly1 = ls1.linestyle; ly1.name = 'Ink_Thick'
    ly1.color = (0.04, 0.03, 0.01); ly1.alpha = 0.90; ly1.thickness = 2.2
except Exception as e: print(f'LS1: {e}')

try:
    ls2 = fl.linesets.new('Details')
    ls2.select_silhouette = False; ls2.select_crease = True
    ls2.select_border = False;     ls2.select_edge_mark = False
    ls2.select_external_contour = False; ls2.select_material_boundary = False
    ly2 = ls2.linestyle; ly2.name = 'Ink_Thin'
    ly2.color = (0.08, 0.06, 0.03); ly2.alpha = 0.62; ly2.thickness = 0.85
except Exception as e: print(f'LS2: {e}')

print()
print('=' * 64)
print('  SECANT LLP — L-shaped Institutional Building v3')
print('=' * 64)
objs = [o for o in bpy.data.objects if o.type == 'MESH']
print(f'  Objects: {len(objs)}   Polys: {sum(len(o.data.polygons) for o in objs):,}')
print(f'  Main  {MW:.0f}m × {MD:.0f}m × {BH:.1f}m ({NFLOORS} floors)')
print(f'  Wing  {WW:.0f}m × {WD:.0f}m, front Y={WING_FAD:.1f} (setback {WING_FAD:.1f}m)')
print(f'  Main back Y={BODY_Y1:.2f}  Wing back Y={WING_BODY_Y1:.2f}')
print(f'  Overhang {OH_PROJ:.1f}m | Roof towers: 2')
print('  F12 → Render | Export → glTF 2.0 → public/assets/base.glb')
print('=' * 64)
