"""
SECANT Architects LLP — Institutional Building  (sketch-match v1)
==================================================================
Matches the pencil sketch: 4-storey modernist block with glass curtain
wall, strong horizontal roof overhang, taller right wing, entrance ramps,
flanking trees. No pool, no gate, no playground — just the building.

LINEWORK RENDER:
  · All surfaces → flat Diffuse BSDF, near-white sketch tones
  · Glass → opaque sketch-blue (no transparency = no z-fight)
  · Two Freestyle passes: silhouette 2.2px + crease 0.9px
  · World = warm paper white, Standard view transform
  · 64 samples

Blender Z-up, real-world metres.
"""

import bpy, math, mathutils

# ─────────────────────────────────────────────────────────────
# CLEAR SCENE
# ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for col in [bpy.data.meshes, bpy.data.materials,
            bpy.data.cameras, bpy.data.lights]:
    for item in list(col): col.remove(item)

# ─────────────────────────────────────────────────────────────
# MATERIALS
# ─────────────────────────────────────────────────────────────
def mat(name, rgb):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, l = m.node_tree.nodes, m.node_tree.links
    n.clear()
    out  = n.new('ShaderNodeOutputMaterial')
    diff = n.new('ShaderNodeBsdfDiffuse')
    l.new(diff.outputs[0], out.inputs[0])
    diff.inputs['Color'].default_value     = (*rgb, 1.0)
    diff.inputs['Roughness'].default_value = 0.92
    return m

PLASTER  = mat('Plaster',      (0.96, 0.94, 0.90))   # bright paper white
CONC     = mat('Concrete',     (0.72, 0.70, 0.66))   # medium grey concrete
CONC_DK  = mat('ConcreteDark', (0.22, 0.20, 0.18))   # dark concrete / ink
GLASS    = mat('Glass',        (0.72, 0.84, 0.93))   # opaque sketch blue
GLASS_LT = mat('GlassLight',   (0.84, 0.91, 0.97))   # paler glass
GRASS    = mat('Grass',        (0.78, 0.80, 0.74))   # pale lawn
CROWN    = mat('Crown',        (0.42, 0.50, 0.30))   # tree mass
TRUNK    = mat('Trunk',        (0.38, 0.32, 0.24))   # tree trunk

# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
def box(name, cx, cy, z_bot, w, d, h, m):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(cx, cy, z_bot + h * 0.5))
    o = bpy.context.active_object
    o.name = name; o.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.clear(); o.data.materials.append(m)
    return o

def cyl(name, cx, cy, z_bot, r, h, m, segs=24):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=r, depth=h, vertices=segs,
        location=(cx, cy, z_bot + h * 0.5))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.clear(); o.data.materials.append(m)
    return o

def sphere(name, cx, cy, cz, r, m, seg=10, ring=8):
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=r, segments=seg, ring_count=ring,
        location=(cx, cy, cz))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.clear(); o.data.materials.append(m)
    return o

# ─────────────────────────────────────────────────────────────
# WEDGE / RAMP helper (sheared box for entrance ramps)
# ─────────────────────────────────────────────────────────────
def ramp(name, cx, cy, z_bot, w, d, h_front, h_back, m):
    """Create a wedge: front edge at h_front, back edge at h_back."""
    import bmesh
    mesh = bpy.data.meshes.new(name)
    obj  = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bm = bmesh.new()
    hw, hd = w / 2, d / 2
    verts = [
        bm.verts.new((-hw, -hd, z_bot)),
        bm.verts.new(( hw, -hd, z_bot)),
        bm.verts.new(( hw,  hd, z_bot)),
        bm.verts.new((-hw,  hd, z_bot)),
        bm.verts.new((-hw, -hd, z_bot + h_front)),
        bm.verts.new(( hw, -hd, z_bot + h_front)),
        bm.verts.new(( hw,  hd, z_bot + h_back)),
        bm.verts.new((-hw,  hd, z_bot + h_back)),
    ]
    faces = [(0,1,2,3),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
    for f in faces: bm.faces.new([verts[i] for i in f])
    bm.to_mesh(mesh); bm.free()
    obj.location = (cx, cy, 0)
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True); bpy.context.view_layer.objects.active = obj
    bpy.ops.object.origin_set(type='ORIGIN_GEOMETRY')
    obj.data.materials.clear(); obj.data.materials.append(m)
    return obj

# ═════════════════════════════════════════════════════════════
# BUILDING DIMENSIONS  (matches sketch proportions)
# ═════════════════════════════════════════════════════════════
FLOOR_H   = 3.40    # floor-to-floor height
N_FLOORS  = 4       # number of storeys
MAIN_H    = FLOOR_H * N_FLOORS          # 13.6 m
MAIN_W    = 50.0    # main block width
MAIN_D    = 13.0    # main block depth
MAIN_CX   = 0.0
MAIN_CY   = 0.0

# Right wing (taller, narrower)
WING_W    = 14.0
WING_D    = 11.0
WING_H    = FLOOR_H * 5    # 17 m — slightly taller than main
WING_CX   = MAIN_CX + MAIN_W / 2 + WING_W / 2
WING_CY   = MAIN_CY + (MAIN_D - WING_D) / 2    # flush back

# Roof overhang slab
OH_PROJ   = 2.20    # projection beyond facade
OH_T      = 0.45    # slab thickness
OH_W      = MAIN_W + OH_PROJ * 2
OH_D      = MAIN_D + OH_PROJ
OH_CX     = MAIN_CX
OH_CY     = MAIN_CY - OH_PROJ / 2

# Curtain wall grid
MULLION_W = 0.12    # width of vertical mullion
TRANSOM_H = 0.14    # height of horizontal transom
BAY_W     = 3.0     # bay width (centre-to-centre)
WIN_H     = FLOOR_H - TRANSOM_H * 2 - 0.10   # window height per floor

# ═════════════════════════════════════════════════════════════
# 1. GROUND PLANE
# ═════════════════════════════════════════════════════════════
box('Grass_Ground', MAIN_CX, MAIN_CY, -0.06, 150.0, 80.0, 0.06, GRASS)

# ═════════════════════════════════════════════════════════════
# 2. MAIN BLOCK — solid concrete body
# ═════════════════════════════════════════════════════════════
box('Conc_MainBody', MAIN_CX, MAIN_CY, 0, MAIN_W, MAIN_D, MAIN_H, CONC)

# ─── Curtain wall: glass panels on front face (Y = -MAIN_D/2) ──
FRONT_Y = MAIN_CY - MAIN_D / 2
n_bays = int(MAIN_W / BAY_W)
bay_actual = MAIN_W / n_bays

for floor in range(N_FLOORS):
    z_floor = floor * FLOOR_H
    # Full-width glass band per floor
    box(f'Glass_Band_F{floor}',
        MAIN_CX, FRONT_Y - 0.03,
        z_floor + TRANSOM_H,
        MAIN_W, 0.06,
        WIN_H, GLASS)
    # Transom strips (top + bottom of each floor band)
    box(f'ConcDk_TransomBot_F{floor}',
        MAIN_CX, FRONT_Y - 0.02,
        z_floor,
        MAIN_W, 0.04, TRANSOM_H, CONC_DK)
    box(f'ConcDk_TransomTop_F{floor}',
        MAIN_CX, FRONT_Y - 0.02,
        z_floor + TRANSOM_H + WIN_H,
        MAIN_W, 0.04, TRANSOM_H, CONC_DK)

# Vertical mullions
for bi in range(n_bays + 1):
    mx = MAIN_CX - MAIN_W / 2 + bi * bay_actual
    box(f'ConcDk_Mullion_{bi}',
        mx, FRONT_Y - 0.02,
        0, MULLION_W, 0.04, MAIN_H, CONC_DK)

# Horizontal floor bands visible on facade (spandrel panels)
for floor in range(N_FLOORS + 1):
    box(f'Conc_Spandrel_F{floor}',
        MAIN_CX, FRONT_Y - 0.08,
        floor * FLOOR_H - 0.10,
        MAIN_W, 0.16, 0.20, CONC)

# ─── Side faces ─────────────────────────────────────────────
# Left side: solid plaster with narrow windows
box('Plaster_MainLeft', MAIN_CX - MAIN_W/2 - 0.16, MAIN_CY, 0,
    0.32, MAIN_D, MAIN_H, PLASTER)
for floor in range(N_FLOORS):
    z_fl = floor * FLOOR_H + 0.60
    box(f'Glass_LeftWin_F{floor}',
        MAIN_CX - MAIN_W/2 - 0.04, MAIN_CY,
        z_fl, 0.08, MAIN_D * 0.45, WIN_H * 0.7, GLASS_LT)

# Back face: solid plaster
box('Plaster_MainBack', MAIN_CX, MAIN_CY + MAIN_D/2 + 0.16, 0,
    MAIN_W, 0.32, MAIN_H, PLASTER)

# ─── Top parapet ────────────────────────────────────────────
box('ConcDk_ParapetFront', MAIN_CX, FRONT_Y - 0.12,
    MAIN_H, MAIN_W + 0.24, 0.24, 0.60, CONC_DK)
box('ConcDk_ParapetBack',  MAIN_CX, MAIN_CY + MAIN_D/2 + 0.12,
    MAIN_H, MAIN_W + 0.24, 0.24, 0.60, CONC_DK)
box('ConcDk_ParapetL',     MAIN_CX - MAIN_W/2 - 0.12, MAIN_CY,
    MAIN_H, 0.24, MAIN_D + 0.48, 0.60, CONC_DK)

# ═════════════════════════════════════════════════════════════
# 3. ROOF OVERHANG SLAB (projects forward and to sides)
# ═════════════════════════════════════════════════════════════
box('Conc_RoofOverhang', OH_CX, OH_CY, MAIN_H, OH_W, OH_D, OH_T, CONC)
# Dark fascia edge on overhang
box('ConcDk_FasciaFront', OH_CX, OH_CY - OH_D/2 + 0.12, MAIN_H,
    OH_W, 0.24, OH_T + 0.10, CONC_DK)
box('ConcDk_FasciaL',     OH_CX - OH_W/2 + 0.12, OH_CY, MAIN_H,
    0.24, OH_D, OH_T + 0.10, CONC_DK)
box('ConcDk_FasciaR',     OH_CX + OH_W/2 - 0.12, OH_CY, MAIN_H,
    0.24, OH_D, OH_T + 0.10, CONC_DK)

# ═════════════════════════════════════════════════════════════
# 4. RIGHT WING
# ═════════════════════════════════════════════════════════════
box('Conc_WingBody', WING_CX, WING_CY, 0, WING_W, WING_D, WING_H, CONC)

# Wing curtain wall (front face)
WING_FRONT_Y = WING_CY - WING_D / 2
n_wing_bays = int(WING_W / BAY_W)
wing_bay_w  = WING_W / n_wing_bays
wing_floors = 5

for floor in range(wing_floors):
    z_fl = floor * FLOOR_H
    box(f'Glass_WingBand_F{floor}',
        WING_CX, WING_FRONT_Y - 0.03,
        z_fl + TRANSOM_H,
        WING_W, 0.06, WIN_H, GLASS)
    box(f'ConcDk_WingTransB_F{floor}',
        WING_CX, WING_FRONT_Y - 0.02,
        z_fl,
        WING_W, 0.04, TRANSOM_H, CONC_DK)
    box(f'ConcDk_WingTransT_F{floor}',
        WING_CX, WING_FRONT_Y - 0.02,
        z_fl + TRANSOM_H + WIN_H,
        WING_W, 0.04, TRANSOM_H, CONC_DK)

for bi in range(n_wing_bays + 1):
    mx = WING_CX - WING_W/2 + bi * wing_bay_w
    box(f'ConcDk_WingMull_{bi}',
        mx, WING_FRONT_Y - 0.02,
        0, MULLION_W, 0.04, WING_H, CONC_DK)

# Wing roof
box('Conc_WingRoof', WING_CX, WING_CY, WING_H, WING_W + 0.60, WING_D + 0.60, OH_T, CONC)
box('ConcDk_WingParF', WING_CX, WING_FRONT_Y - 0.12, WING_H,
    WING_W + 0.48, 0.24, 0.55, CONC_DK)
box('ConcDk_WingParR', WING_CX + WING_W/2 + 0.12, WING_CY, WING_H,
    0.24, WING_D + 0.48, 0.55, CONC_DK)
box('Plaster_WingBack', WING_CX, WING_CY + WING_D/2 + 0.16, 0,
    WING_W, 0.32, WING_H, PLASTER)

# ═════════════════════════════════════════════════════════════
# 5. ENTRANCE RAMPS (two wedge shapes in front of main building)
# ═════════════════════════════════════════════════════════════
RAMP_Z    = 0.0
RAMP_W    = 9.0
RAMP_D    = 5.5
RAMP_H_HI = 1.20   # high end (close to building)
RAMP_H_LO = 0.04   # low end (street level)

ramp('Conc_RampLeft',
     MAIN_CX - 9.0,
     FRONT_Y - RAMP_D / 2 - 0.5,
     RAMP_Z, RAMP_W, RAMP_D, RAMP_H_LO, RAMP_H_HI, CONC)

ramp('Conc_RampRight',
     MAIN_CX + 9.0,
     FRONT_Y - RAMP_D / 2 - 0.5,
     RAMP_Z, RAMP_W, RAMP_D, RAMP_H_LO, RAMP_H_HI, CONC)

# ═════════════════════════════════════════════════════════════
# 6. ENTRANCE CANOPY (thin slab over central entry)
# ═════════════════════════════════════════════════════════════
box('Conc_EntryCanopy',
    MAIN_CX, FRONT_Y - 2.5,
    FLOOR_H * 1.5,
    14.0, 5.0, 0.30, CONC)
box('ConcDk_CanopyFascia',
    MAIN_CX, FRONT_Y - 5.0 + 0.12,
    FLOOR_H * 1.5,
    14.0, 0.24, 0.40, CONC_DK)

# ═════════════════════════════════════════════════════════════
# 7. TREES (flanking the building — conical/spherical crowns)
# ═════════════════════════════════════════════════════════════
TREE_Y = FRONT_Y - 5.0

def tree(name, tx, ty, trunk_h=6.0, crown_r=3.0):
    cyl(f'Trunk_{name}', tx, ty, 0, 0.22, trunk_h, TRUNK, 12)
    sphere(f'Crown_{name}', tx, ty, trunk_h + crown_r * 0.5,
           crown_r, CROWN, 10, 8)

# Left cluster
tree('L1', MAIN_CX - MAIN_W/2 - 4.0, TREE_Y + 2.0, 7.0, 3.5)
tree('L2', MAIN_CX - MAIN_W/2 - 2.5, TREE_Y - 3.0, 5.5, 2.8)
tree('L3', MAIN_CX - MAIN_W/2 - 6.0, TREE_Y - 1.0, 8.0, 4.0)

# Right cluster
tree('R1', WING_CX + WING_W/2 + 3.5, TREE_Y + 1.0, 7.5, 3.8)
tree('R2', WING_CX + WING_W/2 + 6.0, TREE_Y - 2.0, 5.0, 2.5)
tree('R3', WING_CX + WING_W/2 + 1.5, TREE_Y - 4.0, 6.0, 3.0)

# A few trees behind the building
tree('B1', MAIN_CX - 15.0, MAIN_CY + MAIN_D/2 + 5.0, 9.0, 4.5)
tree('B2', MAIN_CX + 5.0,  MAIN_CY + MAIN_D/2 + 4.0, 7.5, 3.5)

# ═════════════════════════════════════════════════════════════
# 8. BIRDS (minimal — two thin ellipsoids in sky)
# ═════════════════════════════════════════════════════════════
for bx, by, bz in [(8.0, -25.0, MAIN_H + 6.0), (14.0, -22.0, MAIN_H + 8.0),
                   (20.0, -24.0, MAIN_H + 5.5), (26.0, -20.0, MAIN_H + 7.0)]:
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=0.22, segments=6, ring_count=4, location=(bx, by, bz))
    bird = bpy.context.active_object
    bird.name = f'Bird_{bx}'
    bird.scale = (1.0, 3.5, 0.3)
    bpy.ops.object.transform_apply(scale=True)
    bird.data.materials.clear(); bird.data.materials.append(CONC_DK)

# ═════════════════════════════════════════════════════════════
# 9. SCENE LIGHTING — soft flat wash for linework
# ═════════════════════════════════════════════════════════════
bpy.ops.object.light_add(type='AREA', location=(20.0, -40.0, 30.0))
key = bpy.context.active_object; key.name = 'Sketch_Key'
key.rotation_euler = (math.radians(-20), 0, math.radians(-10))
key.data.energy = 280.0; key.data.color = (1.00, 0.98, 0.94); key.data.size = 40.0

bpy.ops.object.light_add(type='AREA', location=(60.0, 10.0, 20.0))
fill = bpy.context.active_object; fill.name = 'Sketch_Fill'
fill.rotation_euler = (math.radians(-20), 0, math.radians(60))
fill.data.energy = 120.0; fill.data.color = (0.94, 0.96, 1.00); fill.data.size = 30.0

bpy.ops.object.light_add(type='AREA', location=(MAIN_CX, MAIN_D + 15.0, 20.0))
rim = bpy.context.active_object; rim.name = 'Sketch_Rim'
rim.rotation_euler = (math.radians(40), 0, 0)
rim.data.energy = 60.0; rim.data.color = (0.92, 0.94, 0.97); rim.data.size = 24.0

# ═════════════════════════════════════════════════════════════
# 10. WORLD — warm paper white
# ═════════════════════════════════════════════════════════════
world = bpy.data.worlds.new('World_Sketch')
bpy.context.scene.world = world
world.use_nodes = True
wn, wl = world.node_tree.nodes, world.node_tree.links
wn.clear()
bg = wn.new('ShaderNodeBackground')
wo = wn.new('ShaderNodeOutputWorld')
wl.new(bg.outputs[0], wo.inputs[0])
bg.inputs['Color'].default_value    = (0.960, 0.948, 0.920, 1.0)
bg.inputs['Strength'].default_value = 0.55

# ═════════════════════════════════════════════════════════════
# 11. CAMERA — front-right three-quarter view (matches sketch angle)
# ═════════════════════════════════════════════════════════════
CAM_POS = mathutils.Vector((MAIN_CX - 55.0, FRONT_Y - 45.0, 20.0))
CAM_TGT = mathutils.Vector((MAIN_CX + 10.0, MAIN_CY,  MAIN_H * 0.45))
bpy.ops.object.camera_add(location=CAM_POS)
cam = bpy.context.active_object; cam.name = 'Camera_Main'
cam.data.lens = 35
direction = (CAM_TGT - CAM_POS).normalized()
cam.rotation_euler = direction.to_track_quat('-Z','Y').to_euler()
bpy.context.scene.camera = cam

# ═════════════════════════════════════════════════════════════
# 12. RENDER SETTINGS — Cycles + two Freestyle line sets
# ═════════════════════════════════════════════════════════════
sc = bpy.context.scene
sc.render.engine        = 'CYCLES'
sc.cycles.samples       = 64
sc.cycles.use_denoising = True
sc.render.resolution_x  = 1920
sc.render.resolution_y  = 1080
sc.view_settings.view_transform = 'Standard'
try:   sc.view_settings.look = 'None'
except: pass
sc.view_settings.exposure = 0.0
sc.view_settings.gamma   = 1.0
try: sc.cycles.denoiser = 'OPENIMAGEDENOISE'
except: pass

sc.render.use_freestyle = True
vl = sc.view_layers[0]
vl.use_freestyle = True
fl = vl.freestyle_settings
try:   fl.crease_angle = math.radians(35)
except: pass

# Pass 1: thick silhouette
if fl.linesets:
    ls1 = fl.linesets[0]; ls1.name = 'Silhouette'
else:
    ls1 = fl.linesets.new('Silhouette')
ls1.select_silhouette        = True
ls1.select_crease            = False
ls1.select_border            = True
ls1.select_edge_mark         = True
ls1.select_external_contour  = True
ls1.select_material_boundary = False
try:
    ly1 = ls1.linestyle; ly1.name = 'Ink_Thick'
    ly1.color = (0.04, 0.03, 0.01); ly1.alpha = 0.90; ly1.thickness = 2.2
except Exception as e: print(f'Linestyle1: {e}')

# Pass 2: thin crease / detail
try:
    ls2 = fl.linesets.new('Details')
    ls2.select_silhouette        = False
    ls2.select_crease            = True
    ls2.select_border            = False
    ls2.select_edge_mark         = False
    ls2.select_external_contour  = False
    ls2.select_material_boundary = False
    ly2 = ls2.linestyle; ly2.name = 'Ink_Thin'
    ly2.color = (0.08, 0.06, 0.03); ly2.alpha = 0.65; ly2.thickness = 0.9
except Exception as e: print(f'Linestyle2: {e}')

print()
print('='*64)
print('  SECANT Architects — Institutional Building (sketch-match)')
print('='*64)
objs = [o for o in bpy.data.objects if o.type == 'MESH']
print(f'  Mesh objects : {len(objs)}')
print(f'  Poly count   : {sum(len(o.data.polygons) for o in objs):,}')
print()
print('  BUILDING:')
print(f'  · Main block  {MAIN_W:.0f}m × {MAIN_D:.0f}m × {MAIN_H:.1f}m  ({N_FLOORS} floors)')
print(f'  · Right wing  {WING_W:.0f}m × {WING_D:.0f}m × {WING_H:.1f}m  (5 floors)')
print(f'  · Roof overhang {OH_PROJ:.1f}m projection')
print()
print('  F12 → Render (Cycles 64spp + Freestyle)')
print('  EXPORT → File > Export > glTF 2.0 > public/assets/base.glb')
print('='*64)

