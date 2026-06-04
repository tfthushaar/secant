"""
SECANT Architects LLP — L-shaped Institutional Building (sketch-match v2)
==========================================================================
Building only. No site furniture, no trees, no ramps.

GEOMETRY RULES (no z-fighting):
  · Main body pulled BACK 0.30 m from facade datum (Y = 0)
  · Concrete piers project forward of datum → front face at Y = -0.22
  · Glass panels sit between piers    → front face at Y = -0.10
  · No two objects share a coplanar face

MATERIAL NAMES for Three.js Scene3D shader:
  · "glass"  in name → glassMat (opaque sketch-blue)
  · "dark"   in name → darkMat  (charcoal)
  · anything else    → toonMat  (off-white)

L-SHAPE PLAN:
  MAIN BLOCK  X: –25 → +25  (50 m wide)
              Y:  0.30 → 13.30  (13 m deep)
  RIGHT WING  X: +25 → +39  (14 m wide)
              Y:  0.30 → 21.30  (21 m deep — extends further back)
  Both share same front datum (Y facade = 0), wing front at Y = 0.30+2 = 2.30

5 STORIES: ground (Z 0–3.4) + 4 upper (3.4–17.0)
ROOF OVERHANG: 2.60 m forward projection, 0.48 m thick slab
"""

import bpy, math, mathutils

# ─── Clear ────────────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for col in [bpy.data.meshes, bpy.data.materials,
            bpy.data.cameras, bpy.data.lights]:
    for item in list(col): col.remove(item)

# ─── Materials ────────────────────────────────────────────────────────────────
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

PLASTER  = mat('Plaster',      (0.96, 0.94, 0.90))  # off-white concrete body
CONC     = mat('Concrete',     (0.74, 0.72, 0.68))  # medium grey
DARK     = mat('dark',         (0.20, 0.18, 0.16))  # columns, spandrels, fascia
GLASS    = mat('glass',        (0.72, 0.84, 0.93))  # opaque sketch blue
GROUND   = mat('Ground',       (0.82, 0.80, 0.76))  # pale site plane

# ─── Primitives ───────────────────────────────────────────────────────────────
def box(name, cx, cy, zb, w, d, h, m):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, zb + h * 0.5))
    o = bpy.context.active_object
    o.name = name; o.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.clear(); o.data.materials.append(m)
    return o

# ═════════════════════════════════════════════════════════════════════════════
# CONSTANTS
# ═════════════════════════════════════════════════════════════════════════════
FL       = 3.40          # floor-to-floor height
NFLOORS  = 5             # 5 storeys (G + 4 upper)
BH       = FL * NFLOORS  # building height = 17.0 m

# Main block
MW  = 50.0               # width
MD  = 13.0               # depth
MCX = 0.0
# Y from BODY_Y0 to BODY_Y0+MD; facade datum at Y=0
BODY_Y0 = 0.30           # body front face 0.30 m behind datum

# Right wing (L leg)
WW  = 14.0               # wing width
WD  = 20.0               # wing depth (7 m more than main block)
WCX = MCX + MW / 2 + WW / 2   # = +32
# Wing front face set 2.0 m back from datum (slightly recessed)
WING_Y0 = 2.30

# Facade datum
FAD = 0.0                # Y = 0 is the reference facade line

# Pier (concrete column) geometry
PIER_W   = 0.48          # pier face width
PIER_D   = 0.22          # pier protrusion depth beyond datum
# Pier front face at Y = FAD - PIER_D = -0.22
# Pier back merges into body (body front at BODY_Y0 = 0.30, pier back = 0.00)

# Glass panel geometry
GLASS_D  = 0.10          # thickness
# Glass front face at Y = FAD - GLASS_D = -0.10
# Glass back at Y = 0.00 — body front at 0.30 → no coplanar ✓

# Bay width (pier centre-to-centre)
BAY_W    = 3.10
# Actual glass panel width per bay
GWIN_W   = BAY_W - PIER_W   # ≈ 2.62 m

# Spandrel band at each floor level
SPAN_H   = 0.28          # spandrel height (covers slab edge)
# Within each floor, glass height:
GWIN_H   = FL - SPAN_H   # ≈ 3.12 m   (glass starts above spandrel)

# Roof overhang
OH_PROJ  = 2.60          # projection forward of facade datum
OH_T     = 0.48          # slab thickness

# ═════════════════════════════════════════════════════════════════════════════
# 1. GROUND PLANE
# ═════════════════════════════════════════════════════════════════════════════
box('Ground', MCX, 10.0, -0.06, 120.0, 80.0, 0.06, GROUND)

# ═════════════════════════════════════════════════════════════════════════════
# 2. MAIN BLOCK — solid body (set back from facade datum)
# ═════════════════════════════════════════════════════════════════════════════
box('Body_Main', MCX, BODY_Y0 + MD / 2, 0, MW, MD, BH, PLASTER)

# ─── Facade system: piers + glass on front face ──────────────────────────────
n_bays   = int(MW / BAY_W)
bay_span = MW / n_bays   # actual bay width after snapping

for fl in range(NFLOORS):
    zb = fl * FL

    # Spandrel band (dark, full width, sits at floor level)
    box(f'dark_SpandrelMain_F{fl}',
        MCX, FAD - 0.06,
        zb, MW, 0.12, SPAN_H, DARK)

    # Glass panels between piers
    for bi in range(n_bays):
        bx = MCX - MW / 2 + (bi + 0.5) * bay_span
        box(f'glass_MainWin_F{fl}_B{bi}',
            bx, FAD - GLASS_D / 2,
            zb + SPAN_H,
            GWIN_W, GLASS_D,
            GWIN_H, GLASS)

# Vertical concrete piers (run full building height)
for bi in range(n_bays + 1):
    px = MCX - MW / 2 + bi * bay_span
    box(f'dark_PierMain_{bi:02d}',
        px, FAD - PIER_D / 2,
        0, PIER_W, PIER_D, BH, DARK)

# Top spandrel (parapet base)
box('dark_SpandrelMain_Top', MCX, FAD - 0.06, BH, MW, 0.12, SPAN_H, DARK)

# ─── Side faces ──────────────────────────────────────────────────────────────
# Left side: solid plaster face
box('Plaster_MainSideL', MCX - MW / 2 - 0.16, BODY_Y0 + MD / 2, 0,
    0.32, MD, BH, CONC)
# Back face
box('Plaster_MainBack', MCX, BODY_Y0 + MD + 0.16, 0,
    MW, 0.32, BH, CONC)

# ─── Parapet on main block ────────────────────────────────────────────────────
box('dark_ParapetMainF', MCX, FAD - 0.12, BH, MW + 0.24, 0.24, 0.55, DARK)
box('dark_ParapetMainB', MCX, BODY_Y0 + MD + 0.12, BH, MW + 0.24, 0.24, 0.55, DARK)
box('dark_ParapetMainL', MCX - MW / 2 - 0.12, BODY_Y0 + MD / 2, BH,
    0.24, MD + 0.48, 0.55, DARK)

# ═════════════════════════════════════════════════════════════════════════════
# 3. ROOF OVERHANG — main block
#    Extends OH_PROJ forward of facade datum, same width as main block + piers
# ═════════════════════════════════════════════════════════════════════════════
OH_CX = MCX
OH_W  = MW + 0.60          # slightly wider than main block
OH_D  = MD + BODY_Y0 + OH_PROJ  # from back wall to overhang front tip
OH_CY = BODY_Y0 + MD / 2 - OH_PROJ / 2 + OH_PROJ / 2   # centred including overhang
# Simpler: overhang slab spans from back of building to front tip
OH_FRONT_Y = FAD - OH_PROJ  # front edge of overhang = -2.60
OH_BACK_Y  = BODY_Y0 + MD   # back edge = 13.30
OH_SPAN_D  = OH_BACK_Y - OH_FRONT_Y   # total depth of slab
OH_SLAB_CY = (OH_FRONT_Y + OH_BACK_Y) / 2

box('Concrete_RoofSlab', OH_CX, OH_SLAB_CY, BH, OH_W, OH_SPAN_D, OH_T, CONC)

# Dark fascia at front edge of overhang
box('dark_FasciaFront', OH_CX, OH_FRONT_Y + 0.12, BH, OH_W, 0.24, OH_T + 0.08, DARK)
# Dark fascia on left side of overhang
box('dark_FasciaLeft', MCX - OH_W / 2 + 0.12, OH_SLAB_CY, BH, 0.24, OH_SPAN_D, OH_T + 0.08, DARK)

# Underside of overhang soffit (visible dark band below slab)
box('dark_Soffit', OH_CX, (OH_FRONT_Y + FAD) / 2, BH - 0.02,
    OH_W, FAD - OH_FRONT_Y, 0.04, DARK)

# ═════════════════════════════════════════════════════════════════════════════
# 4. STAIR / SERVICES TOWER ON ROOF
#    Sits on main block roof, ~1/4 from left edge, rises ~3.5 m above roof
# ═════════════════════════════════════════════════════════════════════════════
TW_CX  = MCX - MW / 2 + MW * 0.28   # about 1/4 from left
TW_CY  = BODY_Y0 + MD / 2
TW_W   = 5.0
TW_D   = MD * 0.5
TW_H   = 4.0

box('Plaster_TowerBody', TW_CX, TW_CY, BH, TW_W, TW_D, TW_H, PLASTER)

# Tower: vertical fins on front face (sketch shows louver-like fins)
FIN_SPACE = 0.45
n_fins = int(TW_W / FIN_SPACE)
for fi in range(n_fins + 1):
    fx = TW_CX - TW_W / 2 + fi * (TW_W / n_fins)
    box(f'dark_TowerFin_{fi:02d}',
        fx, TW_CY - TW_D / 2 - 0.06,
        BH, 0.07, 0.18, TW_H, DARK)

# Tower top slab
box('dark_TowerTop', TW_CX, TW_CY, BH + TW_H, TW_W + 0.30, TW_D + 0.30, 0.22, DARK)

# ═════════════════════════════════════════════════════════════════════════════
# 5. RIGHT WING (L leg)
#    Front face set back 2.0 m from main block datum
# ═════════════════════════════════════════════════════════════════════════════
WING_BODY_Y0 = WING_Y0 + 0.30   # wing body starts 0.30 behind wing facade datum
WING_FAD     = WING_Y0           # wing facade datum
WING_CY_BODY = WING_BODY_Y0 + WD / 2

box('Body_Wing', WCX, WING_CY_BODY, 0, WW, WD, BH, PLASTER)

# Wing facade: piers + glass (same system as main block)
n_wing_bays = int(WW / BAY_W)
wing_bay_span = WW / n_wing_bays

for fl in range(NFLOORS):
    zb = fl * FL
    # Spandrel
    box(f'dark_SpandrelWing_F{fl}',
        WCX, WING_FAD - 0.06,
        zb, WW, 0.12, SPAN_H, DARK)
    # Glass panels
    for bi in range(n_wing_bays):
        bx = WCX - WW / 2 + (bi + 0.5) * wing_bay_span
        box(f'glass_WingWin_F{fl}_B{bi}',
            bx, WING_FAD - GLASS_D / 2,
            zb + SPAN_H,
            WW / n_wing_bays - PIER_W, GLASS_D,
            GWIN_H, GLASS)

# Wing piers
for bi in range(n_wing_bays + 1):
    px = WCX - WW / 2 + bi * wing_bay_span
    box(f'dark_PierWing_{bi:02d}',
        px, WING_FAD - PIER_D / 2,
        0, PIER_W, PIER_D, BH, DARK)

# Wing top spandrel
box('dark_SpandrelWing_Top', WCX, WING_FAD - 0.06, BH, WW, 0.12, SPAN_H, DARK)

# Wing side face (right)
box('Plaster_WingSideR', WCX + WW / 2 + 0.16, WING_CY_BODY, 0,
    0.32, WD, BH, CONC)
# Wing back face
box('Plaster_WingBack', WCX, WING_BODY_Y0 + WD + 0.16, 0,
    WW, 0.32, BH, CONC)

# Wing parapet
box('dark_ParapetWingF', WCX, WING_FAD - 0.12, BH, WW + 0.24, 0.24, 0.55, DARK)
box('dark_ParapetWingR', WCX + WW / 2 + 0.12, WING_CY_BODY, BH,
    0.24, WD + 0.48, 0.55, DARK)
box('dark_ParapetWingB', WCX, WING_BODY_Y0 + WD + 0.12, BH, WW + 0.24, 0.24, 0.55, DARK)

# Wing roof overhang (smaller, same projection)
WING_OH_FRONT = WING_FAD - OH_PROJ
WING_OH_BACK  = WING_BODY_Y0 + WD
WING_OH_SPAN  = WING_OH_BACK - WING_OH_FRONT
WING_OH_CY    = (WING_OH_FRONT + WING_OH_BACK) / 2

box('Concrete_WingRoofSlab', WCX, WING_OH_CY, BH, WW + 0.40, WING_OH_SPAN, OH_T, CONC)
box('dark_WingFasciaFront', WCX, WING_OH_FRONT + 0.12, BH, WW + 0.40, 0.24, OH_T + 0.08, DARK)
box('dark_WingFasciaR', WCX + WW / 2 + 0.20, WING_OH_CY, BH, 0.24, WING_OH_SPAN, OH_T + 0.08, DARK)

# ═════════════════════════════════════════════════════════════════════════════
# 6. JUNCTION — connecting element between main block and wing
#    Glass / open staircase volume visible in sketch between the two blocks
# ═════════════════════════════════════════════════════════════════════════════
JCX   = MCX + MW / 2    # junction X = 25.0 (right edge of main block)
JW    = 0.0             # the junction is at the abutment line
# Connecting glass spine (full height, narrow)
box('glass_Junction',
    JCX, (WING_FAD + BODY_Y0) / 2,
    0, 0.50, WING_FAD - BODY_Y0 + 2.0, BH, GLASS)

# Dark frame around junction
box('dark_JunctionFrameT', JCX, (WING_FAD + FAD) / 2, BH - 0.10,
    0.80, WING_FAD - FAD + 0.30, 0.30, DARK)

# ═════════════════════════════════════════════════════════════════════════════
# 7. LIGHTING
# ═════════════════════════════════════════════════════════════════════════════
bpy.ops.object.light_add(type='AREA', location=(-30.0, -40.0, 28.0))
key = bpy.context.active_object; key.name = 'Key'
key.rotation_euler = (math.radians(-25), 0, math.radians(-20))
key.data.energy = 300.0; key.data.color = (1.00, 0.98, 0.94); key.data.size = 40.0

bpy.ops.object.light_add(type='AREA', location=(60.0, 5.0, 18.0))
fill = bpy.context.active_object; fill.name = 'Fill'
fill.rotation_euler = (math.radians(-15), 0, math.radians(65))
fill.data.energy = 140.0; fill.data.color = (0.94, 0.96, 1.00); fill.data.size = 32.0

bpy.ops.object.light_add(type='AREA', location=(MCX, MD + 20.0, 18.0))
rim = bpy.context.active_object; rim.name = 'Rim'
rim.rotation_euler = (math.radians(42), 0, 0)
rim.data.energy = 70.0; rim.data.color = (0.90, 0.92, 0.96); rim.data.size = 26.0

# ═════════════════════════════════════════════════════════════════════════════
# 8. WORLD — warm paper white
# ═════════════════════════════════════════════════════════════════════════════
world = bpy.data.worlds.new('World_Sketch')
bpy.context.scene.world = world
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
wn.clear()
bg = wn.new('ShaderNodeBackground')
wo = wn.new('ShaderNodeOutputWorld')
wl.new(bg.outputs[0], wo.inputs[0])
bg.inputs['Color'].default_value    = (0.96, 0.95, 0.92, 1.0)
bg.inputs['Strength'].default_value = 0.55

# ═════════════════════════════════════════════════════════════════════════════
# 9. CAMERA — front-left three-quarter (matches sketch angle)
# ═════════════════════════════════════════════════════════════════════════════
CAM_POS = mathutils.Vector((-55.0, -38.0, 16.0))
CAM_TGT = mathutils.Vector((WCX * 0.3, MD * 0.4, BH * 0.42))
bpy.ops.object.camera_add(location=CAM_POS)
cam = bpy.context.active_object; cam.name = 'Camera_Main'
cam.data.lens = 38
cam.rotation_euler = (CAM_TGT - CAM_POS).normalized().to_track_quat('-Z', 'Y').to_euler()
bpy.context.scene.camera = cam

# ═════════════════════════════════════════════════════════════════════════════
# 10. RENDER + FREESTYLE
# ═════════════════════════════════════════════════════════════════════════════
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
try:   fl.crease_angle = math.radians(30)
except: pass

# Pass 1: silhouette
ls1 = fl.linesets[0] if fl.linesets else fl.linesets.new('Silhouette')
ls1.name = 'Silhouette'
ls1.select_silhouette = True;  ls1.select_crease = False
ls1.select_border = True;      ls1.select_edge_mark = True
ls1.select_external_contour = True; ls1.select_material_boundary = False
try:
    ly1 = ls1.linestyle; ly1.name = 'Ink_Thick'
    ly1.color = (0.04, 0.03, 0.01); ly1.alpha = 0.90; ly1.thickness = 2.2
except Exception as e: print(f'LS1: {e}')

# Pass 2: crease
try:
    ls2 = fl.linesets.new('Details')
    ls2.select_silhouette = False; ls2.select_crease = True
    ls2.select_border = False;     ls2.select_edge_mark = False
    ls2.select_external_contour = False; ls2.select_material_boundary = False
    ly2 = ls2.linestyle; ly2.name = 'Ink_Thin'
    ly2.color = (0.08, 0.06, 0.03); ly2.alpha = 0.62; ly2.thickness = 0.85
except Exception as e: print(f'LS2: {e}')

# ─── Summary ──────────────────────────────────────────────────────────────────
print()
print('=' * 64)
print('  SECANT LLP — L-shaped Institutional Building v2')
print('=' * 64)
objs = [o for o in bpy.data.objects if o.type == 'MESH']
print(f'  Mesh objects : {len(objs)}')
print(f'  Polys        : {sum(len(o.data.polygons) for o in objs):,}')
print()
print(f'  Main block  {MW:.0f}m × {MD:.0f}m × {BH:.1f}m ({NFLOORS} floors)')
print(f'  Right wing  {WW:.0f}m × {WD:.0f}m × {BH:.1f}m')
print(f'  Overhang    {OH_PROJ:.1f}m projection')
print()
print('  Z-fight prevention:')
print('    Body front at Y = +0.30')
print('    Piers front at Y = -0.22  (offset 0.52 m from body)')
print('    Glass front at Y = -0.10  (offset 0.40 m from body)')
print()
print('  F12 → Render | Export → glTF 2.0 → public/assets/base.glb')
print('=' * 64)

