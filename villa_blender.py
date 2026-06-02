"""
Casa Nova — Contemporary Bangalore Villa  (v7, linework render)
===================================================================
UPGRADE vs v6:
  · Cylindrical bay-window tower projecting from left façade
  · Semi-circular entrance arch (torus ring over door)
  · Elliptical swimming pool (cylinder scaled to oval)
  · Spiral external staircase (helix of stone treads)
  · Circular fountain courtyard between pool and gate
  · Curved fascia edge on cantilever roof (half-cylinder)
  · Cylindrical upper pavilion on right wing
  · Arch gateway (two torus rings on gate pillars)
  · Increased site: 32 m wide × 26 m deep

LINEWORK RENDER:
  · All materials → flat Diffuse BSDF, near-white sketch tones
  · Glass → opaque sky-blue (eliminates ALL z-fight flicker)
  · Two Freestyle line sets: thick silhouette (2.4 px) + thin crease (1.1 px)
  · crease_angle = 40° → more edge detail on curved surfaces
  · World = warm paper white
  · Standard view transform (no Filmic tone mapping)
  · 64 samples (diffuse converges instantly)

Blender Z-up, real-world metres.
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
# MATERIALS  — flat Diffuse BSDF, linework sketch palette
# trans / metal / spec ignored → all surfaces opaque = no flicker
# ─────────────────────────────────────────────────────────────
def mat(name, rgb, rough=0.95, metal=0.0, trans=0.0, ior=1.45, spec=0.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    n, l = m.node_tree.nodes, m.node_tree.links
    n.clear()
    out  = n.new('ShaderNodeOutputMaterial')
    diff = n.new('ShaderNodeBsdfDiffuse')
    l.new(diff.outputs[0], out.inputs[0])
    diff.inputs['Color'].default_value     = (*rgb, 1.0)
    diff.inputs['Roughness'].default_value = max(rough, 0.88)
    return m

PLASTER   = mat('Plaster',      (.96, .94, .90))   # bright paper white
PLASTER_D = mat('PlasterDark',  (.82, .78, .70))   # warm shadow cream
STONE     = mat('Stone',        (.74, .70, .62))   # warm grey stone
STONE_DK  = mat('StoneDark',    (.46, .42, .36))   # dark stone
TIMBER    = mat('Timber',       (.29, .21, .12))   # dark ink timber
TIMBER_LT = mat('TimberLight',  (.54, .44, .28))   # light teak
CONCRETE  = mat('Concrete',     (.64, .62, .58))   # warm grey concrete
CONC_DK   = mat('ConcreteDark', (.25, .23, .21))   # dark concrete / ink
GLASS     = mat('Glass',        (.74, .86, .94))   # opaque sketch blue
GLASS_LT  = mat('GlassLight',   (.82, .91, .97))   # paler sketch blue
STEEL_DK  = mat('Steel',        (.31, .29, .27))   # dark steel
POOLRIM   = mat('PoolRim',      (.58, .46, .34))   # warm terracotta rim
WATER     = mat('Glass_Water',  (.60, .80, .92))   # opaque pool blue
COPING    = mat('Coping',       (.82, .78, .68))   # warm coping
GRAVEL    = mat('Gravel',       (.67, .63, .57))   # gravel
GRASS     = mat('Grass',        (.66, .72, .52))   # sketch lawn
CROWN     = mat('Crown',        (.38, .50, .26))   # plant mass
EARTH     = mat('Earth',        (.62, .54, .42))   # soil / planting bed

# ─────────────────────────────────────────────────────────────
# PRIMITIVE HELPERS
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

def cyl(name, cx, cy, z_bot, r, h, m, segs=32):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=r, depth=h, vertices=segs,
        location=(cx, cy, z_bot + h * 0.5))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.clear(); o.data.materials.append(m)
    return o

def sphere(name, cx, cy, cz, r, m, seg=12, ring=9):
    bpy.ops.mesh.primitive_uv_sphere_add(
        radius=r, segments=seg, ring_count=ring,
        location=(cx, cy, cz))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.clear(); o.data.materials.append(m)
    return o

def torus(name, cx, cy, cz, maj_r, min_r, m, maj_seg=48, min_seg=12):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=maj_r, minor_radius=min_r,
        major_segments=maj_seg, minor_segments=min_seg,
        location=(cx, cy, cz))
    o = bpy.context.active_object
    o.name = name
    o.data.materials.clear(); o.data.materials.append(m)
    return o

def oval_cyl(name, cx, cy, z_bot, rx, ry, h, m, segs=64):
    """Elliptical cylinder (scale on XY after creation)."""
    bpy.ops.mesh.primitive_cylinder_add(
        vertices=segs, radius=1.0, depth=h,
        location=(cx, cy, z_bot + h * 0.5))
    o = bpy.context.active_object
    o.name = name
    o.scale = (rx, ry, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    o.data.materials.clear(); o.data.materials.append(m)
    return o

# ═════════════════════════════════════════════════════════════
# SITE + BUILDING CONSTANTS
# ═════════════════════════════════════════════════════════════
SITE_L = 0.0;  SITE_R = 32.0
WALL_Y = -10.0; WALL_YB = 16.0
WALL_H = 1.40;  WALL_T = 0.32

# Ground floor block
BL=2.0; BR=22.0; BF=0.0; BB=11.0; GH=3.10
BCX=(BL+BR)/2; BCY=(BF+BB)/2; BW=BR-BL; BD=BB-BF
DOOR_X = 10.0

# Upper box (right half of building)
UL=12.0; UR=22.0; UF=3.5; UB=BB; UH=2.90; UZ=GH
UCX=(UL+UR)/2; UCY=(UF+UB)/2

# Cylindrical upper pavilion on far right
PAV_CX = UR + 0.0  # aligns with right edge of upper box
PAV_CY = (UF+UB)/2
PAV_R  = 4.2
PAV_H  = UH
PAV_Z  = UZ

# Roof
TERR_T = 0.24
ROOF_Z  = UZ + UH           # top of upper box / roof slab bottom
ROOF_T  = 0.30
ROOF_W  = (BR - BL) + 3.0
ROOF_D  = (BB - BF) + 4.0
ROOF_CX = BCX
ROOF_CY = (BF - 2.0 + BB + 2.0) / 2

# Bay window (cylindrical projection on front-left façade)
BAY_CX = 6.0; BAY_R = 2.2; BAY_SEGS = 36

# Entrance arch
ARCH_CX = DOOR_X; ARCH_R = 1.5

# Gate positions
PG_L=8.0;  PG_R=12.0; PIL_H=3.4
VG_L=17.0; VG_R=24.0

# Driveway
DW_CX=(VG_L+SITE_R)/2; DW_CY=(WALL_Y+BF)/2

# Oval pool
POOL_CX=7.0; POOL_CY=-6.0; POOL_RX=5.5; POOL_RY=3.0; POOL_DEP=1.10

# Circular fountain
FOUNT_CX=10.0; FOUNT_CY=-3.8; FOUNT_R=1.2

# Spiral stair (left corner of building)
STAIR_CX=2.4; STAIR_CY=-1.8
STAIR_R=1.4; N_TREADS=14; STAIR_TOTAL_RISE=GH+TERR_T

# Carport
CL=BR; CR=30.0; CF=-2.0; CB=8.0
CW=CR-CL; CD=CB-CF; CCX=(CL+CR)/2; CCY=(CF+CB)/2

# ═════════════════════════════════════════════════════════════
# 1. FOUNDATION
# ═════════════════════════════════════════════════════════════
box('Foundation', 16.0, 3.0, -0.45, 34.0, 30.0, 0.45, STONE_DK)

# ═════════════════════════════════════════════════════════════
# 2. GROUND FLOOR — SOLID VOLUME
# ═════════════════════════════════════════════════════════════
box('Plaster_GF_Body', BCX, BCY, 0, BW, BD, GH, PLASTER)

# ── Cylindrical bay-window tower (left front façade, X≈6, projects Y−) ──
cyl('Bay_Body',       BAY_CX, BF - BAY_R * 0.55, 0,    BAY_R, GH,        PLASTER,  BAY_SEGS)
cyl('Bay_Glass',      BAY_CX, BF - BAY_R * 0.55, 0.40, BAY_R + 0.08, GH - 0.80, GLASS, BAY_SEGS)
cyl('Bay_Cap',        BAY_CX, BF - BAY_R * 0.55, GH,   BAY_R + 0.14, 0.20, COPING,  BAY_SEGS)
# Thin mullion rings on bay
for bz in [GH * 0.33, GH * 0.66]:
    t = torus(f'Bay_Ring_{bz:.2f}', BAY_CX, BF - BAY_R * 0.55, bz,
              BAY_R + 0.09, 0.06, CONC_DK, 36, 8)
    t.rotation_euler.x = math.radians(90)

# ── Front façade overlays (Y=0 face) ─────────────────────────
# Right zone curtain wall (X=10–22, Y=0)
box('PlasterDark_GFReveal', 16.0, 0.14, 0, 12.0, 0.28, GH, PLASTER_D)
box('Glass_GFCurtain',      16.0, 0.06, 0, 12.0, 0.12, GH, GLASS)
for mx in [12.0, 14.0, 16.0, 18.0, 20.0, 22.0]:
    box(f'ConcDk_Mull_{mx:.0f}', mx, 0.07, 0, 0.10, 0.18, GH, CONC_DK)
for tz in [1.0, 2.0, 2.80]:
    box(f'ConcDk_Trans_{tz:.2f}', 16.0, 0.07, tz, 12.0, 0.18, 0.08, CONC_DK)

# Right zone slot windows on right half (X=10-22, replace bay zone)
for wx, wz in [(10.8, 1.1), (19.2, 1.1)]:
    box(f'PlasterDark_WRev_{wx:.0f}', wx, 0.12, wz, 1.60, 0.22, 1.60, PLASTER_D)
    box(f'GlassLt_SlotWin_{wx:.0f}',  wx, 0.05, wz, 1.60, 0.08, 1.60, GLASS_LT)

# ── Semi-circular entrance arch (torus, center at Z=0, top forms arch) ──
arch_torus = torus('Arch_Entrance', ARCH_CX, BF - 0.18, 0,
                   ARCH_R, 0.13, CONC_DK, 48, 10)
arch_torus.rotation_euler.x = math.radians(90)
# Vertical door frame posts that meet the arch
box('ConcDk_ArchPostL', ARCH_CX - ARCH_R, BF - 0.08, 0, 0.16, 0.28, GH * 0.55, CONC_DK)
box('ConcDk_ArchPostR', ARCH_CX + ARCH_R, BF - 0.08, 0, 0.16, 0.28, GH * 0.55, CONC_DK)
box('Glass_Door',        ARCH_CX, BF - 0.04, 0, 2.40, 0.08, GH - 0.30, GLASS)

# ── Entrance plinth + approach ────────────────────────────────
box('Coping_EntrancePlinth', ARCH_CX, BF - 0.70, 0, 3.20, 1.40, 0.22, COPING)

# ── Side facade cladding ──────────────────────────────────────
box('Stone_GF_LeftFace',  BL + 0.22, BCY, 0, 0.44, BD, GH, STONE)
box('Stone_GF_RightFace', BR - 0.22, BCY, 0, 0.44, BD, GH, STONE)
box('Stone_GF_BackFace',  BCX, BB - 0.22, 0, BW, 0.44, GH, STONE)
for bwx in [5.5, 14.0]:
    box(f'PlasterDark_BWRev_{bwx:.0f}', bwx, BB - 0.14, 0.90, 2.20, 0.22, 1.60, PLASTER_D)
    box(f'GlassLt_BWin_{bwx:.0f}',       bwx, BB - 0.06, 0.90, 2.20, 0.08, 1.60, GLASS_LT)

# ── GF terrace (left zone, X=2–12, Y=0–3.5) ─────────────────
box('Concrete_Terrace',    7.0, (BF + UF) / 2, GH, 10.0, UF - BF, TERR_T, CONCRETE)
box('Coping_TerraceTile',  7.0, (BF + UF) / 2, GH + TERR_T, 9.6, UF - BF - 0.40, 0.06, COPING)
box('Concrete_TerracePar', 7.0, BF - 0.14, GH + TERR_T, 10.0, 0.26, 0.85, CONC_DK)

# ═════════════════════════════════════════════════════════════
# 3. UPPER BOX — right wing solid volume
# ═════════════════════════════════════════════════════════════
box('Concrete_UB_Body', UCX, UCY, UZ, UR - UL, UB - UF, UH, CONCRETE)

# Timber slat front face
box('Timber_UB_Backing', UCX, UF + 0.14, UZ, UR - UL, 0.28, UH, TIMBER)
SLAT_P = 0.095
n_slat = int((UR - UL - 0.30) / SLAT_P)
for si in range(n_slat):
    sx = UL + 0.15 + (si + 0.5) * ((UR - UL - 0.30) / n_slat)
    if sx > UR - 0.15: break
    box(f'Timber_Slat{si:03d}', sx, UF + 0.20, UZ, 0.040, 0.34, UH, TIMBER)
box('ConcDk_SlatRail', UCX, UF + 0.21, UZ + UH * 0.48, UR - UL, 0.36, 0.05, CONC_DK)

# Slot windows through slat zone
for wx2 in [13.0, 16.0, 19.0]:
    box(f'ConcDk_UBRev_{wx2:.0f}',  wx2, UF + 0.07, UZ + 0.40, 1.50, 0.30, UH - 0.55, CONC_DK)
    box(f'GlassLt_UBWin_{wx2:.0f}', wx2, UF + 0.05, UZ + 0.40, 1.50, 0.08, UH - 0.55, GLASS_LT)

box('ConcDk_UBSoffit',   UCX,      UF + 0.12, UZ - 0.05, UR - UL + 0.16, 0.30, 0.05, CONC_DK)
box('Stone_UB_LeftFace', UL + 0.20, UCY,      UZ,         0.40, UB - UF, UH, STONE)

# ── Cylindrical pavilion (right upper wing, aligns with upper box right) ──
cyl('Pavilion_Body',  PAV_CX, PAV_CY, PAV_Z, PAV_R, PAV_H, CONCRETE, 48)
# Glass band on pavilion
cyl('Pavilion_Glass', PAV_CX, PAV_CY, PAV_Z + PAV_H * 0.35, PAV_R + 0.06, PAV_H * 0.40, GLASS, 48)
# Pavilion roof cap — flat disc
oval_cyl('Pavilion_RoofCap', PAV_CX, PAV_CY, PAV_Z + PAV_H, PAV_R + 0.50, PAV_R + 0.50, 0.32, CONCRETE, 48)
# Pavilion roof ring edge
t2 = torus('Pavilion_RoofRing', PAV_CX, PAV_CY, PAV_Z + PAV_H + 0.32,
           PAV_R + 0.50, 0.10, CONC_DK, 48, 10)
# Parapet fin on pavilion
box('Pavilion_Par', PAV_CX, PAV_CY + PAV_R - 0.12, PAV_Z + PAV_H + 0.32,
    0.24, 0.48, 0.40, CONC_DK)

# ── Left upper wing (closes void above GF terrace) ───────────
LUW_H  = ROOF_Z - (GH + TERR_T)
LUW_CX = (BL + UL) / 2
LUW_W  = UL - BL
LUW_CY = (UF + BB) / 2
LUW_D  = BB - UF
box('Concrete_LUW_Body',    LUW_CX, LUW_CY, GH + TERR_T, LUW_W, LUW_D, LUW_H, CONCRETE)
box('Plaster_LUW_Front',    LUW_CX, UF + 0.24, GH + TERR_T, LUW_W, 0.48, LUW_H, PLASTER)
box('PlasterDark_LUW_WRev', LUW_CX, UF + 0.14, GH + TERR_T + 0.60, LUW_W - 1.2, 0.22, 1.20, PLASTER_D)
box('GlassLt_LUW_Win',      LUW_CX, UF + 0.06, GH + TERR_T + 0.60, LUW_W - 1.2, 0.08, 1.20, GLASS_LT)
box('Plaster_TerrFrontLow', LUW_CX, BF + 0.24, GH + TERR_T,        LUW_W, 0.48, 1.20, PLASTER)
box('GlassLt_TerrFrontWin', LUW_CX, BF + 0.12, GH + TERR_T + 1.20, LUW_W, 0.10, LUW_H - 1.20, GLASS_LT)
box('Stone_LUW_LeftFace',   BL + 0.24, LUW_CY, GH + TERR_T, 0.48, LUW_D, LUW_H, STONE)

# Verandah pillars — full height to roof
for px in [4.0, 8.0, 12.0, 16.0, 20.0]:
    cyl(f'Concrete_Piloti_{px:.0f}', px, -1.2, 0, 0.15, ROOF_Z, CONCRETE, 16)
box('Coping_Verandah', BCX, -1.2, 0, BW, 2.4, 0.09, COPING)

# ═════════════════════════════════════════════════════════════
# 4. ROOF SLAB — flat cantilever with curved fascia edge
# ═════════════════════════════════════════════════════════════
ROOF_Z = UZ + UH
box('Concrete_RoofSlab', ROOF_CX, ROOF_CY, ROOF_Z, ROOF_W, ROOF_D, ROOF_T, CONCRETE)

# Curved fascia — half-cylinder rod running along front edge
FASCIA_Y = BF - 2.0
cyl('ConcDk_FasciaFront', ROOF_CX, FASCIA_Y, ROOF_Z, 0.18, ROOF_W + 0.20, CONC_DK, 24)
bpy.context.active_object.rotation_euler.y = math.radians(90)
bpy.ops.object.transform_apply(rotation=True)
# Flat fascia on sides
box('ConcDk_FasciaL', BL - 1.5 + 0.18, ROOF_CY, ROOF_Z - 0.02, 0.36, ROOF_D, 0.06, CONC_DK)
box('ConcDk_FasciaR', BR + 1.5 - 0.18, ROOF_CY, ROOF_Z - 0.02, 0.36, ROOF_D, 0.06, CONC_DK)

# Roof parapet
PAR_H = 0.38
box('ConcDk_ParF', ROOF_CX, BF - 2.0 + 0.12,  ROOF_Z + ROOF_T, ROOF_W, 0.24, PAR_H, CONC_DK)
box('ConcDk_ParB', ROOF_CX, BB + 2.0 - 0.12,  ROOF_Z + ROOF_T, ROOF_W, 0.24, PAR_H, CONC_DK)
box('ConcDk_ParL', BL - 1.5 + 0.12, ROOF_CY,  ROOF_Z + ROOF_T, 0.24, ROOF_D, PAR_H, CONC_DK)
box('ConcDk_ParR', BR + 1.5 - 0.12, ROOF_CY,  ROOF_Z + ROOF_T, 0.24, ROOF_D, PAR_H, CONC_DK)

# Rooftop planters
for rpx in [3.5, 7.5, 11.5]:
    box(f'Stone_RTrough_{rpx:.0f}', rpx, BF - 1.8, ROOF_Z + ROOF_T, 2.40, 0.56, 0.50, STONE)

# ═════════════════════════════════════════════════════════════
# 5. CARPORT — steel posts + thin slab
# ═════════════════════════════════════════════════════════════
for ox, od in [(-CW/2+0.4,-CD/2+0.4),(CW/2-0.4,-CD/2+0.4),
               (-CW/2+0.4, CD/2-0.4),(CW/2-0.4, CD/2-0.4)]:
    cyl(f'Steel_CCol_{ox:.0f}_{od:.0f}', CCX+ox, CCY+od, 0, 0.10, GH, STEEL_DK, 12)
box('Concrete_CarportRoof', CCX, CCY, GH, CW+0.40, CD+0.40, 0.20, CONCRETE)
box('ConcDk_CarportFascia', CCX, CF-0.20, GH, CW+0.40, 0.24, 0.24, CONC_DK)
box('Stone_CarportFloor',   CCX, CCY, 0, CW, CD, 0.08, STONE)

# ═════════════════════════════════════════════════════════════
# 6. SPIRAL EXTERNAL STAIRCASE
#    Helical treads rising from ground (Z=0) to GF terrace (Z=GH+TERR_T)
# ═════════════════════════════════════════════════════════════
STAIR_RISE = STAIR_TOTAL_RISE / N_TREADS
STAIR_SWEEP = math.pi * 1.75    # ~315° sweep
for i in range(N_TREADS):
    angle  = -math.pi / 2 + STAIR_SWEEP * i / N_TREADS
    tx = STAIR_CX + (STAIR_R - 0.4) * math.cos(angle)
    ty = STAIR_CY + (STAIR_R - 0.4) * math.sin(angle)
    tz = i * STAIR_RISE
    bpy.ops.mesh.primitive_cube_add(size=1, location=(tx, ty, tz + STAIR_RISE * 0.5))
    o = bpy.context.active_object
    o.name = f'Stone_STread{i:02d}'
    o.scale = (0.88, 0.34, STAIR_RISE + 0.02)
    o.rotation_euler.z = angle
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    o.data.materials.clear(); o.data.materials.append(STONE)
# Central column of spiral
cyl('Concrete_StairCore', STAIR_CX, STAIR_CY, 0, 0.30, GH + TERR_T + 0.20, CONCRETE, 16)
# Handrail torus rings at 1/3 and 2/3 height
for hr in [STAIR_TOTAL_RISE * 0.45, STAIR_TOTAL_RISE * 0.90]:
    ht = torus(f'Steel_StairRail_{hr:.2f}', STAIR_CX, STAIR_CY, hr,
               STAIR_R, 0.04, STEEL_DK, 48, 8)

# ═════════════════════════════════════════════════════════════
# 7. COMPOUND WALLS — all four sides
# ═════════════════════════════════════════════════════════════
SITE_DEPTH = WALL_YB - WALL_Y
SITE_CY    = (WALL_Y + WALL_YB) / 2

box('Stone_SiteWallL',  SITE_L - 0.18, SITE_CY, 0, WALL_T, SITE_DEPTH, WALL_H, STONE)
box('StoneDk_SiteCapL', SITE_L - 0.18, SITE_CY, WALL_H, WALL_T+0.10, SITE_DEPTH+0.10, 0.11, STONE_DK)
box('Stone_SiteWallR',  SITE_R + 0.18, SITE_CY, 0, WALL_T, SITE_DEPTH, WALL_H, STONE)
box('StoneDk_SiteCapR', SITE_R + 0.18, SITE_CY, WALL_H, WALL_T+0.10, SITE_DEPTH+0.10, 0.11, STONE_DK)
box('Stone_BackWall',    16.0, WALL_YB, 0, SITE_R + WALL_T, WALL_T, WALL_H, STONE)
box('StoneDk_BackWallCp',16.0, WALL_YB, WALL_H, SITE_R + WALL_T+0.10, WALL_T+0.10, 0.11, STONE_DK)

# Front wall — three sections
S1W=PG_L-0.40; S1CX=S1W/2
box('Stone_FWall_S1',  S1CX, WALL_Y, 0, S1W, WALL_T, WALL_H, STONE)
box('StoneDk_FCap_S1', S1CX, WALL_Y, WALL_H, S1W+0.08, WALL_T+0.08, 0.11, STONE_DK)
S2X0=PG_R+0.40; S2X1=VG_L-0.40; S2W=S2X1-S2X0; S2CX=(S2X0+S2X1)/2
box('Stone_FWall_S2',  S2CX, WALL_Y, 0, S2W, WALL_T, WALL_H, STONE)
box('StoneDk_FCap_S2', S2CX, WALL_Y, WALL_H, S2W+0.08, WALL_T+0.08, 0.11, STONE_DK)
S3X0=VG_R+0.40; S3W=SITE_R-S3X0; S3CX=(S3X0+SITE_R)/2
box('Stone_FWall_S3',  S3CX, WALL_Y, 0, S3W, WALL_T, WALL_H, STONE)
box('StoneDk_FCap_S3', S3CX, WALL_Y, WALL_H, S3W+0.08, WALL_T+0.08, 0.11, STONE_DK)

# Pedestrian gate pillars + arch rings on top
for pnm, px in [('PedL', PG_L), ('PedR', PG_R)]:
    box(f'Stone_PPillarBase{pnm}',  px, WALL_Y, 0,           0.72, 0.74, WALL_H+0.12, STONE)
    box(f'Concrete_PPillarUp{pnm}', px, WALL_Y, WALL_H+0.12, 0.62, 0.64, PIL_H-WALL_H, CONCRETE)
    box(f'StoneDk_PPillarCap{pnm}', px, WALL_Y, PIL_H,       0.84, 0.84, 0.16, STONE_DK)
    cyl(f'Steel_PLight{pnm}', px, WALL_Y, PIL_H+0.16, 0.10, 0.16, STEEL_DK, 12)
    # Decorative torus ring on pillar top
    tt = torus(f'Stone_PillarRing{pnm}', px, WALL_Y, PIL_H + 0.08,
               0.46, 0.07, COPING, 32, 8)
PED_OPEN = PG_R - PG_L - 0.74
for gz in [0.36, 0.78, 1.22]:
    box(f'TimberLt_PedBar_{gz:.2f}', (PG_L+PG_R)/2, WALL_Y, gz, PED_OPEN, 0.08, 0.05, TIMBER_LT)
for gxi in range(4):
    gx = PG_L + 0.48 + gxi * (PED_OPEN / 4)
    box(f'TimberLt_PedPicket{gxi}', gx, WALL_Y, 0.04, 0.055, 0.08, 1.22, TIMBER_LT)

# Vehicle gate pillars
for vnm, vx in [('VehL', VG_L), ('VehR', VG_R)]:
    box(f'Stone_VPillarBase{vnm}',  vx, WALL_Y, 0,           0.82, 0.84, WALL_H+0.12, STONE)
    box(f'Concrete_VPillarUp{vnm}', vx, WALL_Y, WALL_H+0.12, 0.72, 0.74, PIL_H-WALL_H, CONCRETE)
    box(f'StoneDk_VPillarCap{vnm}', vx, WALL_Y, PIL_H,       0.96, 0.96, 0.18, STONE_DK)
    cyl(f'Steel_VLight{vnm}', vx, WALL_Y, PIL_H+0.18, 0.12, 0.18, STEEL_DK, 12)
    tt2 = torus(f'Stone_VPillarRing{vnm}', vx, WALL_Y, PIL_H + 0.09,
                0.54, 0.08, COPING, 32, 8)
VEH_OPEN = VG_R - VG_L - 0.86
for gz2 in [0.36, 0.82, 1.28, 1.66]:
    box(f'Steel_VehBar_{gz2:.2f}', (VG_L+VG_R)/2, WALL_Y, gz2, VEH_OPEN, 0.07, 0.06, STEEL_DK)
for gxi2 in range(6):
    gx2 = VG_L + 0.50 + gxi2 * (VEH_OPEN / 6)
    box(f'Steel_VPicket{gxi2}', gx2, WALL_Y, 0.04, 0.06, 0.07, 1.70, STEEL_DK)

# ═════════════════════════════════════════════════════════════
# 8. DRIVEWAY + FORECOURTS
# ═════════════════════════════════════════════════════════════
DW_W = SITE_R - VG_L; DW_D = BF - WALL_Y
DW_CX = (VG_L + SITE_R) / 2; DW_CY = (WALL_Y + BF) / 2
box('Gravel_Driveway',     DW_CX, DW_CY, 0, DW_W, DW_D, 0.06, GRAVEL)
box('Stone_DrivewayKerbL', VG_L + 0.20, DW_CY, 0, 0.24, DW_D, 0.15, STONE)
box('Stone_DrivewayKerbR', SITE_R - 0.20, DW_CY, 0, 0.24, DW_D, 0.15, STONE)

# Pedestrian forecourt paving
PFC_W = (PG_R - PG_L) + 1.2; PFC_CX = (PG_L + PG_R) / 2
PFC_D = BF - WALL_Y; PFC_CY = (WALL_Y + BF) / 2
box('Stone_PedForecourt', PFC_CX, PFC_CY, 0, PFC_W, PFC_D, 0.07, STONE)
for sx3 in [-1.2, 0.0, 1.2]:
    box(f'StoneDk_PavingLine{sx3:.0f}', PFC_CX+sx3, PFC_CY, 0.07, 0.11, PFC_D-0.30, 0.04, STONE_DK)

# Entrance approach steps
for st in range(3):
    box(f'Coping_Step{st}', ARCH_CX, BF - 0.55 + st * 0.55, st * 0.07, 3.40, 0.50, 0.09, COPING)

# ═════════════════════════════════════════════════════════════
# 9. OVAL SWIMMING POOL
# ═════════════════════════════════════════════════════════════
# Rim shell — elliptical cylinder
oval_cyl('PoolRim_Shell',  POOL_CX, POOL_CY, -POOL_DEP, POOL_RX + 0.26, POOL_RY + 0.26, POOL_DEP + 0.14, POOLRIM, 64)
# Pool lining
oval_cyl('Stone_PoolLining', POOL_CX, POOL_CY, -POOL_DEP + 0.22, POOL_RX - 0.16, POOL_RY - 0.16, POOL_DEP, STONE_DK, 64)
# Water surface (flat disc)
oval_cyl('Glass_Water', POOL_CX, POOL_CY, -0.06, POOL_RX - 0.18, POOL_RY - 0.18, 0.04, WATER, 64)
# Coping edge — torus ring around oval pool
oval_cop = torus('Coping_PoolEdge', POOL_CX, POOL_CY, 0.10,
                 POOL_RX + 0.28, 0.22, COPING, 64, 12)
oval_cop.scale.y = (POOL_RY + 0.28) / (POOL_RX + 0.28)
bpy.ops.object.transform_apply(scale=True)
# Pool steps
for st2 in range(3):
    box(f'Stone_PoolStep{st2}', POOL_CX - POOL_RX + 0.20, POOL_CY + st2 * 0.55 - 0.55,
        -st2 * 0.30, 0.48, 3.20, 0.12, STONE)
# Pool deck terrace
PDECK_CY = (POOL_CY + POOL_RY + BF) / 2
PDECK_D  = BF - (POOL_CY + POOL_RY)
box('Coping_PoolTerrace', POOL_CX, PDECK_CY, 0, POOL_RX * 2 + 1.4, PDECK_D, 0.08, COPING)
# Loungers beside pool
for li, lx in enumerate([POOL_CX + POOL_RX + 0.90, POOL_CX + POOL_RX + 2.60]):
    box(f'TimberLt_Lounger{li}', lx, POOL_CY, 0.12, 2.00, 0.70, 0.09, TIMBER_LT)
    box(f'Concrete_LBack{li}',  lx + 0.50, POOL_CY, 0.22, 0.90, 0.70, 0.07, CONCRETE)

# ═════════════════════════════════════════════════════════════
# 10. CIRCULAR FOUNTAIN COURTYARD
# ═════════════════════════════════════════════════════════════
# Basin rim (torus)
fount_rim = torus('Stone_FountRim', FOUNT_CX, FOUNT_CY, 0.30, FOUNT_R, 0.20, STONE, 48, 10)
# Water dish (flat disc)
oval_cyl('Water_Fount', FOUNT_CX, FOUNT_CY, 0.22, FOUNT_R - 0.22, FOUNT_R - 0.22, 0.06, WATER, 32)
# Central column
cyl('Stone_FountColumn', FOUNT_CX, FOUNT_CY, 0, 0.18, 1.60, STONE, 16)
sphere('Stone_FountBall', FOUNT_CX, FOUNT_CY, 1.70, 0.22, STONE, 12, 9)
# Paved surround
oval_cyl('Coping_FountPaving', FOUNT_CX, FOUNT_CY, 0, FOUNT_R + 1.10, FOUNT_R + 1.10, 0.08, COPING, 32)

# ═════════════════════════════════════════════════════════════
# 11. LANDSCAPE
# ═════════════════════════════════════════════════════════════
plane('Grass_Ground', 16.0, 3.0, -0.05, 80.0, 60.0, GRASS)

# Left planting beds
box('Earth_PlantBedL',  0.50, BCY, 0,    0.80, BD + 2.0, 0.16, EARTH)
box('Crown_PlantFillL', 0.50, BCY, 0.16, 0.60, BD + 1.6, 0.28, CROWN)

# Front hedge
box('Crown_HedgeL', S1CX, WALL_Y + 0.52, WALL_H, S1W * 0.75, 0.54, 0.55, CROWN)

# Rear garden trees
for pcx, pcy, pr in [(1.5, 12.5, 0.80), (2.0, 10.0, 0.60),
                     (22.0, 12.0, 0.90), (24.0, 10.0, 0.65),
                     (28.0, 8.0,  0.55)]:
    sphere(f'Crown_Plant_{pcx:.0f}_{pcy:.0f}', pcx, pcy, pr, pr, CROWN, 10, 7)

# Boulders (left garden)
sphere('Stone_Boulder1', 0.70, 6.0, 0.42, 0.44, STONE, 8, 6)
sphere('Stone_Boulder2', 1.20, 5.0, 0.28, 0.30, STONE_DK, 8, 6)

# Circular planting island (right garden)
oval_cyl('Earth_PlantIsland', 26.0, 5.0, 0, 2.0, 2.0, 0.18, EARTH, 32)
sphere('Crown_IslandTree1', 25.5, 5.0, 1.0, 0.75, CROWN, 10, 7)
sphere('Crown_IslandTree2', 26.8, 5.2, 1.2, 0.55, CROWN, 10, 7)

# ═════════════════════════════════════════════════════════════
# 12. SCENE LIGHTING  — soft flat wash for linework
# ═════════════════════════════════════════════════════════════
bpy.ops.object.light_add(type='AREA', location=(10.0, -22.0, 24.0))
key = bpy.context.active_object; key.name = 'Sketch_Key'
key.rotation_euler = (math.radians(-18), 0, math.radians(-15))
key.data.energy = 240.0; key.data.color = (1.00, 0.98, 0.94); key.data.size = 32.0

bpy.ops.object.light_add(type='AREA', location=(26.0, 8.0, 16.0))
fill = bpy.context.active_object; fill.name = 'Sketch_Fill'
fill.rotation_euler = (math.radians(-18), 0, math.radians(52))
fill.data.energy = 100.0; fill.data.color = (0.94, 0.96, 1.00); fill.data.size = 24.0

bpy.ops.object.light_add(type='AREA', location=(BCX, BB + 10.0, 16.0))
rim = bpy.context.active_object; rim.name = 'Sketch_Rim'
rim.rotation_euler = (math.radians(38), 0, 0)
rim.data.energy = 55.0; rim.data.color = (0.92, 0.94, 0.97); rim.data.size = 20.0

# ═════════════════════════════════════════════════════════════
# 13. WORLD — warm paper white
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
bg.inputs['Strength'].default_value = 0.60

# ═════════════════════════════════════════════════════════════
# 14. CAMERA
# ═════════════════════════════════════════════════════════════
CAM_POS = mathutils.Vector((36.0, -18.0, 14.0))
CAM_TGT = mathutils.Vector((12.0,   3.5,  3.0))
bpy.ops.object.camera_add(location=CAM_POS)
cam = bpy.context.active_object; cam.name = 'Camera_Main'
cam.data.lens = 40   # slightly tighter for architectural look
cam.rotation_euler = (CAM_TGT - CAM_POS).normalized().to_track_quat('-Z','Y').to_euler()
bpy.context.scene.camera = cam

# ═════════════════════════════════════════════════════════════
# 15. RENDER SETTINGS — Cycles + two Freestyle line sets
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

# ── Freestyle — two passes: thick silhouette + thin crease ───
sc.render.use_freestyle = True
vl = sc.view_layers[0]
vl.use_freestyle = True
fl = vl.freestyle_settings
try:   fl.crease_angle = math.radians(40)   # lower = more edge detail on curves
except: pass

# ── Pass 1: thick silhouette lines ───────────────────────────
if fl.linesets:
    ls1 = fl.linesets[0]; ls1.name = "Silhouette"
else:
    ls1 = fl.linesets.new("Silhouette")
ls1.select_silhouette         = True
ls1.select_crease             = False
ls1.select_border             = True
ls1.select_edge_mark          = True
ls1.select_external_contour   = True
ls1.select_material_boundary  = False
ls1.select_suggestive_contour = False
try:
    ly1 = ls1.linestyle; ly1.name = "Ink_Thick"
    ly1.color = (0.04, 0.03, 0.01); ly1.alpha = 0.92; ly1.thickness = 2.4
except Exception as e: print(f"  Linestyle1 note: {e}")

# ── Pass 2: thin crease / detail lines ───────────────────────
try:
    ls2 = fl.linesets.new("Details")
    ls2.select_silhouette         = False
    ls2.select_crease             = True
    ls2.select_border             = False
    ls2.select_edge_mark          = False
    ls2.select_external_contour   = False
    ls2.select_material_boundary  = False
    ls2.select_suggestive_contour = False
    ly2 = ls2.linestyle; ly2.name = "Ink_Thin"
    ly2.color = (0.08, 0.06, 0.03); ly2.alpha = 0.70; ly2.thickness = 1.1
except Exception as e: print(f"  Linestyle2 note: {e}")

print()
print("="*64)
print("  Casa Nova v7 — curved linework render")
print("="*64)
objs = [o for o in bpy.data.objects if o.type == 'MESH']
print(f"  Mesh objects : {len(objs)}")
print(f"  Poly count   : {sum(len(o.data.polygons) for o in objs):,}")
print()
print("  NEW ELEMENTS:")
print("  · Cylindrical bay-window tower (front-left)")
print("  · Semi-circular entrance arch (torus ring)")
print("  · Elliptical swimming pool (oval cylinder)")
print("  · Spiral staircase (helix of stone treads)")
print("  · Circular fountain courtyard")
print("  · Curved fascia edge on cantilever roof")
print("  · Cylindrical pavilion (upper right wing)")
print("  · Decorative torus rings on gate pillars")
print()
print("  LINEWORK: 2 Freestyle passes (silhouette 2.4px + crease 1.1px)")
print("  Z  → Material Preview (sketch palette)")
print("  F12 → Render (Cycles 64spp + Freestyle)")
print()
print("  EXPORT → File > Export > glTF 2.0 > public/assets/base.glb")
print("="*64)
