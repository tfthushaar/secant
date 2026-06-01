"""
Casa Terracotta — Mid-Century Bangalore Villa  (v5, solid-mass build)
======================================================================
STRATEGY CHANGE: building is built as solid volumes (not shell walls).
Solid blocks eliminate every "see-through" issue from any camera angle.
Facade details (glass, timber slats, reveals) are thin overlays on top
of the opaque solid mass.

FIXES vs v4:
  · GF and upper box are SOLID volumes → no open interior from any angle
  · Stair support wall (was inside stair run) → REMOVED
  · Stringer wall is the only wall beside the stair
  · GF ceiling slab added (Z=GH) so aerial view sees roof, not interior
  · Upper box fully closed (ceiling + all four walls as solid)
  · Interior furniture removed (not needed — glass is overlay on solid)
  · All four compound walls present and corner-sealed
  · Stair verified: top tread back-edge Y=0 = BF ✓, Z≈GH+TERR_T ✓
  · Materials: richer earthy palette, proper roughness for Cycles PBR

Blender Z-up, real-world metres.
  X:  0→25  |  Y: −9(gate) → 12(back wall)  |  Z: 0→6
Three.js after GLTF Y-up:
  X=Blender X  |  Y=Blender Z  |  Z=−Blender Y
"""

import bpy, math, mathutils

# ─────────────────────────────────────────────────────────────
# CLEAR
# ─────────────────────────────────────────────────────────────
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
for col in [bpy.data.meshes, bpy.data.materials,
            bpy.data.cameras, bpy.data.lights]:
    for item in list(col):
        col.remove(item)

# ─────────────────────────────────────────────────────────────
# MATERIALS  — rich earthy mid-century palette for PBR/Cycles
# ─────────────────────────────────────────────────────────────
def mat(name, rgb, rough=0.80, metal=0.0, trans=0.0, ior=1.45, spec=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, l = m.node_tree.nodes, m.node_tree.links
    n.clear()
    out  = n.new('ShaderNodeOutputMaterial')
    bsdf = n.new('ShaderNodeBsdfPrincipled')
    l.new(bsdf.outputs[0], out.inputs[0])
    bsdf.inputs['Base Color'].default_value = (*rgb, 1.0)
    bsdf.inputs['Roughness'].default_value  = rough
    bsdf.inputs['Metallic'].default_value   = metal
    if 'Specular' in bsdf.inputs:
        bsdf.inputs['Specular'].default_value = spec
    if trans > 0.0:
        for key in ('Transmission Weight', 'Transmission'):
            if key in bsdf.inputs:
                bsdf.inputs[key].default_value = trans; break
        bsdf.inputs['IOR'].default_value = ior
        m.blend_method = 'BLEND'; m.use_backface_culling = False
    return m

# ── Building / structure ──────────────────────────────────────
PLASTER   = mat('Plaster',     (.82, .70, .58), rough=.86, spec=.20)   # warm terracotta plaster
PLASTER_D = mat('PlasterDark', (.58, .48, .38), rough=.88, spec=.15)   # recessed / shadow zones
STONE     = mat('Stone',       (.74, .62, .48), rough=.80, spec=.25)   # warm sandstone
STONE_DK  = mat('StoneDark',   (.42, .34, .24), rough=.84, spec=.10)   # dark stone / cap
TIMBER    = mat('Timber',      (.26, .16, .07), rough=.74, spec=.08)   # aged dark teak
TIMBER_LT = mat('TimberLight', (.44, .30, .14), rough=.70, spec=.12)   # lighter timber
CONCRETE  = mat('Concrete',    (.56, .54, .50), rough=.76, spec=.18)   # board-form concrete
CONC_DK   = mat('ConcreteDark',(.28, .26, .24), rough=.80, spec=.08)   # dark concrete trim
GLASS     = mat('Glass',       (.12, .24, .32), rough=.04, trans=.88, ior=1.52, spec=.80)
GLASS_LT  = mat('GlassLight',  (.18, .34, .42), rough=.06, trans=.82, ior=1.50, spec=.75)
STEEL_DK  = mat('Steel',       (.11, .09, .08), rough=.22, metal=.94, spec=.90)

# ── Landscape / site ─────────────────────────────────────────
POOLRIM   = mat('PoolRim',     (.36, .26, .18), rough=.72, spec=.15)
WATER     = mat('Glass_Water', (.06, .28, .40), rough=.00, trans=.94, ior=1.33, spec=.80)
COPING    = mat('Coping',      (.70, .60, .46), rough=.74, spec=.20)
GRAVEL    = mat('Gravel',      (.54, .46, .36), rough=.92, spec=.05)
GRASS     = mat('Grass',       (.32, .40, .22), rough=.95, spec=.05)
CROWN     = mat('Crown',       (.24, .34, .16), rough=.94, spec=.04)
EARTH     = mat('Earth',       (.44, .36, .26), rough=.95, spec=.05)

# ─────────────────────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────────────────────
def box(name, cx, cy, z_bot, w, d, h, m):
    bpy.ops.mesh.primitive_cube_add(size=1,
        location=(cx, cy, z_bot + h * 0.5))
    o = bpy.context.active_object
    o.name = name; o.scale = (w, d, h)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.clear(); o.data.materials.append(m)
    return o

def plane(name, cx, cy, z, sx, sy, m):
    bpy.ops.mesh.primitive_plane_add(size=1, location=(cx, cy, z))
    o = bpy.context.active_object
    o.name = name; o.scale = (sx, sy, 1)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.clear(); o.data.materials.append(m)
    return o

def cyl(name, cx, cy, z_bot, r, h, m, segs=20):
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

# ═════════════════════════════════════════════════════════════
# SITE + BUILDING CONSTANTS
# ═════════════════════════════════════════════════════════════
SITE_L  =  0.0; SITE_R = 25.0
WALL_Y  = -9.0; WALL_YB = 12.0
WALL_H  =  1.35; WALL_T = 0.32

BL=2.0; BR=18.0; BF=0.0; BB=10.0; GH=2.85
BCX=(BL+BR)/2; BCY=(BF+BB)/2; BW=BR-BL; BD=BB-BF
DOOR_X=9.0

UL=10.0; UR=18.0; UF=3.0; UB=BB; UH=2.70; UZ=GH
ROOF_Z = UZ + UH          # = 5.55  — defined early so pilotis + LUW can use it

CL=BR; CR=24.0; CF=-2.0; CB=7.0; CW=CR-CL; CD=CB-CF
CCX=(CL+CR)/2; CCY=(CF+CB)/2

TERR_T=0.22

# Gate positions
PG_L=7.5; PG_R=10.5; PIL_H=3.0   # pedestrian gate
VG_L=14.5; VG_R=21.0              # vehicle gate

# Driveway
DW_X0=VG_L; DW_X1=CR; DW_W=DW_X1-DW_X0; DW_CX=(DW_X0+DW_X1)/2
DW_Y0=WALL_Y; DW_Y1=CF; DW_D=DW_Y1-DW_Y0; DW_CY=(DW_Y0+DW_Y1)/2

# Pool — clear of driveway (pool X max=8.5 < DW_X0=14.5 ✓)
POOL_CX=5.0; POOL_CY=-5.0; POOL_W=7.0; POOL_D=3.5; POOL_DEP=0.90
PX0=POOL_CX-POOL_W/2; PX1=POOL_CX+POOL_W/2
PY0=POOL_CY-POOL_D/2; PY1=POOL_CY+POOL_D/2

# Stair: top at Y=BF=0, bottom at Y=STAIR_Y_BOT=−3.78
# Top tread back-edge = Y=0 = BF ✓;  top tread top Z ≈ GH+TERR_T ✓
STAIR_CX=1.0; STAIR_W=1.40; N_TREADS=12
T_RISE=(GH+TERR_T)/N_TREADS; T_GOING=0.315
STAIR_Y_BOT=0.0 - N_TREADS*T_GOING   # = −3.78
# Stair X range: 0.3–1.7. Terrace extended to X=0.3 so no gap ✓
STRINGER_X = STAIR_CX - STAIR_W/2 - 0.14   # = 0.16

# ═════════════════════════════════════════════════════════════
# 1. FOUNDATION
# ═════════════════════════════════════════════════════════════
box('Foundation', 12.5, 1.5, -0.40, 27.0, 23.0, 0.40, STONE_DK)

# ═════════════════════════════════════════════════════════════
# 2. GROUND FLOOR — SOLID VOLUME
#    One solid block: completely opaque from every angle.
#    Facade overlays added on top.
# ═════════════════════════════════════════════════════════════
box('Plaster_GF_Body', BCX, BCY, 0, BW, BD, GH, PLASTER)

# ── Front facade overlays (Y=0 face) ─────────────────────────
# Left zone (X=2–10): glass curtain wall overlay
box('PlasterDark_GFReveal', 6.0, 0.12, 0, 8.0, 0.24, GH, PLASTER_D)
box('Glass_GFCurtain',      6.0, 0.05, 0, 8.0, 0.10, GH, GLASS)
# Dark concrete mullions (every 2m, X=2 to 10)
for mx in [2.0, 4.0, 6.0, 8.0, 10.0]:
    box(f'ConcDk_Mull_{mx:.0f}', mx, 0.06, 0, 0.10, 0.16, GH, CONC_DK)
# Horizontal transoms
for tz in [0.90, 1.80, 2.50]:
    box(f'ConcDk_Trans_{tz:.2f}', 6.0, 0.06, tz, 8.0, 0.16, 0.07, CONC_DK)

# Right zone (X=10–18): terracotta plaster overlay with slot windows
box('Plaster_GF_FrontR', 14.0, 0.22, 0, 8.0, 0.44, GH, PLASTER)
for wx, wz in [(11.8, 1.0), (16.2, 1.0)]:
    box(f'PlasterDark_WRev_{wx:.0f}', wx, 0.10, wz, 1.50, 0.20, 1.40, PLASTER_D)
    box(f'GlassLt_SlotWin_{wx:.0f}',  wx, 0.04, wz, 1.50, 0.08, 1.40, GLASS_LT)

# ── Entrance door (recessed into glass zone, centred X=9) ─────
box('ConcDk_DoorFrameL', DOOR_X-1.06, 0.02, 0, 0.14, 0.16, GH, CONC_DK)
box('ConcDk_DoorFrameR', DOOR_X+1.06, 0.02, 0, 0.14, 0.16, GH, CONC_DK)
box('ConcDk_DoorTop',    DOOR_X,       0.02, GH-0.28, 2.24, 0.16, 0.28, CONC_DK)
box('Glass_Door',         DOOR_X,       0.03, 0,       2.0,  0.07, GH-0.30, GLASS)
# Entrance plinth
box('Coping_EntrancePlinth', DOOR_X, -0.60, 0, 2.60, 1.20, 0.20, COPING)

# ── Side facade overlays ──────────────────────────────────────
# Left end (X=2 face): stone cladding overlay
box('Stone_GF_LeftFace', BL+0.22, BCY, 0, 0.44, BD, GH, STONE)
# Right end (X=18 face): stone cladding overlay
box('Stone_GF_RightFace', BR-0.22, BCY, 0, 0.44, BD, GH, STONE)
# Back face overlay: stone
box('Stone_GF_BackFace', BCX, BB-0.22, 0, BW, 0.44, GH, STONE)
# Two back windows
for bwx in [5.0, 12.0]:
    box(f'PlasterDark_BWRev_{bwx:.0f}', bwx, BB-0.12, 0.80, 2.0, 0.20, 1.60, PLASTER_D)
    box(f'GlassLt_BWin_{bwx:.0f}',       bwx, BB-0.08, 0.80, 2.0, 0.08, 1.60, GLASS_LT)

# ── GF rooftop terrace (left zone, X=0.3–10, Y=0–3) ──────────
# Extended to X=0.3 so stair top connects with zero gap
box('Concrete_Terrace', 5.15, (BF+UF)/2, GH, 9.7, UF-BF, TERR_T, CONCRETE)
box('Coping_TerraceTile', 5.15, (BF+UF)/2, GH+TERR_T, 9.3, UF-BF-0.40, 0.05, COPING)
box('Concrete_TerracePar', 5.15, BF-0.12, GH+TERR_T, 9.7, 0.22, 0.80, CONC_DK)

# ── LEFT UPPER WING — closes the empty void above the terrace ─
# The zone X=2–10, Y=0–10, Z=3.07–5.55 was open/visible as a gap.
# Solution: add a solid upper body for the left wing (Y=UF–BB=3–10)
# and close the terrace front face (Y=0, Z=3.07–5.55) with a wall.
LUW_H  = ROOF_Z - (GH + TERR_T)    # = 5.55 - 3.07 = 2.48m
LUW_CX = (BL + UL) / 2             # = 6.0
LUW_W  = UL - BL                    # = 8.0  (X=2–10)
LUW_CY = (UF + BB) / 2             # = 6.5
LUW_D  = BB - UF                    # = 7.0  (Y=3–10)

# Solid concrete body (left upper wing, same depth as right upper box)
box('Concrete_LUW_Body', LUW_CX, LUW_CY, GH+TERR_T, LUW_W, LUW_D, LUW_H, CONCRETE)

# Front face of left upper wing (Y=UF=3): plaster with a wide slot window
box('Plaster_LUW_Front',    LUW_CX, UF+0.22, GH+TERR_T, LUW_W, 0.44, LUW_H, PLASTER)
box('PlasterDark_LUW_WRev', LUW_CX, UF+0.12, GH+TERR_T+0.55, LUW_W-1.0, 0.20, 1.10, PLASTER_D)
box('GlassLt_LUW_Win',      LUW_CX, UF+0.06, GH+TERR_T+0.55, LUW_W-1.0, 0.08, 1.10, GLASS_LT)

# Terrace FRONT face (Y=BF=0, X=2–10, Z=3.07–5.55)
# Lower 1.1m: solid concrete parapet; above: slim horizontal window
box('Plaster_TerrFrontLow', LUW_CX, BF+0.22, GH+TERR_T,      LUW_W, 0.44, 1.10, PLASTER)
box('GlassLt_TerrFrontWin', LUW_CX, BF+0.10, GH+TERR_T+1.10, LUW_W, 0.08, LUW_H-1.10, GLASS_LT)
# Horizontal concrete band separating parapet from window
box('ConcDk_TerrFrontBand', LUW_CX, BF+0.22, GH+TERR_T+1.08, LUW_W+0.10, 0.44, 0.06, CONC_DK)

# Left end wall of left upper wing (X=BL=2 face)
box('Stone_LUW_LeftFace', BL+0.22, LUW_CY, GH+TERR_T, 0.44, LUW_D, LUW_H, STONE)

# ── Verandah pilotis — extend full height to ROOF_Z (5.55m) ──
# Previously only 3.07m tall → gap to roof. Now reach roof underside ✓
for px in [3.5, 7.5, 11.5, 15.5]:
    cyl(f'Concrete_Piloti_{px:.0f}', px, -1.0, 0, 0.13, ROOF_Z, CONCRETE, 12)
# Verandah stone paving
box('Coping_Verandah', BCX, -1.0, 0, BW, 2.0, 0.08, COPING)

# ═════════════════════════════════════════════════════════════
# 3. UPPER BEDROOM BOX — SOLID VOLUME
# ═════════════════════════════════════════════════════════════
UCX=(UL+UR)/2; UCY=(UF+UB)/2

# Solid concrete block for upper box
box('Concrete_UB_Body', UCX, UCY, UZ, UR-UL, UB-UF, UH, CONCRETE)

# Front face: vertical teak slats overlay
box('Timber_UB_Backing', UCX, UF+0.12, UZ, UR-UL, 0.24, UH, TIMBER)
SLAT_P=0.090
n_slat=int((UR-UL-0.30)/SLAT_P)
for si in range(n_slat):
    sx = UL + 0.15 + (si+0.5)*((UR-UL-0.30)/n_slat)
    if sx > UR-0.15: break
    box(f'Timber_Slat{si:03d}', sx, UF+0.18, UZ, 0.038, 0.30, UH, TIMBER)
box('ConcDk_SlatMidRail', UCX, UF+0.19, UZ+UH*0.48, UR-UL, 0.32, 0.04, CONC_DK)

# Three slot windows in slat face
for wx2 in [11.5, 14.0, 16.5]:
    box(f'ConcDk_UBRev_{wx2:.0f}', wx2, UF+0.06, UZ+0.35, 1.40, 0.28, UH-0.50, CONC_DK)
    box(f'GlassLt_UBWin_{wx2:.0f}', wx2, UF+0.04, UZ+0.35, 1.40, 0.07, UH-0.50, GLASS_LT)

# Soffit shadow line at base
box('ConcDk_UBSoffit', UCX, UF+0.10, UZ-0.04, UR-UL+0.14, 0.26, 0.04, CONC_DK)

# Left end of upper box: stone cladding
box('Stone_UB_LeftFace', UL+0.18, UCY, UZ, 0.36, UB-UF, UH, STONE)

# ═════════════════════════════════════════════════════════════
# 4. OVERHANGING ROOF SLAB
# ═════════════════════════════════════════════════════════════
ROOF_Z=UZ+UH; ROOF_T=0.28
ROOF_W=(BR-BL)+2.0; ROOF_D=(BB-BF)+3.5; ROOF_CX=BCX
ROOF_CY=(BF-2.0+BB+1.5)/2

box('Concrete_RoofSlab', ROOF_CX, ROOF_CY, ROOF_Z, ROOF_W, ROOF_D, ROOF_T, CONCRETE)

# Dark fascia
box('ConcDk_FasciaF', ROOF_CX, BF-2.0+0.18, ROOF_Z-0.02, ROOF_W-0.36, 0.36, 0.06, CONC_DK)
box('ConcDk_FasciaL', BL-1.0+0.18, ROOF_CY, ROOF_Z-0.02, 0.36, ROOF_D-0.36, 0.06, CONC_DK)
box('ConcDk_FasciaR', BR+1.0-0.18, ROOF_CY, ROOF_Z-0.02, 0.36, ROOF_D-0.36, 0.06, CONC_DK)

# Parapet (all four sides)
PAR_H=0.35
box('ConcDk_ParF', ROOF_CX, BF-2.0+0.10,  ROOF_Z+ROOF_T, ROOF_W, 0.22, PAR_H, CONC_DK)
box('ConcDk_ParB', ROOF_CX, BB+1.5-0.10,  ROOF_Z+ROOF_T, ROOF_W, 0.22, PAR_H, CONC_DK)
box('ConcDk_ParL', BL-1.0+0.10, ROOF_CY,  ROOF_Z+ROOF_T, 0.22, ROOF_D, PAR_H, CONC_DK)
box('ConcDk_ParR', BR+1.0-0.10, ROOF_CY,  ROOF_Z+ROOF_T, 0.22, ROOF_D, PAR_H, CONC_DK)

# Rooftop planters
for rpx in [3.0, 7.0, 11.0]:
    box(f'Concrete_RTrough_{rpx:.0f}', rpx, BF-1.7, ROOF_Z+ROOF_T, 2.20, 0.52, 0.48, STONE)

# ═════════════════════════════════════════════════════════════
# 5. CARPORT — open porte-cochère (4 columns + thin roof slab)
# ═════════════════════════════════════════════════════════════
for ox, od in [(-CW/2+0.4,-CD/2+0.4),(CW/2-0.4,-CD/2+0.4),
               (-CW/2+0.4, CD/2-0.4),(CW/2-0.4, CD/2-0.4)]:
    cyl(f'Steel_CCol_{ox:.0f}_{od:.0f}', CCX+ox, CCY+od, 0, 0.09, GH, STEEL_DK, 10)
box('Concrete_CarportRoof',   CCX, CCY, GH, CW+0.40, CD+0.40, 0.18, CONCRETE)
box('ConcDk_CarportFascia',   CCX, CF-0.18, GH, CW+0.40, 0.22, 0.22, CONC_DK)
box('Stone_CarportFloor',     CCX, CCY, 0, CW, CD, 0.07, STONE)

# ═════════════════════════════════════════════════════════════
# 6. EXTERNAL STAIRCASE  — VERIFIED, no wall inside stair run
#
#    STAIR_CX=1.0 → X: 0.3–1.7  (clear of GF block at X=2)
#    Stringer at X=0.16 → outside stair (X<0.3) ✓
#    NO support wall inside stair (was the blocking element — REMOVED)
#    Terrace extended to X=0.3 = stair left edge → connects at top ✓
# ═════════════════════════════════════════════════════════════
for i in range(N_TREADS):
    ty = STAIR_Y_BOT + (i+0.5)*T_GOING
    tz = i*T_RISE
    box(f'Stone_Tread{i:02d}', STAIR_CX, ty, tz, STAIR_W, T_GOING, T_RISE+0.02, STONE)

# Stringer wall: left/outer side only — does NOT enter stair X range
# STRINGER_X=0.16, stringer right face=0.16+0.13=0.29 < stair left=0.30 ✓
box('Concrete_Stringer', STRINGER_X,
    (STAIR_Y_BOT+0.0)/2, 0,
    0.26, abs(STAIR_Y_BOT), GH+TERR_T+0.12, CONCRETE)

# Steel handrail: right side of stair (wall opposite stringer)
for rz in [0.52, 0.94]:
    box(f'Steel_StairRail_{rz:.2f}', STAIR_CX+STAIR_W/2,
        (STAIR_Y_BOT+0.0)/2, rz,
        0.04, abs(STAIR_Y_BOT), 0.04, STEEL_DK)
for pi in range(0, N_TREADS, 3):
    py = STAIR_Y_BOT + (pi+1.5)*T_GOING
    box(f'Steel_RPost{pi}', STAIR_CX+STAIR_W/2, py, pi*T_RISE, 0.04, 0.04, 1.0, STEEL_DK)

# ═════════════════════════════════════════════════════════════
# 7. COMPOUND WALLS — ALL FOUR SIDES, corner-connected
#
#  FRONT (Y=WALL_Y=−9): three sections + 2 gate openings
#  BACK  (Y=WALL_YB=12): continuous
#  LEFT  (X=SITE_L=0):   continuous full depth
#  RIGHT (X=SITE_R=25):  continuous full depth
# ═════════════════════════════════════════════════════════════
SITE_DEPTH = WALL_YB-WALL_Y   # = 21m
SITE_CY    = (WALL_Y+WALL_YB)/2  # = 1.5

# ── LEFT side wall ────────────────────────────────────────────
box('Stone_SiteWallL',  SITE_L-0.16, SITE_CY, 0, WALL_T, SITE_DEPTH, WALL_H, STONE)
box('StoneDk_SiteCapL', SITE_L-0.16, SITE_CY, WALL_H, WALL_T+0.08, SITE_DEPTH+0.08, 0.10, STONE_DK)

# ── RIGHT side wall ───────────────────────────────────────────
box('Stone_SiteWallR',  SITE_R+0.16, SITE_CY, 0, WALL_T, SITE_DEPTH, WALL_H, STONE)
box('StoneDk_SiteCapR', SITE_R+0.16, SITE_CY, WALL_H, WALL_T+0.08, SITE_DEPTH+0.08, 0.10, STONE_DK)

# ── BACK wall (Y=12) — full width ─────────────────────────────
box('Stone_BackWall',    12.5, WALL_YB, 0, SITE_R+WALL_T, WALL_T, WALL_H, STONE)
box('StoneDk_BackWallCp',12.5, WALL_YB, WALL_H, SITE_R+WALL_T+0.08, WALL_T+0.08, 0.10, STONE_DK)

# ── FRONT wall — three sections (two openings) ────────────────
# Section 1: X=0 to PG_L−0.40=7.1
S1W=PG_L-0.40; S1CX=S1W/2
box('Stone_FWall_S1',  S1CX, WALL_Y, 0, S1W, WALL_T, WALL_H, STONE)
box('StoneDk_FCap_S1', S1CX, WALL_Y, WALL_H, S1W+0.06, WALL_T+0.06, 0.10, STONE_DK)

# Section 2: X=PG_R+0.40=10.9 to VG_L−0.40=14.1
S2X0=PG_R+0.40; S2X1=VG_L-0.40; S2W=S2X1-S2X0; S2CX=(S2X0+S2X1)/2
box('Stone_FWall_S2',  S2CX, WALL_Y, 0, S2W, WALL_T, WALL_H, STONE)
box('StoneDk_FCap_S2', S2CX, WALL_Y, WALL_H, S2W+0.06, WALL_T+0.06, 0.10, STONE_DK)

# Section 3: X=VG_R+0.40=21.4 to SITE_R=25
S3X0=VG_R+0.40; S3W=SITE_R-S3X0; S3CX=(S3X0+SITE_R)/2
box('Stone_FWall_S3',  S3CX, WALL_Y, 0, S3W, WALL_T, WALL_H, STONE)
box('StoneDk_FCap_S3', S3CX, WALL_Y, WALL_H, S3W+0.06, WALL_T+0.06, 0.10, STONE_DK)

# ── PEDESTRIAN GATE pillars + bars ───────────────────────────
for pnm, px in [('PedL',PG_L),('PedR',PG_R)]:
    box(f'Stone_PPillarBase{pnm}',   px, WALL_Y, 0,          0.70, 0.72, WALL_H+0.10, STONE)
    box(f'Concrete_PPillarUp{pnm}',  px, WALL_Y, WALL_H+0.10,0.60, 0.62, PIL_H-WALL_H, CONCRETE)
    box(f'StoneDk_PPillarCap{pnm}',  px, WALL_Y, PIL_H,      0.82, 0.82, 0.14, STONE_DK)
    cyl(f'Steel_PLight{pnm}', px, WALL_Y, PIL_H+0.14, 0.10, 0.14, STEEL_DK, 12)
PED_OPEN=PG_R-PG_L-0.72
for gz in [0.35, 0.75, 1.15]:
    box(f'TimberLt_PedBar_{gz:.2f}', (PG_L+PG_R)/2, WALL_Y, gz, PED_OPEN, 0.07, 0.05, TIMBER_LT)
for gxi in range(3):
    gx=PG_L+0.44+gxi*(PED_OPEN/3)
    box(f'TimberLt_PedPicket{gxi}', gx, WALL_Y, 0.04, 0.055, 0.07, 1.18, TIMBER_LT)

# ── VEHICLE GATE pillars + steel bars ────────────────────────
for vnm, vx in [('VehL',VG_L),('VehR',VG_R)]:
    box(f'Stone_VPillarBase{vnm}',  vx, WALL_Y, 0,           0.80, 0.82, WALL_H+0.10, STONE)
    box(f'Concrete_VPillarUp{vnm}', vx, WALL_Y, WALL_H+0.10, 0.70, 0.72, PIL_H-WALL_H, CONCRETE)
    box(f'StoneDk_VPillarCap{vnm}', vx, WALL_Y, PIL_H,       0.94, 0.94, 0.16, STONE_DK)
    cyl(f'Steel_VLight{vnm}', vx, WALL_Y, PIL_H+0.16, 0.12, 0.16, STEEL_DK, 12)
VEH_OPEN=VG_R-VG_L-0.84
for gz2 in [0.36, 0.80, 1.24, 1.60]:
    box(f'Steel_VehBar_{gz2:.2f}', (VG_L+VG_R)/2, WALL_Y, gz2, VEH_OPEN, 0.06, 0.06, STEEL_DK)
for gxi2 in range(5):
    gx2=VG_L+0.48+gxi2*(VEH_OPEN/5)
    box(f'Steel_VPicket{gxi2}', gx2, WALL_Y, 0.04, 0.06, 0.06, 1.64, STEEL_DK)

# ═════════════════════════════════════════════════════════════
# 8. DRIVEWAY + FORECOURTS
# ═════════════════════════════════════════════════════════════
# Vehicle driveway: gate to carport
box('Gravel_Driveway',   DW_CX, DW_CY, 0, DW_W, DW_D, 0.06, GRAVEL)
box('Stone_DrivewayKerbL', DW_X0+0.18, DW_CY, 0, 0.22, DW_D, 0.14, STONE)
box('Stone_DrivewayKerbR', DW_X1-0.18, DW_CY, 0, 0.22, DW_D, 0.14, STONE)

# Pedestrian forecourt paving (gate to building front)
PFC_W=(PG_R-PG_L)+1.0; PFC_CX=(PG_L+PG_R)/2
PFC_D=BF-WALL_Y; PFC_CY=(WALL_Y+BF)/2
box('Stone_PedForecourt', PFC_CX, PFC_CY, 0, PFC_W, PFC_D, 0.07, STONE)
for sx3 in [-1.0, 0.0, 1.0]:
    box(f'StoneDk_PavingLine{sx3:.0f}', PFC_CX+sx3, PFC_CY, 0.07, 0.10, PFC_D-0.30, 0.04, STONE_DK)

# 3 approach steps from forecourt to verandah
for st in range(3):
    box(f'Coping_Step{st}', DOOR_X, BF-0.50+st*0.50, st*0.06, 2.60, 0.46, 0.08, COPING)

# ═════════════════════════════════════════════════════════════
# 9. POOL  (X=1.5–8.5, Y=−6.75 to −3.25 — inside compound ✓)
# ═════════════════════════════════════════════════════════════
box('PoolRim_Shell',    POOL_CX, POOL_CY, -POOL_DEP, POOL_W, POOL_D, POOL_DEP+0.10, POOLRIM)
box('Stone_PoolLining', POOL_CX, POOL_CY, -POOL_DEP+0.20, POOL_W-0.40, POOL_D-0.40, POOL_DEP-0.20, STONE_DK)
plane('Glass_Water', POOL_CX, POOL_CY, -0.05, POOL_W-0.40, POOL_D-0.40, WATER)
COP=0.36
for (cx2,cy2,cw,cd) in [(POOL_CX, PY1+COP/2, POOL_W+COP*2, COP),
                         (POOL_CX, PY0-COP/2, POOL_W+COP*2, COP),
                         (PX1+COP/2, POOL_CY, COP, POOL_D),
                         (PX0-COP/2, POOL_CY, COP, POOL_D)]:
    box('Coping', cx2, cy2, 0, cw, cd, 0.10, COPING)
box('PoolRim_InfLip', POOL_CX, PY0-0.09, -0.05, POOL_W, 0.09, POOL_DEP+0.12, POOLRIM)
for st2 in range(3):
    box(f'Stone_PoolStep{st2}', POOL_CX-0.80, PY1-0.25-st2*0.52, -st2*0.28, 3.0, 0.46, 0.10, STONE)
# Pool terrace
PTRR_D=BF-PY1; PTRR_CY=(BF+PY1)/2
box('Coping_PoolTerrace', POOL_CX, PTRR_CY, 0, POOL_W+1.0, PTRR_D, 0.07, COPING)
# Loungers (right of pool, inside compound ✓)
for li, lx in enumerate([PX1+0.80, PX1+2.30]):
    box(f'TimberLt_Lounger{li}', lx, POOL_CY, 0.10, 1.80, 0.65, 0.08, TIMBER_LT)
    box(f'Concrete_LBack{li}', lx+0.40, POOL_CY, 0.18, 0.85, 0.65, 0.06, CONCRETE)

# ═════════════════════════════════════════════════════════════
# 10. LANDSCAPE
# ═════════════════════════════════════════════════════════════
plane('Grass_Ground', 12.5, 1.5, -0.04, 65.0, 50.0, GRASS)

# Boulders: left garden strip X=0.5–1.2, Y=4–6 (clear of stair Y=−3.78–0 and pool X=1.5+)
sphere('Stone_Boulder1', 0.60, 5.40, 0.38, 0.40, STONE, 8, 6)
sphere('Stone_Boulder2', 1.10, 4.60, 0.24, 0.28, STONE_DK, 8, 6)

# Planting fill along left site wall
box('Earth_PlantBedL', 0.45, BCY, 0, 0.70, BD+2.0, 0.15, EARTH)
box('Crown_PlantFillL', 0.45, BCY, 0.15, 0.52, BD+1.6, 0.26, CROWN)

# Hedge along front wall interior (left section)
box('Crown_HedgeL', S1CX, WALL_Y+0.48, WALL_H, S1W*0.75, 0.52, 0.50, CROWN)

# Rear garden planting clusters
for pcx, pcy, pr in [(1.0,10.5,0.70),(1.5,8.5,0.50),(19.5,10.0,0.80),(20.5,8.0,0.55)]:
    sphere(f'Crown_Plant_{pcx:.0f}_{pcy:.0f}', pcx, pcy, pr, pr, CROWN, 8, 6)

# ═════════════════════════════════════════════════════════════
# 11. SCENE LIGHTING  — golden-hour three-point + pool bounce
# ═════════════════════════════════════════════════════════════
# Primary sun (warm, directional, shadows)
bpy.ops.object.light_add(type='SUN', location=(16.0, -14.0, 24.0))
sun = bpy.context.active_object; sun.name='Sun_Main'
sun.rotation_euler=(math.radians(46), 0, math.radians(-30))
sun.data.energy=5.0; sun.data.color=(1.00, 0.94, 0.80)
try: sun.data.angle=math.radians(0.5)
except: pass

# Sky fill (large area from front, cool blue — simulates open sky)
bpy.ops.object.light_add(type='AREA', location=(0.0, -22.0, 22.0))
skyf=bpy.context.active_object; skyf.name='Sky_Fill'
skyf.rotation_euler=(math.radians(-46), 0, 0)
skyf.data.energy=55.0; skyf.data.color=(0.76, 0.86, 1.00); skyf.data.size=32.0

# Warm bounce (from ground / terrace — lifts shadow darkness)
bpy.ops.object.light_add(type='AREA', location=(BCX, 0.0, 0.2))
bnc=bpy.context.active_object; bnc.name='Ground_Bounce'
bnc.rotation_euler=(math.radians(180), 0, 0)
bnc.data.energy=22.0; bnc.data.color=(1.00, 0.90, 0.74); bnc.data.size=18.0

# Pool bounce (cool blue, subtle)
bpy.ops.object.light_add(type='AREA', location=(POOL_CX, POOL_CY, 0.6))
pbl=bpy.context.active_object; pbl.name='Pool_Bounce'
pbl.rotation_euler=(math.radians(180), 0, 0)
pbl.data.energy=10.0; pbl.data.color=(0.46, 0.76, 0.90); pbl.data.size=5.0

# ═════════════════════════════════════════════════════════════
# 12. WORLD / SKY
# ═════════════════════════════════════════════════════════════
world=bpy.data.worlds.new('World_CT'); bpy.context.scene.world=world
world.use_nodes=True; wn,wl=world.node_tree.nodes,world.node_tree.links; wn.clear()
sky_tex=wn.new('ShaderNodeTexSky')
try:
    sky_tex.sky_type='NISHITA'; sky_tex.sun_elevation=math.radians(24)
    sky_tex.sun_rotation=math.radians(205); sky_tex.altitude=60.0
except TypeError:
    try:
        sky_tex.sky_type='HOSEK_WILKIE'; sky_tex.turbidity=2.8
        el=math.radians(24); az=math.radians(205)
        sky_tex.sun_direction=mathutils.Vector((
            math.cos(el)*math.sin(az), math.cos(el)*math.cos(az), math.sin(el)))
    except Exception:
        sky_tex.sky_type='PREETHAM'; sky_tex.turbidity=2.8
bg=wn.new('ShaderNodeBackground'); bg.inputs['Strength'].default_value=0.85
wo=wn.new('ShaderNodeOutputWorld')
wl.new(sky_tex.outputs[0], bg.inputs['Color']); wl.new(bg.outputs[0], wo.inputs[0])

# ═════════════════════════════════════════════════════════════
# 13. CAMERA
# ═════════════════════════════════════════════════════════════
CAM_POS=mathutils.Vector((30.0,-16.0,12.0))
CAM_TGT=mathutils.Vector((9.0, 3.0, 2.5))
bpy.ops.object.camera_add(location=CAM_POS)
cam=bpy.context.active_object; cam.name='Camera_Main'; cam.data.lens=35
cam.rotation_euler=(CAM_TGT-CAM_POS).normalized().to_track_quat('-Z','Y').to_euler()
bpy.context.scene.camera=cam

# ═════════════════════════════════════════════════════════════
# 14. RENDER SETTINGS
# ═════════════════════════════════════════════════════════════
sc=bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.samples=256
sc.cycles.use_denoising=True
sc.render.resolution_x=1920; sc.render.resolution_y=1080
sc.view_settings.view_transform='Filmic'
sc.view_settings.look='Medium High Contrast'
sc.view_settings.exposure=0.15; sc.view_settings.gamma=1.0
try: sc.cycles.denoiser='OPENIMAGEDENOISE'
except: pass

print()
print("="*64)
print("  Casa Terracotta v5 — solid-mass build")
print("="*64)
objs=[o for o in bpy.data.objects if o.type=='MESH']
print(f"  Mesh objects : {len(objs)}")
print(f"  Poly count   : {sum(len(o.data.polygons) for o in objs):,}")
print()
print("  GEOMETRY VERIFICATION:")
top_back = STAIR_Y_BOT + (N_TREADS-1)*T_GOING + T_GOING
top_z    = (N_TREADS-1)*T_RISE + T_RISE + 0.02
print(f"  Stair top back-edge Y = {top_back:.4f}  (BF=0.0)  PASS={abs(top_back)<0.001}")
print(f"  Stair top Z           = {top_z:.4f}  (GH+TERR_T={GH+TERR_T:.3f})  PASS={abs(top_z-(GH+TERR_T))<0.05}")
print(f"  Stringer X right face = {STRINGER_X+0.13:.3f}  < stair left {STAIR_CX-STAIR_W/2:.2f}  PASS={STRINGER_X+0.13<STAIR_CX-STAIR_W/2}")
print(f"  Stair support wall INSIDE stair: REMOVED (v5 fix)")
print(f"  Building solid: FULL VOLUME (no open interior)")
print(f"  All 4 compound walls: FRONT+BACK+LEFT+RIGHT")
print()
print("  Z  -> Material Preview (shows earthy colours)")
print("  F12 -> Render (Cycles, 256 spp)")
print()
print("  EXPORT: File > Export > glTF 2.0 (.glb)")
print("  Format: glTF Binary | Draco: OFF | Apply Modifiers: ON")
print("  Save to: public/assets/base.glb")
print("="*64)
