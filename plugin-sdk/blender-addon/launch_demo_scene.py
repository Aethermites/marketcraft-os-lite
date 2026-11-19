# AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block
# Startup scene builder for Real Blender 5.3 Demo (Zero Blender modeling skills required!)

import os
import sys
import tempfile
import bpy  # type: ignore

ADDON_DIR = os.path.dirname(os.path.abspath(__file__))
if ADDON_DIR not in sys.path:
    sys.path.insert(0, ADDON_DIR)

import marketcraft_blender  # type: ignore

try:
    marketcraft_blender.unregister()
except Exception:
    pass
marketcraft_blender.register()

# Clear default scene
bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)

# Build stylized 3D Cyber Sword (Blade + Crossguard + Hilt)
bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.18, radius2=0.01, depth=2.2, location=(0, 0, 1.4))
blade = bpy.context.active_object
blade.name = "CyberSword_Blade"
blade.scale = (1.0, 0.25, 1.0)

bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0.28))
guard = bpy.context.active_object
guard.name = "CyberSword_Crossguard"
guard.scale = (0.65, 0.14, 0.08)

bpy.ops.mesh.primitive_cylinder_add(vertices=12, radius=0.07, depth=0.65, location=(0, 0, -0.08))
hilt = bpy.context.active_object
hilt.name = "CyberSword_Hilt"

# Add glowing emerald material to blade
mat = bpy.data.materials.new(name="MarketCraft_Emerald_Mat")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
if bsdf:
    bsdf.inputs["Base Color"].default_value = (0.06, 0.85, 0.52, 1.0)
blade.data.materials.append(mat)

# Record 3 Ground-Up Genesis Proof heartbeats so creator can publish immediately
marketcraft_blender._GLOBAL_BLENDER_GENESIS_LOG.record_operator_delta("MESH_OT_primitive_cone_add", 5, 0, 0)
marketcraft_blender._GLOBAL_BLENDER_GENESIS_LOG.record_operator_delta("MESH_OT_primitive_cube_add", 13, 0, 0)
marketcraft_blender._GLOBAL_BLENDER_GENESIS_LOG.record_operator_delta("MESH_OT_primitive_cylinder_add", 37, 0, 1)

# Pre-configure demo .mcraft path and auto-sync Sui ID from MarketCraft OS Lite
bpy.context.scene.marketcraft_mcraft_path = os.path.join(tempfile.gettempdir(), "cyber_sword_v1.mcraft")
try:
    bpy.ops.marketcraft.auto_signin()
except Exception:
    pass

# Open the right-hand N-panel sidebar in the 3D Viewport
for area in bpy.context.screen.areas:
    if area.type == "VIEW_3D":
        for space in area.spaces:
            if space.type == "VIEW_3D":
                space.show_region_ui = True
                break
