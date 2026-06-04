"""
SECANT Architects LLP — L-shaped Institutional Building (v4)
=============================================================
PLAN (top view, Y = depth, X = width):

  +──────────── 50 m ────────────+
  |       MAIN BLOCK             |   ← front face at Y = 0  (FAD)
  |       Y: 0.30 → 13.30        |   ← back  face at Y = 13.30
  +──────────────────────────────+
                                 +──── 14 m ────+
                                 | RIGHT WING   |
                                 | front Y=-2.0 |  ← protrudes 2m forward
                                 | back  Y=13.30|  ← same back wall as main
                                 +──────────────+

TWO WINDOW TYPES:
  · Floors 0–3 : full curtain wall — spandrel (0.28m) + tall glass (3.12m)
  · Floor 4    : strip windows — narrow horizontal glass (1.40m) mid-floor,
                 solid spandrel below + solid panel above up to overhang

WING LEFT SIDE: windows visible from camera (gap between main + wing)
WING FACADE: tighter bay spacing (fins closer) — distinct from main block

Z-FIGHT: body pulled 0.30m back, piers at -0.22, glass at -0.10 from datum
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

PLASTER = mat('Plaster',  (0.96, 0.94, 0.90))
CONC    = mat('Concrete', (0.76, 0.74, 0.70))
DARK    = mat('dark',     (0.18, 0.16, 0.14))
GLASS   = mat('glass',    (0.72, 0.84, 0.93))
GROUND  = mat('Ground',   (0.84, 0.82, 0.78))

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
FL      = 3.40
NFLOORS = 5
BH      = FL * NFLOORS   # 17.0 m

# Main block
MW      = 50.0
MD      = 13.0
MCX     = 0.0
FAD     = 0.0            # main facade datum (front face reference)
BODY_Y0 = FAD + 0.30     # body pulled 0.30 behind datum
BODY_Y1 = BODY_Y0 + MD   # back wall = 13.30

# Right wing — front protrudes 10m forward, back flush with main
WW          = 14.0
WCX         = MCX + MW / 2 + WW / 2    # = 32.0
WING_FAD    = FAD - 14.0               # = -14.0  (14m forward of main)
WING_BODY_Y0 = WING_FAD + 0.30         # = -9.70
WING_BODY_Y1 = BODY_Y1                 # = 13.30  ← same back wall
WD           = WING_BODY_Y1 - WING_BODY_Y0   # = 23.0

# Facade geometry
PIER_W  = 0.46
PIER_D  = 0.22     # piers protrude 0.22m in front of datum → front face at datum-0.22
GLASS_D = 0.10     # glass front at datum-0.10

# Main block: wider bays
MBAY_W  = 3.10
MGWIN_W = MBAY_W - PIER_W   # ≈ 2.64

# Wing: tighter bays (denser fins, different facade character)
WBAY_W  = 2.20
WGWIN_W = WBAY_W - PIER_W   # ≈ 1.74

SPAN_H  = 0.28
GWIN_H  = FL - SPAN_H       # standard glass height = 3.12

# Top-floor strip window
STRIP_H   = 1.40   # glass height for top floor
STRIP_BOT = 1.20   # height of solid panel below the strip glass
# solid above = FL - STRIP_BOT - STRIP_H = 0.80

# Roof overhang
OH_PROJ = 2.60
OH_T    = 0.48

# ══════════════════════════════════════════════════════════════════════════════
# 1. GROUND
# ══════════════════════════════════════════════════════════════════════════════
box('Ground', MCX, 8.0, -0.06, 140.0, 80.0, 0.06, GROUND)

# ══════════════════════════════════════════════════════════════════════════════
# 2. MAIN BLOCK BODY
# ══════════════════════════════════════════════════════════════════════════════
box('Body_Main', MCX, BODY_Y0 + MD / 2, 0, MW, MD, BH, PLASTER)

n_mbays   = int(MW / MBAY_W)
mbay_span = MW / n_mbays

# ── Floors 0–3: standard curtain wall ────────────────────────────────────────
for fl in range(NFLOORS - 1):   # 0,1,2,3
    zb = fl * FL
    # Spandrel at floor level
    box(f'dark_SpM_F{fl}', MCX, FAD - 0.07, zb, MW, 0.14, SPAN_H, DARK)
    # Glass panels
    for bi in range(n_mbays):
        gx = MCX - MW / 2 + (bi + 0.5) * mbay_span
        box(f'glass_MW_F{fl}_B{bi}', gx, FAD - GLASS_D / 2,
            zb + SPAN_H, MGWIN_W, GLASS_D, GWIN_H, GLASS)

# ── Floor 4 (top): strip windows ─────────────────────────────────────────────
zb4 = (NFLOORS - 1) * FL   # = 13.6
# Solid spandrel at floor level (same as other floors)
box('dark_SpM_F4', MCX, FAD - 0.07, zb4, MW, 0.14, SPAN_H, DARK)
# Solid panel below strip glass
box('Plaster_TopBotPanel', MCX, FAD - GLASS_D / 2, zb4 + SPAN_H,
    MW, GLASS_D, STRIP_BOT - SPAN_H, PLASTER)
# Horizontal strip glass
for bi in range(n_mbays):
    gx = MCX - MW / 2 + (bi + 0.5) * mbay_span
    box(f'glass_MW_F4_B{bi}', gx, FAD - GLASS_D / 2,
        zb4 + STRIP_BOT, MGWIN_W, GLASS_D, STRIP_H, GLASS)
# Dark horizontal transom above strip glass
box('dark_TopTransom', MCX, FAD - 0.07, zb4 + STRIP_BOT + STRIP_H,
    MW, 0.14, FL - STRIP_BOT - STRIP_H, DARK)

# Top spandrel line
box('dark_SpM_Top', MCX, FAD - 0.07, BH, MW, 0.14, SPAN_H, DARK)

# ── Full-height vertical piers ────────────────────────────────────────────────
for bi in range(n_mbays + 1):
    px = MCX - MW / 2 + bi * mbay_span
    box(f'dark_PM_{bi:02d}', px, FAD - PIER_D / 2, 0, PIER_W, PIER_D, BH, DARK)

# ── Side faces ────────────────────────────────────────────────────────────────
box('Conc_MainSideL', MCX - MW / 2 - 0.18, BODY_Y0 + MD / 2, 0, 0.36, MD, BH, CONC)
box('Conc_MainBack',  MCX, BODY_Y1 + 0.18, 0, MW, 0.36, BH, CONC)

# ── Parapet ───────────────────────────────────────────────────────────────────
box('dark_ParMF', MCX, FAD - 0.13, BH, MW + 0.30, 0.26, 0.55, DARK)
box('dark_ParMB', MCX, BODY_Y1 + 0.13, BH, MW + 0.30, 0.26, 0.55, DARK)
box('dark_ParML', MCX - MW / 2 - 0.13, BODY_Y0 + MD / 2, BH, 0.26, MD + 0.50, 0.55, DARK)

# ══════════════════════════════════════════════════════════════════════════════
# 3. MAIN BLOCK ROOF OVERHANG
# ══════════════════════════════════════════════════════════════════════════════
OH_FRONT = FAD - OH_PROJ
OH_BACK  = BODY_Y1
OH_D     = OH_BACK - OH_FRONT
OH_CY    = (OH_FRONT + OH_BACK) / 2
OH_W     = MW + 0.70

box('Conc_RoofSlab', MCX, OH_CY, BH, OH_W, OH_D, OH_T, CONC)
box('dark_FasciaF', MCX, OH_FRONT + 0.13, BH, OH_W, 0.26, OH_T + 0.10, DARK)
box('dark_FasciaL', MCX - OH_W / 2 + 0.13, OH_CY, BH, 0.26, OH_D, OH_T + 0.10, DARK)
box('dark_Soffit',  MCX, (OH_FRONT + FAD) / 2, BH - 0.03, OH_W, OH_PROJ, 0.05, DARK)

# ══════════════════════════════════════════════════════════════════════════════
# 4. STAIR TOWER — main block roof (~1/4 from left)
# ══════════════════════════════════════════════════════════════════════════════
T1X = MCX - MW / 2 + MW * 0.27
T1Y = BODY_Y0 + MD / 2
T1W, T1D, T1H = 5.20, MD * 0.46, 4.00
box('Plaster_Tower1', T1X, T1Y, BH + OH_T, T1W, T1D, T1H, PLASTER)
for fi in range(12):
    fx = T1X - T1W / 2 + fi * (T1W / 11)
    box(f'dark_T1F_{fi:02d}', fx, T1Y - T1D / 2 - 0.09, BH + OH_T, 0.08, 0.22, T1H, DARK)
box('dark_T1Cap', T1X, T1Y, BH + OH_T + T1H, T1W + 0.36, T1D + 0.36, 0.24, DARK)

# ══════════════════════════════════════════════════════════════════════════════
# 5. RIGHT WING BODY
# ══════════════════════════════════════════════════════════════════════════════
WING_CY = (WING_BODY_Y0 + WING_BODY_Y1) / 2   # = 5.80

# Pull left face back 0.30m so side facade elements (glass/piers at X≈25.0)
# are 0.30m clear of the body face (at X=25.30) — zero z-fighting
box('Body_Wing', WCX + 0.15, WING_CY, 0, WW - 0.30, WD, BH, PLASTER)

n_wbays   = int(WW / WBAY_W)
wbay_span = WW / n_wbays

# ── Wing front facade: floors 0–3 curtain wall ───────────────────────────────
for fl in range(NFLOORS - 1):
    zb = fl * FL
    box(f'dark_SpW_F{fl}', WCX, WING_FAD - 0.07, zb, WW, 0.14, SPAN_H, DARK)
    for bi in range(n_wbays):
        gx = WCX - WW / 2 + (bi + 0.5) * wbay_span
        box(f'glass_WW_F{fl}_B{bi}', gx, WING_FAD - GLASS_D / 2,
            zb + SPAN_H, WGWIN_W, GLASS_D, GWIN_H, GLASS)

# ── Wing front: top floor strip windows ──────────────────────────────────────
box('dark_SpW_F4', WCX, WING_FAD - 0.07, zb4, WW, 0.14, SPAN_H, DARK)
box('Plaster_WTopBot', WCX, WING_FAD - GLASS_D / 2, zb4 + SPAN_H,
    WW, GLASS_D, STRIP_BOT - SPAN_H, PLASTER)
for bi in range(n_wbays):
    gx = WCX - WW / 2 + (bi + 0.5) * wbay_span
    box(f'glass_WW_F4_B{bi}', gx, WING_FAD - GLASS_D / 2,
        zb4 + STRIP_BOT, WGWIN_W, GLASS_D, STRIP_H, GLASS)
box('dark_WTopTrans', WCX, WING_FAD - 0.07, zb4 + STRIP_BOT + STRIP_H,
    WW, 0.14, FL - STRIP_BOT - STRIP_H, DARK)
box('dark_SpW_Top', WCX, WING_FAD - 0.07, BH, WW, 0.14, SPAN_H, DARK)

# ── Wing front piers ──────────────────────────────────────────────────────────
for bi in range(n_wbays + 1):
    px = WCX - WW / 2 + bi * wbay_span
    box(f'dark_PW_{bi:02d}', px, WING_FAD - PIER_D / 2, 0, PIER_W, PIER_D, BH, DARK)

# ── Wing LEFT SIDE — exposed forward portion only (Y: WING_BODY_Y0 → FAD) ────
# The forward 10m of the wing sticks out beyond the main block's right end.
# This face is prominently visible from the camera (front-left three-quarter).
WLEFT_X      = WCX - WW / 2      # = 25.0
WSIDE_Y0     = WING_BODY_Y0      # = -9.70  (start of exposed forward portion)
WSIDE_Y1     = FAD               # =  0.0   (where main block front aligns)
WSIDE_DEPTH  = WSIDE_Y1 - WSIDE_Y0  # = 9.70m of exposed side face
WSIDE_CY     = (WSIDE_Y0 + WSIDE_Y1) / 2  # = -4.85

# Side window bays — 4 bays along the exposed depth
# Body is now at X=25.30 so all elements with right face at X≤25.0 are clear
WS_BAYS   = 4
ws_span   = WSIDE_DEPTH / WS_BAYS   # ≈ 3.23m

for fl in range(NFLOORS - 1):
    zb = fl * FL
    # Spandrel strip at floor level
    box(f'dark_WSideSp_F{fl}', WLEFT_X - 0.07, WSIDE_CY, zb,
        0.14, WSIDE_DEPTH, SPAN_H, DARK)
    # Glass panels per bay
    for bi in range(WS_BAYS):
        gy = WSIDE_Y0 + (bi + 0.5) * ws_span
        box(f'glass_WS_F{fl}_B{bi}', WLEFT_X - GLASS_D / 2, gy,
            zb + SPAN_H, GLASS_D, ws_span - PIER_W, GWIN_H, GLASS)

# Top floor strip windows on left side
box('dark_WSideSp_F4', WLEFT_X - 0.07, WSIDE_CY, zb4, 0.14, WSIDE_DEPTH, SPAN_H, DARK)
for bi in range(WS_BAYS):
    gy = WSIDE_Y0 + (bi + 0.5) * ws_span
    box(f'glass_WS_F4_B{bi}', WLEFT_X - GLASS_D / 2, gy,
        zb4 + STRIP_BOT, GLASS_D, ws_span - PIER_W, STRIP_H, GLASS)

# Vertical piers on left side (running full height, at bay boundaries)
for bi in range(WS_BAYS + 1):
    py = WSIDE_Y0 + bi * ws_span
    box(f'dark_WSidePier_{bi}', WLEFT_X - PIER_D / 2, py,
        0, PIER_D, PIER_W, BH, DARK)

# ── Wing right side + back ────────────────────────────────────────────────────
box('Conc_WingSideR', WCX + WW / 2 + 0.18, WING_CY, 0, 0.36, WD, BH, CONC)
box('Conc_WingBack',  WCX, WING_BODY_Y1 + 0.18, 0, WW, 0.36, BH, CONC)

# ── Wing parapets ─────────────────────────────────────────────────────────────
box('dark_ParWF', WCX, WING_FAD - 0.13, BH, WW + 0.30, 0.26, 0.55, DARK)
box('dark_ParWR', WCX + WW / 2 + 0.13, WING_CY, BH, 0.26, WD + 0.50, 0.55, DARK)
box('dark_ParWB', WCX, WING_BODY_Y1 + 0.13, BH, WW + 0.30, 0.26, 0.55, DARK)

# ══════════════════════════════════════════════════════════════════════════════
# 6. WING ROOF OVERHANG
# ══════════════════════════════════════════════════════════════════════════════
W_OH_FRONT = WING_FAD - OH_PROJ   # = -4.60
W_OH_BACK  = WING_BODY_Y1         # = 13.30
W_OH_D     = W_OH_BACK - W_OH_FRONT
W_OH_CY    = (W_OH_FRONT + W_OH_BACK) / 2

box('Conc_WingRoofSlab', WCX, W_OH_CY, BH, WW + 0.50, W_OH_D, OH_T, CONC)
box('dark_WFasciaF', WCX, W_OH_FRONT + 0.13, BH, WW + 0.50, 0.26, OH_T + 0.10, DARK)
box('dark_WFasciaR', WCX + WW / 2 + 0.20, W_OH_CY, BH, 0.26, W_OH_D, OH_T + 0.10, DARK)
box('dark_WSoffit', WCX, (W_OH_FRONT + WING_FAD) / 2 - 0.5, BH - 0.03,
    WW + 0.50, OH_PROJ + 1.0, 0.05, DARK)

# ══════════════════════════════════════════════════════════════════════════════
# 7. STAIR TOWER — wing roof
# ══════════════════════════════════════════════════════════════════════════════
T2X = WCX
T2Y = WING_CY
T2W, T2D, T2H = 3.60, WD * 0.26, 3.20
box('Plaster_Tower2', T2X, T2Y, BH + OH_T, T2W, T2D, T2H, PLASTER)
for fi in range(9):
    fx = T2X - T2W / 2 + fi * (T2W / 8)
    box(f'dark_T2F_{fi:02d}', fx, T2Y - T2D / 2 - 0.08, BH + OH_T, 0.07, 0.18, T2H, DARK)
box('dark_T2Cap', T2X, T2Y, BH + OH_T + T2H, T2W + 0.28, T2D + 0.28, 0.20, DARK)

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
# 10. CAMERA
# ══════════════════════════════════════════════════════════════════════════════
CAM_POS = mathutils.Vector((-60.0, -42.0, 17.0))
CAM_TGT = mathutils.Vector((WCX * 0.2, MD * 0.3, BH * 0.38))
bpy.ops.object.camera_add(location=CAM_POS)
cam = bpy.context.active_object; cam.name = 'Camera'
cam.data.lens = 38
cam.rotation_euler = (CAM_TGT - CAM_POS).normalized().to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam

# ══════════════════════════════════════════════════════════════════════════════
# 11. RENDER + FREESTYLE
# ══════════════════════════════════════════════════════════════════════════════
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 64
sc.cycles.use_denoising = True
sc.render.resolution_x = 1920; sc.render.resolution_y = 1080
sc.view_settings.view_transform = 'Standard'
try:   sc.view_settings.look = 'None'
except: pass
sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
try:   sc.cycles.denoiser = 'OPENIMAGEDENOISE'
except: pass

sc.render.use_freestyle = True
vl = sc.view_layers[0]; vl.use_freestyle = True
fl_s = vl.freestyle_settings
try:   fl_s.crease_angle = math.radians(28)
except: pass
ls1 = fl_s.linesets[0] if fl_s.linesets else fl_s.linesets.new('Silhouette')
ls1.name = 'Silhouette'
ls1.select_silhouette = True;  ls1.select_crease = False
ls1.select_border = True;      ls1.select_edge_mark = True
ls1.select_external_contour = True; ls1.select_material_boundary = False
try:
    ly1 = ls1.linestyle; ly1.name = 'Ink_Thick'
    ly1.color = (0.04, 0.03, 0.01); ly1.alpha = 0.90; ly1.thickness = 2.2
except: pass
try:
    ls2 = fl_s.linesets.new('Details')
    ls2.select_silhouette = False; ls2.select_crease = True
    ls2.select_border = ls2.select_edge_mark = ls2.select_external_contour = False
    ls2.select_material_boundary = False
    ly2 = ls2.linestyle; ly2.name = 'Ink_Thin'
    ly2.color = (0.08, 0.06, 0.03); ly2.alpha = 0.62; ly2.thickness = 0.85
except: pass

print()
print('=' * 64)
print('  SECANT LLP — Institutional Building v4')
print('=' * 64)
objs = [o for o in bpy.data.objects if o.type == 'MESH']
print(f'  Meshes: {len(objs)}   Polys: {sum(len(o.data.polygons) for o in objs):,}')
print(f'  Main  {MW:.0f}m wide × {MD:.0f}m deep × {BH:.1f}m  (5 floors)')
print(f'  Wing  {WW:.0f}m wide × {WD:.0f}m deep, front Y={WING_FAD:.1f}m (protrudes 2m)')
print(f'  Both back walls at Y = {BODY_Y1:.2f}m')
print(f'  Windows: floors 0-3 full curtain, floor 4 strip ({STRIP_H:.1f}m tall)')
print('  F12 → Render | Export glTF 2.0 → public/assets/base.glb')
print('=' * 64)
