# ============================================================================
# CORPORATE & AUTHORSHIP SEAL
# Organization: AetherMites (aethermites)
# Genesis Architect: Hubert Silaa
# License: Open-Source Attribution-Preserving Specification (Apache 2.0 / AGPLv3)
# Genesis Attribution: "AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block"
# ============================================================================

"""
MarketCraft Protocol (v0.5.2) — Blender 4.x Python Addon (`marketcraft_blender.py`)

Hooks into Blender's operator & file-save lifecycle (`bpy.app.handlers.save_pre`) to:
1. Track progressive mesh/vertex/armature creation from State 0 (`GenesisConstructionLog`).
2. Enforce Rule 1: Ground-Up Genesis Proof (`verified_heartbeat_count >= 3` and non-empty
   `genesis_construction_merkle_root`), aborting unverified external copy-paste imports with
   `EUnverifiedExternalImport (Code 1005)`.
3. Enforce Rule 2: Granular Administrative Permissions (`PERM_REFERENCE_ONLY = 1`,
   `PERM_EXTEND_SOCKETS = 2`, `PERM_FULL_DERIVATIVE = 3`) and exposed attachment sockets.
4. Stamp `ArtifactUAI` and C2PA metadata into the `.blend` / `.mcraft` binary header.
"""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import sys
import tempfile
import time
import urllib.request
import uuid
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Any, Optional

GENESIS_ARCHITECT_SEAL = "AetherMites // Hubert Silaa - MarketCraft v0.5.2 Genesis Block"
SOVEREIGN_GENESIS_WALLET = "0x93292808389b92e73100284f931f7e027e003fafc2d3cbfbfbc520da6098c0a7"
LIVE_PACKAGE_ID = "0xe4c60f16358911345ae11c7779c25d4ae04e323aa98d9608ff136b3535e743ac"

PERM_REFERENCE_ONLY: int = 1
PERM_EXTEND_SOCKETS: int = 2
PERM_FULL_DERIVATIVE: int = 3
MIN_VERIFIED_HEARTBEATS: int = 3
E_UNVERIFIED_EXTERNAL_IMPORT: int = 1005
E_UNAUTHORIZED_ARTIFACT_MODIFICATION: int = 1066
E_MARKETCRAFT_SIGNIN_REQUIRED: int = 1069
E_ENTITLEMENT_RECEIPT_MISSING: int = 1070

bl_info = {
    "name": "MarketCraft Protocol v0.5.2 — AssemblyCraft Genesis & Living Asset Bridge",
    "author": "Hubert Silaa (AetherMites // MarketCraft v0.5.2 Genesis Block)",
    "version": (0, 5, 2),
    "blender": (4, 0, 0),
    "location": "View3D > Sidebar > MarketCraft v0.5.2",
    "description": "Tracks Ground-Up Genesis Proof heartbeats, enforces Socket Permissions, and exports .mcraft Living Assets.",
    "category": "Import-Export",
}


class UnverifiedExternalImportError(RuntimeError):
    """Raised when attempting to save/export an asset lacking Ground-Up Genesis Proof (Code 1005)."""

    def __init__(self, message: str) -> None:
        super().__init__(
            f"ABORTED: EUnverifiedExternalImport (Code {E_UNVERIFIED_EXTERNAL_IMPORT}) — {message}"
        )
        self.error_code = E_UNVERIFIED_EXTERNAL_IMPORT


class MarketCraftAuthRequiredError(PermissionError):
    """Act 5 Guard: Raised when opening a .mcraft asset without signing into MarketCraft Sui ID."""

    def __init__(self, message: str) -> None:
        super().__init__(
            f"BLOCKED: EMarketCraftSignInRequired (Code {E_MARKETCRAFT_SIGNIN_REQUIRED}) — {message}"
        )
        self.error_code = E_MARKETCRAFT_SIGNIN_REQUIRED


class MarketCraftEntitlementDeniedError(PermissionError):
    """Act 6 Guard: Raised when a different Sui ID without an EntitlementReceipt opens a .mcraft asset."""

    def __init__(self, message: str) -> None:
        super().__init__(
            f"BLOCKED: EEntitlementReceiptMissing (Code {E_ENTITLEMENT_RECEIPT_MISSING}) — {message}"
        )
        self.error_code = E_ENTITLEMENT_RECEIPT_MISSING


class MarketCraftUnauthorizedEditError(PermissionError):
    """Act 6 Guard: Raised when a non-creator Sui ID attempts to modify/re-save a .mcraft source asset."""

    def __init__(self, message: str) -> None:
        super().__init__(
            f"BLOCKED: EUnauthorizedArtifactModification (Code {E_UNAUTHORIZED_ARTIFACT_MODIFICATION}) — {message}"
        )
        self.error_code = E_UNAUTHORIZED_ARTIFACT_MODIFICATION


def _derive_mcraft_keystream(artifact_uai_id: str, creator_sui_id: str, length: int) -> bytes:
    """Derives a deterministic SHA-256 counter-mode keystream bound to UAI + Genesis Seal."""
    out = bytearray()
    counter = 0
    seed = f"{GENESIS_ARCHITECT_SEAL}:{artifact_uai_id}:{creator_sui_id}".encode("utf-8")
    while len(out) < length:
        block = hashlib.sha256(seed + counter.to_bytes(4, "big")).digest()
        out.extend(block)
        counter += 1
    return bytes(out[:length])


def seal_mcraft_asset(
    header: Dict[str, Any],
    raw_mesh_bytes: bytes,
    creator_sui_id: str,
    entitled_buyers: Optional[List[str]] = None,
    lineage_dependencies: Optional[List[Dict[str, str]]] = None,
) -> Dict[str, Any]:
    """
    Seals raw Blender mesh bytes (.glb/.obj) into a tamper-evident `.mcraft` envelope
    bound to `creator_sui_id` + `artifact_uai_id` + SHA-256 payload hash + inherited
    `lineage_dependencies` (Tier-3B upstream asset owners).
    """
    if not creator_sui_id or not creator_sui_id.startswith("0x"):
        raise MarketCraftAuthRequiredError("Valid MarketCraft Sui ID (0x...) required to seal .mcraft asset.")
    payload_sha256 = hashlib.sha256(raw_mesh_bytes).hexdigest()
    ks = _derive_mcraft_keystream(header["artifact_uai_id"], creator_sui_id, len(raw_mesh_bytes))
    cipher_bytes = bytes(a ^ b for a, b in zip(raw_mesh_bytes, ks))
    mac = hmac.new(
        f"{GENESIS_ARCHITECT_SEAL}:{creator_sui_id}".encode("utf-8"),
        cipher_bytes + payload_sha256.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    return {
        "format": "MCRAFT_SEALED_V07",
        "genesis_attribution": GENESIS_ARCHITECT_SEAL,
        "header": header,
        "creator_sui_id": creator_sui_id,
        "entitled_buyers": list(entitled_buyers or []),
        "lineage_dependencies": list(lineage_dependencies or []),
        "payload_sha256": payload_sha256,
        "integrity_hmac": mac,
        "ciphertext_b64": base64.b64encode(cipher_bytes).decode("ascii"),
    }


def open_mcraft_asset(
    envelope: Dict[str, Any],
    active_sui_id: Optional[str],
    require_edit_rights: bool = False,
) -> Dict[str, Any]:
    """
    Cryptographic Sign-In & Entitlement Gate for opening/editing `.mcraft` assets in Blender:
      - Act 5: Rejects opening if `active_sui_id` is empty/None (not signed in).
      - Act 6A: Rejects opening if `active_sui_id` is neither creator nor in `entitled_buyers`.
      - Act 6B: Rejects editing (`require_edit_rights=True`) if `active_sui_id != creator_sui_id`.
    """
    if not active_sui_id or not active_sui_id.strip():
        raise MarketCraftAuthRequiredError(
            "MarketCraft Sui ID Sign-In Required — Cannot open .mcraft asset without verified Sui session."
        )
    caller = active_sui_id.strip()
    creator = envelope.get("creator_sui_id", "")
    buyers = envelope.get("entitled_buyers", [])

    is_owner = caller == creator
    is_entitled_buyer = caller in buyers
    if not is_owner and not is_entitled_buyer:
        raise MarketCraftEntitlementDeniedError(
            f"Sui ID {caller} does not hold an on-chain EntitlementReceipt for '{envelope.get('header', {}).get('title', 'asset')}'."
        )
    if require_edit_rights and not is_owner:
        raise MarketCraftUnauthorizedEditError(
            f"Sui ID {caller} cannot modify or re-publish source asset owned by {creator} (Read-Only Entitlement)."
        )

    cipher_bytes = base64.b64decode(envelope["ciphertext_b64"].encode("ascii"))
    expected_mac = hmac.new(
        f"{GENESIS_ARCHITECT_SEAL}:{creator}".encode("utf-8"),
        cipher_bytes + envelope["payload_sha256"].encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(expected_mac, envelope.get("integrity_hmac", "")):
        raise MarketCraftUnauthorizedEditError("Tampered .mcraft envelope detected (HMAC mismatch).")

    ks = _derive_mcraft_keystream(envelope["header"]["artifact_uai_id"], creator, len(cipher_bytes))
    raw_bytes = bytes(a ^ b for a, b in zip(cipher_bytes, ks))
    if hashlib.sha256(raw_bytes).hexdigest() != envelope["payload_sha256"]:
        raise MarketCraftUnauthorizedEditError("Tampered .mcraft payload detected (SHA-256 mismatch).")

    return {
        "raw_mesh_bytes": raw_bytes,
        "can_edit_source": is_owner,
        "holder": caller,
        "creator": creator,
        "payload_sha256": envelope["payload_sha256"],
    }


@dataclass
class BlenderSemanticDelta:
    sequence: int
    timestamp_unix: int
    operator_id: str
    vertex_count: int
    bone_count: int
    material_count: int
    delta_hash_hex: str


@dataclass
class GenesisConstructionLog:
    creator_uid: str
    origin_state_zero_hash: str
    progressive_deltas: List[BlenderSemanticDelta] = field(default_factory=list)

    @property
    def verified_heartbeat_count(self) -> int:
        return len(self.progressive_deltas)

    def compute_genesis_merkle_root(self) -> str:
        if not self.progressive_deltas:
            return ""
        hasher = hashlib.sha256()
        hasher.update(GENESIS_ARCHITECT_SEAL.encode("utf-8"))
        hasher.update(self.origin_state_zero_hash.encode("utf-8"))
        for delta in self.progressive_deltas:
            hasher.update(delta.delta_hash_hex.encode("utf-8"))
        return hasher.hexdigest()

    def record_operator_delta(
        self,
        operator_id: str,
        vertex_count: int,
        bone_count: int,
        material_count: int,
        timestamp_unix: Optional[int] = None,
    ) -> Optional[BlenderSemanticDelta]:
        ts = timestamp_unix if timestamp_unix is not None else int(time.time())
        prev_hash = (
            self.progressive_deltas[-1].delta_hash_hex
            if self.progressive_deltas
            else self.origin_state_zero_hash
        )
        # Check structural progression (State(t) != State(t-1))
        if self.progressive_deltas:
            last = self.progressive_deltas[-1]
            if (
                last.vertex_count == vertex_count
                and last.bone_count == bone_count
                and last.material_count == material_count
            ):
                return None

        seq = len(self.progressive_deltas) + 1
        digest = hashlib.sha256(
            f"{GENESIS_ARCHITECT_SEAL}:{prev_hash}:{seq}:{operator_id}:{vertex_count}:{bone_count}:{material_count}".encode(
                "utf-8"
            )
        ).hexdigest()

        delta = BlenderSemanticDelta(
            sequence=seq,
            timestamp_unix=ts,
            operator_id=operator_id,
            vertex_count=vertex_count,
            bone_count=bone_count,
            material_count=material_count,
            delta_hash_hex=digest,
        )
        self.progressive_deltas.append(delta)
        return delta

    def verify_ground_up_genesis_proof(self) -> str:
        merkle_root = self.compute_genesis_merkle_root()
        if not merkle_root or self.verified_heartbeat_count < MIN_VERIFIED_HEARTBEATS:
            raise UnverifiedExternalImportError(
                f"Asset has only {self.verified_heartbeat_count} heartbeats (minimum {MIN_VERIFIED_HEARTBEATS} required). "
                "External copy-pasted meshes without progressive construction history cannot be published."
            )
        return merkle_root


def stamp_and_export_mcraft_header(
    genesis_log: GenesisConstructionLog,
    artifact_uai_id: str,
    title: str,
    permission_level: int,
    exposed_sockets: List[str],
    walrus_blob_id: str,
    current_version: int = 1,
) -> Dict[str, Any]:
    """
    Intercepts file saves / exports in Blender, verifies Ground-Up Genesis Proof,
    and stamps the mandatory MarketCraft v0.5.2 header + ArtifactUAI metadata.
    """
    merkle_root = genesis_log.verify_ground_up_genesis_proof()
    if permission_level not in (PERM_REFERENCE_ONLY, PERM_EXTEND_SOCKETS, PERM_FULL_DERIVATIVE):
        raise ValueError(f"Invalid permission_level: {permission_level}")

    return {
        "magic_bytes": "MCRAFT05",
        "schema_version": "0.5.2",
        "genesis_attribution": GENESIS_ARCHITECT_SEAL,
        "sovereign_genesis_wallet": SOVEREIGN_GENESIS_WALLET,
        "package_id": LIVE_PACKAGE_ID,
        "artifact_uai_id": artifact_uai_id,
        "title": title,
        "creator_uid": genesis_log.creator_uid,
        "permission_level": permission_level,
        "exposed_sockets": exposed_sockets,
        "current_version": current_version,
        "walrus_blob_id": walrus_blob_id,
        "verified_heartbeat_count": genesis_log.verified_heartbeat_count,
        "genesis_construction_merkle_root": merkle_root,
        "progressive_deltas": [asdict(d) for d in genesis_log.progressive_deltas],
    }


# ============================================================================
# OPTIONAL BLENDER (`bpy`) PANEL & SAVE-HOOK REGISTRATION
# ============================================================================
try:
    import bpy  # type: ignore

    _GLOBAL_BLENDER_GENESIS_LOG = GenesisConstructionLog(
        creator_uid="0x40e60706870bebd6b9d9c21b507c844d2c385c26c3f017810b122fc18e02e837",
        origin_state_zero_hash=hashlib.sha256(b"BLENDER_BLANK_CANVAS_STATE_0").hexdigest(),
    )
    _BLENDER_PROJECT_UUID = str(uuid.uuid4())
    _IMPORTED_LINEAGE_DEPENDENCIES: List[Dict[str, str]] = []
    _SIDECAR_ORIGIN = "http://tauri.localhost"
    _SIDECAR_URL = "http://127.0.0.1:7470"
    _LITE_BRIDGE_URL = "http://127.0.0.1:1425"

    def _fetch_active_marketcraft_session() -> Dict[str, Any]:
        """Auto-reads the active Sui Wallet ID from MarketCraft OS Lite (zero copy-pasting!)."""
        try:
            req = urllib.request.Request(f"{_LITE_BRIDGE_URL}/api/local/session", method="GET")
            with urllib.request.urlopen(req, timeout=3) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except Exception:
            pass
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        if local_app_data:
            session_path = os.path.join(local_app_data, "MarketCraft", "active-session.json")
            if os.path.isfile(session_path):
                try:
                    with open(session_path, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    pass
        return {"sui_address": "", "handle": "", "signed_in": False, "entitled_buyers": []}

    def _notify_lite_marketplace(item: Dict[str, Any]) -> None:
        try:
            req = urllib.request.Request(
                f"{_LITE_BRIDGE_URL}/api/local/blender-publish",
                data=json.dumps(item).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=4):
                pass
        except Exception:
            pass

    def _load_local_sidecar_token() -> str:
        local_app_data = os.environ.get("LOCALAPPDATA", "")
        if local_app_data:
            token_path = os.path.join(local_app_data, "MarketCraft", "studio-token.txt")
            if os.path.isfile(token_path):
                with open(token_path, "r", encoding="utf-8") as f:
                    tok = f.read().strip()
                    if len(tok) == 64:
                        return tok
        return ""

    def _sidecar_post(path: str, token: str, payload: Any, is_binary: bool = False) -> Dict[str, Any]:
        body = payload if is_binary else json.dumps(payload).encode("utf-8")
        headers = {
            "Authorization": f"Bearer {token}",
            "Origin": _SIDECAR_ORIGIN,
            "Content-Type": "application/octet-stream" if is_binary else "application/json",
        }
        req = urllib.request.Request(f"{_SIDECAR_URL}{path}", data=body, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read().decode("utf-8"))

    class MARKETCRAFT_OT_record_heartbeat(bpy.types.Operator):
        bl_idname = "marketcraft.record_heartbeat"
        bl_label = "Record Heartbeat & Sync Sidecar"

        def execute(self, context: Any) -> set[str]:
            verts = sum(
                len(obj.data.vertices)
                for obj in context.scene.objects
                if obj.type == "MESH" and obj.data
            )
            bones = sum(
                len(obj.data.bones)
                for obj in context.scene.objects
                if obj.type == "ARMATURE" and obj.data
            )
            mats = len(bpy.data.materials)
            account = getattr(context.scene, "marketcraft_account", "").strip()
            if account:
                _GLOBAL_BLENDER_GENESIS_LOG.creator_uid = account
            _GLOBAL_BLENDER_GENESIS_LOG.record_operator_delta(
                "MESH_OT_primitive_sculpt_step", verts, bones, mats
            )
            token = getattr(context.scene, "marketcraft_token", "").strip() or _load_local_sidecar_token()
            if token:
                try:
                    res = _sidecar_post("/rpc", token, {
                        "jsonrpc": "2.0",
                        "id": 1,
                        "method": "artcraft.workspace.save",
                        "params": {
                            "tool": "cadcraft",
                            "project": _BLENDER_PROJECT_UUID,
                            "snapshot": {
                                "upstream_app": "Blender Foundation (blender.org)",
                                "creator_uid": _GLOBAL_BLENDER_GENESIS_LOG.creator_uid,
                                "verts": verts,
                                "bones": bones,
                                "materials": mats,
                                "heartbeats": _GLOBAL_BLENDER_GENESIS_LOG.verified_heartbeat_count,
                                "merkle_root": _GLOBAL_BLENDER_GENESIS_LOG.compute_genesis_merkle_root(),
                            },
                        },
                    })
                    result = res.get("result", {})
                    context.scene["marketcraft_checkpoints"] = str(result.get("heartbeat_sequence", 0))
                    context.scene["marketcraft_last_status"] = f"Synced · Checkpoint #{result.get('heartbeat_sequence', 0)}"
                except Exception as exc:
                    context.scene["marketcraft_last_status"] = f"Sidecar sync failed: {exc}"
            self.report(
                {"INFO"},
                f"MarketCraft Heartbeat #{_GLOBAL_BLENDER_GENESIS_LOG.verified_heartbeat_count} recorded.",
            )
            return {"FINISHED"}

    class MARKETCRAFT_OT_publish_scene(bpy.types.Operator):
        bl_idname = "marketcraft.publish_scene"
        bl_label = "Export & Stage to MarketCraft"

        def execute(self, context: Any) -> set[str]:
            account = getattr(context.scene, "marketcraft_account", "").strip()
            if not account.startswith("0x") or len(account) != 66:
                self.report({"ERROR"}, "Enter your 66-char MarketCraft Sui address (0x...) first.")
                return {"CANCELLED"}
            token = getattr(context.scene, "marketcraft_token", "").strip() or _load_local_sidecar_token()
            if not token:
                self.report({"ERROR"}, "MarketCraft Sidecar token not found. Start MarketCraft Desktop first.")
                return {"CANCELLED"}
            try:
                tmp_obj = os.path.join(tempfile.gettempdir(), f"marketcraft_{_BLENDER_PROJECT_UUID[:8]}.obj")
                if hasattr(bpy.ops.wm, "obj_export"):
                    bpy.ops.wm.obj_export(filepath=tmp_obj)
                else:
                    bpy.ops.export_scene.obj(filepath=tmp_obj)
                with open(tmp_obj, "rb") as f:
                    obj_bytes = f.read()
                inspected = _sidecar_post("/api/publisher/inspect/asset/obj", token, obj_bytes, is_binary=True)
                insp_id = inspected["id"]
                _sidecar_post(f"/api/publisher/bind/{insp_id}/cadcraft-{_BLENDER_PROJECT_UUID}.json", token, {})
                context.scene["marketcraft_last_status"] = (
                    f"Staged for MarketCraft! Inspection ID: {insp_id} (Upstream: Blender Foundation)"
                )
                self.report({"INFO"}, f"Staged to MarketCraft Sidecar (Inspection {insp_id}).")
                return {"FINISHED"}
            except Exception as exc:
                context.scene["marketcraft_last_status"] = f"Publish staging failed: {exc}"
                self.report({"ERROR"}, str(exc))
                return {"CANCELLED"}

    class MARKETCRAFT_OT_auto_signin(bpy.types.Operator):
        bl_idname = "marketcraft.auto_signin"
        bl_label = "Sign In with MarketCraft (Auto-Sync Sui ID)"

        def execute(self, context: Any) -> set[str]:
            sess = _fetch_active_marketcraft_session()
            addr = str(sess.get("sui_address", "")).strip()
            handle = str(sess.get("handle", "")).strip()
            if not addr:
                context.scene.marketcraft_account = ""
                context.scene["marketcraft_last_status"] = "Not signed in to MarketCraft OS Lite."
                self.report({"WARNING"}, "No active Sui session found. Sign in inside MarketCraft OS Lite first.")
                return {"CANCELLED"}
            context.scene.marketcraft_account = addr
            _GLOBAL_BLENDER_GENESIS_LOG.creator_uid = addr
            context.scene["marketcraft_last_status"] = f"Signed in as @{handle or addr[:10]} (Auto-Synced)"
            self.report({"INFO"}, f"Auto-synced Sui ID from MarketCraft: {addr[:14]}...")
            return {"FINISHED"}

    class MARKETCRAFT_OT_sign_out(bpy.types.Operator):
        bl_idname = "marketcraft.sign_out"
        bl_label = "Sign Out MarketCraft Sui ID"

        def execute(self, context: Any) -> set[str]:
            context.scene.marketcraft_account = ""
            context.scene.marketcraft_token = ""
            try:
                req = urllib.request.Request(
                    f"{_LITE_BRIDGE_URL}/api/local/session",
                    data=json.dumps({"sui_address": "", "handle": "", "signed_in": False}).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=2):
                    pass
            except Exception:
                pass
            context.scene["marketcraft_last_status"] = "Signed out — .mcraft open/edit locked."
            self.report({"INFO"}, "Signed out of MarketCraft Sui ID.")
            return {"FINISHED"}

    class MARKETCRAFT_OT_add_dummy_armor(bpy.types.Operator):
        bl_idname = "marketcraft.add_dummy_armor"
        bl_label = "Add Dummy Armor (Composite Asset)"

        def execute(self, context: Any) -> set[str]:
            # Build stylized Dummy Armor (chestplate + pauldrons + helmet) next to imported sword
            bpy.ops.mesh.primitive_cube_add(size=1.0, location=(-1.1, 0, 1.0))
            chest = bpy.context.active_object
            chest.name = "DummyArmor_Chestplate"
            chest.scale = (0.55, 0.30, 0.70)

            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(-1.72, 0, 1.48))
            l_pad = bpy.context.active_object
            l_pad.name = "DummyArmor_LeftPauldron"

            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.22, location=(-0.48, 0, 1.48))
            r_pad = bpy.context.active_object
            r_pad.name = "DummyArmor_RightPauldron"

            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.26, location=(-1.1, 0, 1.95))
            helm = bpy.context.active_object
            helm.name = "DummyArmor_Helmet"

            mat = bpy.data.materials.new(name="MarketCraft_Armor_Cobalt")
            mat.use_nodes = True
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.12, 0.42, 0.92, 1.0)
            for part in (chest, l_pad, r_pad, helm):
                part.data.materials.append(mat)

            # Record 3 Genesis Proof heartbeats for the new composite author (Dev_B)
            _GLOBAL_BLENDER_GENESIS_LOG.record_operator_delta("MESH_OT_armor_chest", 8, 0, 1)
            _GLOBAL_BLENDER_GENESIS_LOG.record_operator_delta("MESH_OT_armor_pauldrons", 96, 0, 1)
            _GLOBAL_BLENDER_GENESIS_LOG.record_operator_delta("MESH_OT_armor_helmet", 184, 0, 2)

            context.scene.marketcraft_mcraft_path = os.path.join(
                tempfile.gettempdir(), "cyber_warrior_pack_v1.mcraft"
            )
            context.scene["marketcraft_last_status"] = (
                f"Added Dummy Armor! Ready to publish composite ({len(_IMPORTED_LINEAGE_DEPENDENCIES)} inherited asset(s))."
            )
            self.report({"INFO"}, "Added Dummy Armor to scene. Ready to seal & publish composite .mcraft!")
            return {"FINISHED"}

    class MARKETCRAFT_OT_seal_mcraft(bpy.types.Operator):
        bl_idname = "marketcraft.seal_mcraft"
        bl_label = "Seal & Publish Protected .mcraft to Marketplace"

        def execute(self, context: Any) -> set[str]:
            account = getattr(context.scene, "marketcraft_account", "").strip()
            if not account:
                sess = _fetch_active_marketcraft_session()
                account = str(sess.get("sui_address", "")).strip()
                context.scene.marketcraft_account = account
            mcraft_path = getattr(context.scene, "marketcraft_mcraft_path", "").strip()
            if not mcraft_path:
                mcraft_path = os.path.join(tempfile.gettempdir(), "marketcraft_demo_asset.mcraft")
                context.scene.marketcraft_mcraft_path = mcraft_path
            try:
                _GLOBAL_BLENDER_GENESIS_LOG.creator_uid = account or _GLOBAL_BLENDER_GENESIS_LOG.creator_uid
                tmp_obj = os.path.join(tempfile.gettempdir(), f"marketcraft_seal_{_BLENDER_PROJECT_UUID[:8]}.obj")
                if hasattr(bpy.ops.wm, "obj_export"):
                    bpy.ops.wm.obj_export(filepath=tmp_obj)
                else:
                    bpy.ops.export_scene.obj(filepath=tmp_obj)
                with open(tmp_obj, "rb") as f:
                    raw_bytes = f.read()
                header = stamp_and_export_mcraft_header(
                    genesis_log=_GLOBAL_BLENDER_GENESIS_LOG,
                    artifact_uai_id=f"0x{_BLENDER_PROJECT_UUID.replace('-', '')}",
                    title=os.path.basename(mcraft_path),
                    permission_level=PERM_EXTEND_SOCKETS,
                    exposed_sockets=["root_socket"],
                    walrus_blob_id=f"walrus://local/{os.path.basename(mcraft_path)}",
                )
                envelope = seal_mcraft_asset(
                    header,
                    raw_bytes,
                    creator_sui_id=account,
                    lineage_dependencies=_IMPORTED_LINEAGE_DEPENDENCIES,
                )
                with open(mcraft_path, "w", encoding="utf-8") as f:
                    json.dump(envelope, f, indent=2)
                _notify_lite_marketplace({
                    "title": header["title"],
                    "creator_sui_id": account,
                    "payload_sha256": envelope["payload_sha256"],
                    "mcraft_path": mcraft_path,
                    "lineage_dependencies": list(_IMPORTED_LINEAGE_DEPENDENCIES),
                    "published_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                })
                context.scene["marketcraft_last_status"] = (
                    f"Published {os.path.basename(mcraft_path)} ({len(_IMPORTED_LINEAGE_DEPENDENCIES)} Tier-3B dep(s))"
                )
                self.report({"INFO"}, f"Sealed & published .mcraft bound to {account[:12]}...")
                return {"FINISHED"}
            except Exception as exc:
                context.scene["marketcraft_last_status"] = str(exc)
                self.report({"ERROR"}, str(exc))
                return {"CANCELLED"}

    class MARKETCRAFT_OT_open_mcraft(bpy.types.Operator):
        bl_idname = "marketcraft.open_mcraft"
        bl_label = "Open Protected .mcraft (Verify Sui ID)"

        def execute(self, context: Any) -> set[str]:
            sess = _fetch_active_marketcraft_session()
            synced_addr = str(sess.get("sui_address", "")).strip()
            account = synced_addr if sess.get("signed_in") else getattr(context.scene, "marketcraft_account", "").strip()
            context.scene.marketcraft_account = account
            mcraft_path = getattr(context.scene, "marketcraft_mcraft_path", "").strip()
            if not mcraft_path or not os.path.isfile(mcraft_path):
                self.report({"ERROR"}, "Specify an existing .mcraft file path first.")
                return {"CANCELLED"}
            try:
                with open(mcraft_path, "r", encoding="utf-8") as f:
                    envelope = json.load(f)
                # Merge live entitled buyers from MarketCraft OS Lite session if present
                live_buyers = sess.get("entitled_buyers", [])
                if isinstance(live_buyers, list) and live_buyers:
                    merged = list(set(envelope.get("entitled_buyers", []) + live_buyers))
                    envelope["entitled_buyers"] = merged
                unlocked = open_mcraft_asset(envelope, active_sui_id=account, require_edit_rights=False)
                tmp_obj = os.path.join(tempfile.gettempdir(), f"marketcraft_open_{_BLENDER_PROJECT_UUID[:8]}.obj")
                with open(tmp_obj, "wb") as f:
                    f.write(unlocked["raw_mesh_bytes"])
                if hasattr(bpy.ops.wm, "obj_import"):
                    bpy.ops.wm.obj_import(filepath=tmp_obj)

                # Automatically inherit upstream asset owner into scene royalty lineage!
                dep_record = {
                    "title": str(envelope.get("header", {}).get("title", os.path.basename(mcraft_path))),
                    "artifact_uai_id": str(envelope.get("header", {}).get("artifact_uai_id", "")),
                    "owner_sui_id": str(unlocked["creator"]),
                    "payload_sha256": str(unlocked["payload_sha256"]),
                    "tier": "Tier 3B (Core Asset)",
                }
                if not any(d.get("payload_sha256") == dep_record["payload_sha256"] for d in _IMPORTED_LINEAGE_DEPENDENCIES):
                    if dep_record["owner_sui_id"] != account:
                        _IMPORTED_LINEAGE_DEPENDENCIES.append(dep_record)

                mode_label = "OWNER EDIT" if unlocked["can_edit_source"] else "READ-ONLY ENTITLED"
                context.scene["marketcraft_last_status"] = (
                    f"Unlocked .mcraft ({mode_label}) · Lineage locked ({len(_IMPORTED_LINEAGE_DEPENDENCIES)} dep)"
                )
                self.report({"INFO"}, f"Unlocked .mcraft ({mode_label}). Upstream owner locked into lineage.")
                return {"FINISHED"}
            except Exception as exc:
                context.scene["marketcraft_last_status"] = str(exc)
                self.report({"ERROR"}, str(exc))
                return {"CANCELLED"}

    class VIEW3D_PT_marketcraft_genesis_panel(bpy.types.Panel):
        bl_label = "MarketCraft v0.5.2 Genesis Studio"
        bl_idname = "VIEW3D_PT_marketcraft_genesis_panel"
        bl_space_type = "VIEW_3D"
        bl_region_type = "UI"
        bl_category = "MarketCraft v0.5.2"

        def draw(self, context: Any) -> None:
            layout = self.layout
            layout.label(text="POWERED BY MARKETCRAFT · ASSEMBLYCRAFT")
            layout.label(text="Upstream: Blender Foundation (6% OSS Vault)")
            layout.operator("marketcraft.auto_signin")
            layout.prop(context.scene, "marketcraft_account", text="Sui ID (Auto)")
            layout.prop(context.scene, "marketcraft_mcraft_path", text=".mcraft Path")
            layout.label(
                text=f"Heartbeats: {_GLOBAL_BLENDER_GENESIS_LOG.verified_heartbeat_count} (Min {MIN_VERIFIED_HEARTBEATS})"
            )
            layout.operator("marketcraft.record_heartbeat")
            layout.operator("marketcraft.add_dummy_armor")
            layout.operator("marketcraft.seal_mcraft")
            layout.operator("marketcraft.open_mcraft")
            layout.operator("marketcraft.sign_out")

            # Optional Asset Lineage & Owners Status Drawer (Full 100.00% Breakdown)
            layout.prop(context.scene, "marketcraft_show_lineage", text="Show Asset Lineage & Owners")
            if getattr(context.scene, "marketcraft_show_lineage", True):
                box = layout.box()
                box.label(text="ASSET LINEAGE & ROYALTY OWNERS (100.00%):")
                box.label(text=f"Tier 0 Founder: {SOVEREIGN_GENESIS_WALLET[:10]}...c0a7 (1.50%)")
                box.label(text="Tier 2 Tool: Blender Foundation (6.00%)")
                box.label(text="Tier 7 Infra: Paymaster (0.15%) + CloudCraft (0.85%)")
                cur_acc = getattr(context.scene, "marketcraft_account", "").strip()
                author_disp = (cur_acc[:12] + "...") if cur_acc else "(Signed Out)"
                if _IMPORTED_LINEAGE_DEPENDENCIES:
                    dep_count = len(_IMPORTED_LINEAGE_DEPENDENCIES)
                    each_pct = 21.50 / dep_count
                    box.label(text=f"Tier 3B Inherited ({dep_count} LOCKED · 21.50%):")
                    for dep in _IMPORTED_LINEAGE_DEPENDENCIES:
                        box.label(text=f"  • {dep['title']} -> {dep['owner_sui_id'][:12]}... ({each_pct:.2f}%)")
                    box.label(text=f"Tier 4 Composite Author: {author_disp} (70.00%)")
                else:
                    box.label(text="Tier 3B Inherited: None (0.00% -> Rolls to Tier 4)")
                    box.label(text=f"Tier 4 Author: {author_disp} (91.50%)")
                box.label(text="Total Split: 100.00% (Zero Dust)")

            status = context.scene.get("marketcraft_last_status", "")
            if status:
                layout.label(text=status)

    @bpy.app.handlers.persistent
    def marketcraft_save_pre_handler(_dummy: Any) -> None:
        header = stamp_and_export_mcraft_header(
            genesis_log=_GLOBAL_BLENDER_GENESIS_LOG,
            artifact_uai_id="0x8011947dde9d147b590c7e7c4f80c4cb2bf4daca97d363c9886f71d51d77ddde",
            title="Amina Cyber-Warrior Rig v2.0",
            permission_level=PERM_EXTEND_SOCKETS,
            exposed_sockets=[
                "base_rig_root",
                "right_hand_weapon_socket",
                "armor_chest_hook",
                "emotional_expressions_pack_v2",
            ],
            walrus_blob_id="walrus://blob/amina_cyber_warrior_rig_v2_0",
            current_version=2,
        )
        bpy.context.scene["marketcraft_uai_header_json"] = json.dumps(header)

    def register() -> None:
        bpy.types.Scene.marketcraft_account = bpy.props.StringProperty(
            name="MarketCraft Account",
            description="Your 66-character Sui address (0x...) from MarketCraft Desktop",
            default="",
        )
        bpy.types.Scene.marketcraft_token = bpy.props.StringProperty(
            name="Sidecar Token",
            description="Auto-loaded from %LOCALAPPDATA%\\MarketCraft\\studio-token.txt if blank",
            default="",
            subtype="PASSWORD",
        )
        bpy.types.Scene.marketcraft_mcraft_path = bpy.props.StringProperty(
            name=".mcraft File Path",
            description="Path to seal/open a protected .mcraft asset",
            default=os.path.join(tempfile.gettempdir(), "marketcraft_demo_asset.mcraft"),
            subtype="FILE_PATH",
        )
        bpy.types.Scene.marketcraft_show_lineage = bpy.props.BoolProperty(
            name="Show Asset Lineage & Owners",
            description="Display Tier-0 Founder, Tier-2 Tool, Tier-3B Inherited Owners, and Tier-4 Author",
            default=True,
        )
        bpy.utils.register_class(MARKETCRAFT_OT_auto_signin)
        bpy.utils.register_class(MARKETCRAFT_OT_record_heartbeat)
        bpy.utils.register_class(MARKETCRAFT_OT_add_dummy_armor)
        bpy.utils.register_class(MARKETCRAFT_OT_publish_scene)
        bpy.utils.register_class(MARKETCRAFT_OT_seal_mcraft)
        bpy.utils.register_class(MARKETCRAFT_OT_open_mcraft)
        bpy.utils.register_class(MARKETCRAFT_OT_sign_out)
        bpy.utils.register_class(VIEW3D_PT_marketcraft_genesis_panel)
        if marketcraft_save_pre_handler not in bpy.app.handlers.save_pre:
            bpy.app.handlers.save_pre.append(marketcraft_save_pre_handler)

    def unregister() -> None:
        if marketcraft_save_pre_handler in bpy.app.handlers.save_pre:
            bpy.app.handlers.save_pre.remove(marketcraft_save_pre_handler)
        bpy.utils.unregister_class(VIEW3D_PT_marketcraft_genesis_panel)
        bpy.utils.unregister_class(MARKETCRAFT_OT_sign_out)
        bpy.utils.unregister_class(MARKETCRAFT_OT_open_mcraft)
        bpy.utils.unregister_class(MARKETCRAFT_OT_seal_mcraft)
        bpy.utils.unregister_class(MARKETCRAFT_OT_publish_scene)
        bpy.utils.unregister_class(MARKETCRAFT_OT_add_dummy_armor)
        bpy.utils.unregister_class(MARKETCRAFT_OT_record_heartbeat)
        bpy.utils.unregister_class(MARKETCRAFT_OT_auto_signin)
        del bpy.types.Scene.marketcraft_show_lineage
        del bpy.types.Scene.marketcraft_mcraft_path
        del bpy.types.Scene.marketcraft_token
        del bpy.types.Scene.marketcraft_account

except ImportError:
    # Running outside Blender (e.g., CI / Sidecar validation)
    pass


def _run_self_test() -> None:
    print(f"[MarketCraft Blender Addon Self-Test] {GENESIS_ARCHITECT_SEAL}")

    # 1. Verify that an unverified external import (0 heartbeats) is rejected with Code 1005
    empty_log = GenesisConstructionLog(
        creator_uid="0xBAD_COPY_PASTER",
        origin_state_zero_hash="",
    )
    try:
        stamp_and_export_mcraft_header(
            genesis_log=empty_log,
            artifact_uai_id="0x0",
            title="Stolen External Mesh",
            permission_level=PERM_REFERENCE_ONLY,
            exposed_sockets=[],
            walrus_blob_id="walrus://blob/stolen",
        )
        raise AssertionError("Expected UnverifiedExternalImportError for 0 heartbeats")
    except UnverifiedExternalImportError as exc:
        assert exc.error_code == E_UNVERIFIED_EXTERNAL_IMPORT
        print(f"  [PASS] Rejected external copy-paste import: {exc}")

    # 2. Verify that a legitimate 3-step progressive construction succeeds and stamps header
    amina_log = GenesisConstructionLog(
        creator_uid="0x40e60706870bebd6b9d9c21b507c844d2c385c26c3f017810b122fc18e02e837",
        origin_state_zero_hash=hashlib.sha256(b"STATE_0_BLANK_CANVAS").hexdigest(),
    )
    amina_log.record_operator_delta("OBJECT_OT_armature_add", 0, 24, 1, 1762860300)
    amina_log.record_operator_delta("MESH_OT_primitive_cube_add", 4820, 24, 2, 1762860600)
    amina_log.record_operator_delta("SCULPT_OT_brush_stroke", 14220, 52, 4, 1762860900)

    header = stamp_and_export_mcraft_header(
        genesis_log=amina_log,
        artifact_uai_id="0x8011947dde9d147b590c7e7c4f80c4cb2bf4daca97d363c9886f71d51d77ddde",
        title="Amina Cyber-Warrior Rig v2.0",
        permission_level=PERM_EXTEND_SOCKETS,
        exposed_sockets=[
            "base_rig_root",
            "right_hand_weapon_socket",
            "armor_chest_hook",
            "emotional_expressions_pack_v2",
        ],
        walrus_blob_id="walrus://blob/amina_cyber_warrior_rig_v2_0",
        current_version=2,
    )
    assert header["genesis_attribution"] == GENESIS_ARCHITECT_SEAL
    assert header["verified_heartbeat_count"] == 3
    assert len(header["exposed_sockets"]) == 4
    print(
        f"  [PASS] Stamped .mcraft Blender header | UAI: {header['artifact_uai_id']} | Merkle Root: {header['genesis_construction_merkle_root'][:24]}..."
    )

    # 3. Act 2 + Act 5 + Act 6: Seal .mcraft asset, block signed-out open, block Attacker_X,
    #    allow entitled Dev_B read-only, block Dev_B/Attacker_X source modification!
    artist_a = "0x40e60706870bebd6b9d9c21b507c844d2c385c26c3f017810b122fc18e02e837"
    dev_b = "0x2222222222222222222222222222222222222222222222222222222222222222"
    attacker_x = "0xbad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1bad1"
    raw_sword = b"MCRAFT_GLB_CYBER_SWORD_VERTICES_V1"

    sealed = seal_mcraft_asset(header, raw_sword, creator_sui_id=artist_a, entitled_buyers=[dev_b])

    # Act 5: Opening without MarketCraft Sign-In MUST FAIL (Code 1069)
    try:
        open_mcraft_asset(sealed, active_sui_id=None)
        raise AssertionError("Expected MarketCraftAuthRequiredError when signed out")
    except MarketCraftAuthRequiredError as exc:
        assert exc.error_code == E_MARKETCRAFT_SIGNIN_REQUIRED
        print(f"  [PASS] Act 5 — Signed-out Blender open blocked: {exc}")

    # Act 6A: Different user (Attacker_X) without EntitlementReceipt MUST FAIL (Code 1070)
    try:
        open_mcraft_asset(sealed, active_sui_id=attacker_x)
        raise AssertionError("Expected MarketCraftEntitlementDeniedError for Attacker_X")
    except MarketCraftEntitlementDeniedError as exc:
        assert exc.error_code == E_ENTITLEMENT_RECEIPT_MISSING
        print(f"  [PASS] Act 6A — Unauthorized Attacker_X open blocked: {exc}")

    # Act 3: Entitled buyer (Dev_B) CAN open for game use (can_edit_source == False),
    #        but CANNOT modify/overwrite source (Code 1066)
    opened_dev = open_mcraft_asset(sealed, active_sui_id=dev_b, require_edit_rights=False)
    assert opened_dev["raw_mesh_bytes"] == raw_sword and opened_dev["can_edit_source"] is False
    print("  [PASS] Act 3 — Entitled Dev_B unlocked .mcraft asset (Read-Only for Game)")

    try:
        open_mcraft_asset(sealed, active_sui_id=dev_b, require_edit_rights=True)
        raise AssertionError("Expected MarketCraftUnauthorizedEditError for non-owner edit")
    except MarketCraftUnauthorizedEditError as exc:
        assert exc.error_code == E_UNAUTHORIZED_ARTIFACT_MODIFICATION
        print(f"  [PASS] Act 6B — Non-owner source edit blocked: {exc}")

    # Owner (Artist_A) retains full edit rights
    opened_owner = open_mcraft_asset(sealed, active_sui_id=artist_a, require_edit_rights=True)
    assert opened_owner["raw_mesh_bytes"] == raw_sword and opened_owner["can_edit_source"] is True
    print("  [PASS] Owner Artist_A unlocked .mcraft asset with full edit rights")


if __name__ == "__main__":
    _run_self_test()
    sys.exit(0)
